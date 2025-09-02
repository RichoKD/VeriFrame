from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional, Dict, Any
from app.config import get_settings
from app.services.graph_client import get_graph_client
from app.api.workers import get_workers as get_workers_db
from app.api.jobs import get_jobs as get_jobs_db
from app.database import get_db_session
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/workers", response_model=List[Dict[str, Any]])
async def get_workers_hybrid(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    verified_only: bool = Query(False),
    min_reputation: Optional[int] = Query(None, ge=0, le=1000),
    db=Depends(get_db_session)
):
    """Get workers using The Graph or database based on configuration"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            workers = await graph_client.get_workers(
                skip=skip,
                first=limit,
                verified_only=verified_only,
                min_reputation=min_reputation
            )
            
            # Convert Graph response to match API format
            return [
                {
                    "id": worker["id"],
                    "address": worker["address"],
                    "registered_at": worker["registeredAt"],
                    "verified": worker["verified"],
                    "verified_at": worker.get("verifiedAt"),
                    "verified_by": worker.get("verifiedBy"),
                    "reputation": int(worker["reputation"]),
                    "jobs_completed": int(worker["jobsCompleted"]),
                    "jobs_failed": 0,  # Not tracked in current schema
                    "total_earnings": int(worker["totalEarnings"]),
                    "active": True,  # Assume active if in Graph
                    "last_seen": worker.get("lastSeen"),
                    "info_cid": worker.get("fullInfoCid"),
                }
                for worker in workers
            ]
            
        except Exception as e:
            logger.error(f"Failed to fetch workers from The Graph: {e}")
            # Fallback to database
            return await get_workers_db(skip, limit, verified_only, True, min_reputation, db)
    else:
        # Use database directly
        return await get_workers_db(skip, limit, verified_only, True, min_reputation, db)

@router.get("/jobs", response_model=List[Dict[str, Any]])
async def get_jobs_hybrid(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    status: Optional[str] = Query(None),
    creator_address: Optional[str] = Query(None),
    db=Depends(get_db_session)
):
    """Get jobs using The Graph or database based on configuration"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            jobs = await graph_client.get_jobs(
                skip=skip,
                first=limit,
                status=status,
                creator=creator_address
            )
            
            # Convert Graph response to match API format
            return [
                {
                    "id": job["id"],
                    "chain_job_id": int(job["chainJobId"]),
                    "creator_address": job["creator"],
                    "full_asset_cid": job["fullAssetCid"],
                    "reward_amount": int(job["reward"]),
                    "deadline": job["deadline"],
                    "min_reputation": int(job["minReputation"]),
                    "worker_address": job["assignedWorker"]["address"] if job.get("assignedWorker") else None,
                    "assigned_at": job.get("assignedAt"),
                    "completed_at": job.get("completedAt"),
                    "full_result_cid": job.get("fullResultCid"),
                    "quality_score": int(job["qualityScore"]) if job.get("qualityScore") else None,
                    "status": job["status"].lower(),
                    "created_at": job["createdAt"]
                }
                for job in jobs
            ]
            
        except Exception as e:
            logger.error(f"Failed to fetch jobs from The Graph: {e}")
            # Fallback to database
            return await get_jobs_db(skip, limit, status, creator_address, None, None, None, db)
    else:
        # Use database directly
        return await get_jobs_db(skip, limit, status, creator_address, None, None, None, db)

