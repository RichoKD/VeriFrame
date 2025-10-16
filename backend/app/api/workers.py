from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.database import get_db_session
from app.models import Worker, Job, ReputationHistory
from app.schemas.workers import (
    WorkerResponse, 
    WorkerCreate, 
    WorkerUpdate, 
    WorkerRegistration,
    ReputationHistoryResponse
)
from app.services.starknet_client import get_starknet_client
from app.auth.dependencies import (
    require_authenticated_worker, 
    require_admin_worker, 
    get_optional_current_worker
)
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[WorkerResponse])
async def get_workers(
    skip: int = Query(0, ge=0, description="Number of workers to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of workers to return"),
    verified_only: bool = Query(False, description="Return only verified workers"),
    active_only: bool = Query(True, description="Return only active workers"),
    min_reputation: Optional[int] = Query(None, ge=0, le=1000, description="Minimum reputation score"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get list of workers with optional filtering"""
    query = select(Worker)
    
    if verified_only:
        query = query.where(Worker.verified == True)
    
    if active_only:
        query = query.where(Worker.active == True)
    
    if min_reputation is not None:
        query = query.where(Worker.reputation >= min_reputation)
    
    query = query.offset(skip).limit(limit).order_by(Worker.reputation.desc())
    
    result = await db.execute(query)
    workers = result.scalars().all()
    
    return workers

@router.get("/{worker_address}", response_model=WorkerResponse)
async def get_worker(
    worker_address: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get worker by address"""
    query = select(Worker).where(Worker.address == worker_address)
    result = await db.execute(query)
    worker = result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    return worker

@router.post("/register", response_model=WorkerResponse)
async def register_worker(
    registration: WorkerRegistration,
    db: AsyncSession = Depends(get_db_session)
):
    """Register a new worker (mirrors on-chain registration)"""
    # Check if worker already exists
    query = select(Worker).where(Worker.address == registration.address)
    result = await db.execute(query)
    existing_worker = result.scalar_one_or_none()
    
    if existing_worker:
        raise HTTPException(status_code=400, detail="Worker already registered")
    
    # Create new worker
    worker = Worker(
        address=registration.address,
        public_key=registration.public_key,
        info_cid=registration.info_cid,
        capabilities=registration.capabilities,
        hardware_specs=registration.hardware_specs,
        contact_info=registration.contact_info
    )
    
    db.add(worker)
    await db.commit()
    await db.refresh(worker)
    
    logger.info(f"Worker registered: {worker.address}")
    return worker

@router.put("/{worker_address}", response_model=WorkerResponse)
async def update_worker(
    worker_address: str,
    updates: WorkerUpdate,
    current_worker: Worker = Depends(require_authenticated_worker),
    db: AsyncSession = Depends(get_db_session)
):
    """Update worker information (only own profile or admin)"""
    # Workers can only update their own profile, admins can update any
    if current_worker.address != worker_address and not current_worker.is_admin:
        raise HTTPException(
            status_code=403,
            detail="Can only update own worker profile"
        )
    
    query = select(Worker).where(Worker.address == worker_address)
    result = await db.execute(query)
    worker = result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Update fields if provided
    update_data = updates.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(worker, field, value)
    
    await db.commit()
    await db.refresh(worker)
    
    logger.info(f"Worker updated: {worker.address} by {current_worker.address}")
    return worker

@router.post("/{worker_address}/verify")
async def verify_worker(
    worker_address: str,
    admin_worker: Worker = Depends(require_admin_worker),
    db: AsyncSession = Depends(get_db_session)
):
    """Verify a worker (admin only)"""
    query = select(Worker).where(Worker.address == worker_address)
    result = await db.execute(query)
    worker = result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    worker.verified = True
    worker.verified_by = admin_worker.address
    worker.verified_at = func.now()
    
    await db.commit()
    
    logger.info(f"Worker verified: {worker.address} by {admin_worker.address}")
    return {"message": "Worker verified successfully"}

@router.get("/{worker_address}/reputation-history", response_model=List[ReputationHistoryResponse])
async def get_worker_reputation_history(
    worker_address: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session)
):
    """Get worker's reputation history"""
    # First check if worker exists
    worker_query = select(Worker).where(Worker.address == worker_address)
    worker_result = await db.execute(worker_query)
    worker = worker_result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Get reputation history
    query = select(ReputationHistory).where(
        ReputationHistory.worker_id == worker.id
    ).order_by(ReputationHistory.timestamp.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    history = result.scalars().all()
    
    return history

@router.get("/{worker_address}/jobs", response_model=List[dict])
async def get_worker_jobs(
    worker_address: str,
    status: Optional[str] = Query(None, description="Filter by job status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session)
):
    """Get jobs assigned to a worker"""
    # First check if worker exists
    worker_query = select(Worker).where(Worker.address == worker_address)
    worker_result = await db.execute(worker_query)
    worker = worker_result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Get worker's jobs
    query = select(Job).where(Job.worker_id == worker.id)
    
    if status:
        query = query.where(Job.status == status)
    
    query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return jobs

@router.get("/stats/overview")
async def get_workers_stats(db: AsyncSession = Depends(get_db_session)):
    """Get overall worker statistics"""
    # Total workers
    total_query = select(func.count(Worker.id))
    total_result = await db.execute(total_query)
    total_workers = total_result.scalar()
    
    # Verified workers
    verified_query = select(func.count(Worker.id)).where(Worker.verified == True)
    verified_result = await db.execute(verified_query)
    verified_workers = verified_result.scalar()
    
    # Active workers
    active_query = select(func.count(Worker.id)).where(Worker.active == True)
    active_result = await db.execute(active_query)
    active_workers = active_result.scalar()
    
    # Average reputation
    avg_reputation_query = select(func.avg(Worker.reputation)).where(Worker.active == True)
    avg_reputation_result = await db.execute(avg_reputation_query)
    avg_reputation = avg_reputation_result.scalar() or 0
    
    return {
        "total_workers": total_workers,
        "verified_workers": verified_workers,
        "active_workers": active_workers,
        "average_reputation": round(float(avg_reputation), 2)
    }
