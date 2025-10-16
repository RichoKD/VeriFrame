from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db_session
from app.models import Job, Worker, JobEvent
from app.schemas.jobs import (
    JobResponse, 
    JobCreate, 
    JobUpdate, 
    JobAssignment,
    JobCompletion,
    JobEventResponse
)
from app.services.starknet_client import get_starknet_client
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[JobResponse])
async def get_jobs(
    skip: int = Query(0, ge=0, description="Number of jobs to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of jobs to return"),
    status: Optional[str] = Query(None, description="Filter by job status"),
    creator_address: Optional[str] = Query(None, description="Filter by creator address"),
    worker_address: Optional[str] = Query(None, description="Filter by assigned worker"),
    min_reward: Optional[int] = Query(None, ge=0, description="Minimum reward amount"),
    min_reputation_required: Optional[int] = Query(None, ge=0, le=1000, description="Minimum reputation required"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get list of jobs with optional filtering"""
    query = select(Job)
    
    if status:
        query = query.where(Job.status == status)
    
    if creator_address:
        query = query.where(Job.creator_address == creator_address)
    
    if worker_address:
        # Join with Worker table to filter by worker address
        query = query.join(Worker, Job.worker_id == Worker.id).where(Worker.address == worker_address)
    
    if min_reward is not None:
        query = query.where(Job.reward_amount >= min_reward)
    
    if min_reputation_required is not None:
        query = query.where(Job.min_reputation >= min_reputation_required)
    
    query = query.order_by(Job.created_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return jobs

@router.get("/available", response_model=List[JobResponse])
async def get_available_jobs(
    worker_address: Optional[str] = Query(None, description="Check eligibility for specific worker"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session)
):
    """Get available jobs (open status, not yet assigned)"""
    query = select(Job).where(
        and_(
            Job.status == "open",
            Job.worker_id.is_(None),
            Job.deadline > func.now()
        )
    )
    
    # If worker address provided, filter by their eligibility
    if worker_address:
        worker_query = select(Worker).where(Worker.address == worker_address)
        worker_result = await db.execute(worker_query)
        worker = worker_result.scalar_one_or_none()
        
        if worker:
            query = query.where(
                and_(
                    Job.min_reputation <= worker.reputation,
                    worker.verified == True,
                    worker.active == True
                )
            )
    
    query = query.order_by(Job.reward_amount.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    jobs = result.scalars().all()
    
    return jobs

@router.get("/{job_id}", response_model=JobResponse)
async def get_job(
    job_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get job by ID (UUID or chain job ID)"""
    # Try to parse as UUID first, then as integer
    try:
        # Try UUID format
        query = select(Job).where(Job.id == job_id)
        result = await db.execute(query)
        job = result.scalar_one_or_none()
        
        if not job:
            # Try chain job ID
            chain_job_id = int(job_id)
            query = select(Job).where(Job.chain_job_id == chain_job_id)
            result = await db.execute(query)
            job = result.scalar_one_or_none()
    except ValueError:
        # Not a valid UUID or integer
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return job

@router.post("/", response_model=JobResponse)
async def create_job(
    job_data: JobCreate,
    db: AsyncSession = Depends(get_db_session)
):
    """Create a new job (mirrors on-chain job creation)"""
    # Combine CID parts if provided
    full_asset_cid = None
    if job_data.asset_cid_part1:
        full_asset_cid = job_data.asset_cid_part1
        if job_data.asset_cid_part2:
            full_asset_cid += job_data.asset_cid_part2
    
    job = Job(
        chain_job_id=job_data.chain_job_id,
        creator_address=job_data.creator_address,
        asset_cid_part1=job_data.asset_cid_part1,
        asset_cid_part2=job_data.asset_cid_part2,
        full_asset_cid=full_asset_cid,
        reward_amount=job_data.reward_amount,
        deadline=job_data.deadline,
        min_reputation=job_data.min_reputation,
        required_capabilities=job_data.required_capabilities
    )
    
    db.add(job)
    await db.commit()
    await db.refresh(job)
    
    # Create job creation event
    event = JobEvent(
        job_id=job.id,
        event_type="created",
        actor_address=job_data.creator_address,
        event_data=f'{{"chain_job_id": {job_data.chain_job_id}, "reward": {job_data.reward_amount}}}'
    )
    db.add(event)
    await db.commit()
    
    logger.info(f"Job created: {job.chain_job_id} by {job_data.creator_address}")
    return job

@router.post("/{job_id}/assign", response_model=JobResponse)
async def assign_job(
    job_id: str,
    assignment: JobAssignment,
    db: AsyncSession = Depends(get_db_session)
):
    """Assign job to a worker"""
    # Get job
    try:
        query = select(Job).where(Job.id == job_id)
        result = await db.execute(query)
        job = result.scalar_one_or_none()
        
        if not job:
            chain_job_id = int(job_id)
            query = select(Job).where(Job.chain_job_id == chain_job_id)
            result = await db.execute(query)
            job = result.scalar_one_or_none()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "open":
        raise HTTPException(status_code=400, detail="Job is not available for assignment")
    
    # Get worker
    worker_query = select(Worker).where(Worker.address == assignment.worker_address)
    worker_result = await db.execute(worker_query)
    worker = worker_result.scalar_one_or_none()
    
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")
    
    # Check worker eligibility
    if not worker.verified or not worker.active:
        raise HTTPException(status_code=400, detail="Worker is not eligible (not verified or active)")
    
    if worker.reputation < job.min_reputation:
        raise HTTPException(status_code=400, detail="Worker reputation too low for this job")
    
    # Assign job
    job.worker_id = worker.id
    job.status = "assigned"
    job.assigned_at = func.now()
    
    await db.commit()
    await db.refresh(job)
    
    # Create assignment event
    event = JobEvent(
        job_id=job.id,
        event_type="assigned",
        actor_address=assignment.worker_address,
        event_data=f'{{"worker_address": "{assignment.worker_address}"}}'
    )
    db.add(event)
    await db.commit()
    
    logger.info(f"Job {job.chain_job_id} assigned to worker {assignment.worker_address}")
    return job

@router.post("/{job_id}/complete", response_model=JobResponse)
async def complete_job(
    job_id: str,
    completion: JobCompletion,
    db: AsyncSession = Depends(get_db_session)
):
    """Mark job as completed with results"""
    # Get job
    try:
        query = select(Job).where(Job.id == job_id)
        result = await db.execute(query)
        job = result.scalar_one_or_none()
        
        if not job:
            chain_job_id = int(job_id)
            query = select(Job).where(Job.chain_job_id == chain_job_id)
            result = await db.execute(query)
            job = result.scalar_one_or_none()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != "assigned":
        raise HTTPException(status_code=400, detail="Job is not in assigned status")
    
    # Combine result CID parts
    full_result_cid = None
    if completion.result_cid_part1:
        full_result_cid = completion.result_cid_part1
        if completion.result_cid_part2:
            full_result_cid += completion.result_cid_part2
    
    # Update job
    job.result_cid_part1 = completion.result_cid_part1
    job.result_cid_part2 = completion.result_cid_part2
    job.full_result_cid = full_result_cid
    job.quality_score = completion.quality_score
    job.status = "completed"
    job.completed_at = func.now()
    
    # Update worker stats
    if job.worker_id:
        worker_query = select(Worker).where(Worker.id == job.worker_id)
        worker_result = await db.execute(worker_query)
        worker = worker_result.scalar_one_or_none()
        
        if worker:
            worker.jobs_completed += 1
            worker.total_earnings += job.reward_amount
            worker.last_seen = func.now()
    
    await db.commit()
    await db.refresh(job)
    
    # Create completion event
    event = JobEvent(
        job_id=job.id,
        event_type="completed",
        actor_address=completion.worker_address if completion.worker_address else None,
        event_data=f'{{"quality_score": {completion.quality_score}, "result_cid": "{full_result_cid}"}}'
    )
    db.add(event)
    await db.commit()
    
    logger.info(f"Job {job.chain_job_id} completed with quality score {completion.quality_score}")
    return job

@router.get("/{job_id}/events", response_model=List[JobEventResponse])
async def get_job_events(
    job_id: str,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db_session)
):
    """Get events for a specific job"""
    # Get job first
    try:
        query = select(Job).where(Job.id == job_id)
        result = await db.execute(query)
        job = result.scalar_one_or_none()
        
        if not job:
            chain_job_id = int(job_id)
            query = select(Job).where(Job.chain_job_id == chain_job_id)
            result = await db.execute(query)
            job = result.scalar_one_or_none()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid job ID format")
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Get events
    events_query = select(JobEvent).where(JobEvent.job_id == job.id).order_by(
        JobEvent.timestamp.desc()
    ).offset(skip).limit(limit)
    
    events_result = await db.execute(events_query)
    events = events_result.scalars().all()
    
    return events

@router.get("/stats/overview")
async def get_jobs_stats(db: AsyncSession = Depends(get_db_session)):
    """Get overall job statistics"""
    # Total jobs
    total_query = select(func.count(Job.id))
    total_result = await db.execute(total_query)
    total_jobs = total_result.scalar()
    
    # Jobs by status
    status_query = select(Job.status, func.count(Job.id)).group_by(Job.status)
    status_result = await db.execute(status_query)
    status_counts = dict(status_result.all())
    
    # Average reward
    avg_reward_query = select(func.avg(Job.reward_amount))
    avg_reward_result = await db.execute(avg_reward_query)
    avg_reward = avg_reward_result.scalar() or 0
    
    # Jobs in last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_query = select(func.count(Job.id)).where(Job.created_at >= yesterday)
    recent_result = await db.execute(recent_query)
    recent_jobs = recent_result.scalar()
    
    return {
        "total_jobs": total_jobs,
        "jobs_by_status": status_counts,
        "average_reward": str(avg_reward),
        "jobs_last_24h": recent_jobs
    }