@router.get("/worker/{worker_address}")
async def get_worker_hybrid(
    worker_address: str,
    db=Depends(get_db_session)
):
    """Get worker details using The Graph or database"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            worker = await graph_client.get_worker_by_address(worker_address)
            
            if not worker:
                raise HTTPException(status_code=404, detail="Worker not found")
            
            return {
                "worker": {
                    "id": worker["id"],
                    "address": worker["address"],
                    "registered_at": worker["registeredAt"],
                    "verified": worker["verified"],
                    "verified_at": worker.get("verifiedAt"),
                    "verified_by": worker.get("verifiedBy"),
                    "reputation": int(worker["reputation"]),
                    "jobs_completed": int(worker["jobsCompleted"]),
                    "total_earnings": int(worker["totalEarnings"]),
                    "info_cid": worker.get("fullInfoCid"),
                },
                "reputation_history": [
                    {
                        "old_reputation": int(hist["oldReputation"]),
                        "new_reputation": int(hist["newReputation"]),
                        "change_amount": int(hist["changeAmount"]),
                        "reason": hist["reason"],
                        "timestamp": hist["timestamp"],
                        "transaction_hash": hist["transactionHash"]
                    }
                    for hist in worker.get("reputationHistory", [])
                ]
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch worker from The Graph: {e}")
            # Fallback to database - would need to implement similar response format
            raise HTTPException(status_code=503, detail="Service temporarily unavailable")
    else:
        # Use database directly - would need to adapt existing endpoint
        raise HTTPException(status_code=501, detail="Database-only mode not fully implemented for this endpoint")

@router.get("/available-jobs")
async def get_available_jobs_hybrid(
    worker_address: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db=Depends(get_db_session)
):
    """Get available jobs using The Graph or database"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            jobs = await graph_client.get_available_jobs(
                worker_address=worker_address,
                skip=skip,
                first=limit
            )
            
            return [
                {
                    "id": job["id"],
                    "chain_job_id": int(job["chainJobId"]),
                    "creator_address": job["creator"],
                    "full_asset_cid": job["fullAssetCid"],
                    "reward_amount": int(job["reward"]),
                    "deadline": job["deadline"],
                    "min_reputation": int(job["minReputation"]),
                    "status": job["status"].lower(),
                    "created_at": job["createdAt"]
                }
                for job in jobs
            ]
            
        except Exception as e:
            logger.error(f"Failed to fetch available jobs from The Graph: {e}")
            # Fallback to database
            from app.api.jobs import get_available_jobs as get_available_jobs_db
            return await get_available_jobs_db(worker_address, skip, limit, db)
    else:
        # Use database directly
        from app.api.jobs import get_available_jobs as get_available_jobs_db
        return await get_available_jobs_db(worker_address, skip, limit, db)

@router.get("/stats/global")
async def get_global_stats_hybrid():
    """Get global statistics using The Graph or database"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            stats = await graph_client.get_global_stats()
            
            if not stats:
                return {"message": "No global stats available"}
            
            return {
                "total_workers": int(stats["totalWorkers"]),
                "verified_workers": int(stats["totalVerifiedWorkers"]),
                "total_jobs": int(stats["totalJobs"]),
                "completed_jobs": int(stats["totalCompletedJobs"]),
                "total_rewards": stats["totalRewards"],
                "average_reputation": float(stats["averageReputation"]),
                "average_quality_score": float(stats["averageQualityScore"]),
                "open_jobs": int(stats["openJobs"]),
                "assigned_jobs": int(stats["assignedJobs"]),
                "active_workers": int(stats["activeWorkers"]),
                "last_updated": stats["lastUpdated"]
            }
            
        except Exception as e:
            logger.error(f"Failed to fetch global stats from The Graph: {e}")
            return {"error": "Failed to fetch statistics", "details": str(e)}
    else:
        # Use database directly - would need to implement
        return {"message": "Database-only global stats not implemented yet"}

@router.get("/stats/daily")
async def get_daily_stats_hybrid(
    days: int = Query(7, ge=1, le=30)
):
    """Get daily statistics using The Graph"""
    settings = get_settings()
    
    if settings.use_graph:
        try:
            graph_client = await get_graph_client()
            stats = await graph_client.get_daily_stats(days=days)
            
            return [
                {
                    "date": stat["date"],
                    "jobs_created": int(stat["jobsCreated"]),
                    "jobs_completed": int(stat["jobsCompleted"]),
                    "total_reward": stat["totalReward"],
                    "average_quality": float(stat["averageQuality"]),
                    "active_workers": int(stat["activeWorkers"]),
                    "new_workers": int(stat["newWorkers"]),
                    "workers_verified": int(stat["workersVerified"]),
                    "average_reputation": float(stat["averageReputation"])
                }
                for stat in stats
            ]
            
        except Exception as e:
            logger.error(f"Failed to fetch daily stats from The Graph: {e}")
            return {"error": "Failed to fetch daily statistics", "details": str(e)}
    else:
        return {"message": "Daily stats only available with The Graph integration"}
