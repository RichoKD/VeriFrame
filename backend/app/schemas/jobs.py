from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class JobBase(BaseModel):
    chain_job_id: int = Field(..., description="On-chain job ID")
    creator_address: str = Field(..., description="Address of job creator")
    asset_cid_part1: str = Field(..., description="First part of asset IPFS CID")
    asset_cid_part2: Optional[str] = Field(None, description="Second part of asset IPFS CID")
    reward_amount: int = Field(..., description="Reward amount in wei")
    deadline: datetime = Field(..., description="Job deadline")
    min_reputation: int = Field(400, description="Minimum worker reputation required")
    required_capabilities: Optional[str] = Field(None, description="JSON string of required capabilities")

class JobCreate(JobBase):
    """Schema for creating a job"""
    pass

class JobUpdate(BaseModel):
    """Schema for updating job information"""
    deadline: Optional[datetime] = None
    min_reputation: Optional[int] = None
    required_capabilities: Optional[str] = None
    status: Optional[str] = None

class JobAssignment(BaseModel):
    """Schema for assigning a job to a worker"""
    worker_address: str = Field(..., description="Address of the worker to assign")

class JobCompletion(BaseModel):
    """Schema for completing a job"""
    result_cid_part1: str = Field(..., description="First part of result IPFS CID")
    result_cid_part2: Optional[str] = Field(None, description="Second part of result IPFS CID")
    quality_score: int = Field(..., ge=0, le=100, description="Quality score (0-100)")
    worker_address: Optional[str] = Field(None, description="Worker who completed the job")

class JobResponse(JobBase):
    """Schema for job API responses"""
    id: UUID
    full_asset_cid: Optional[str] = None
    created_at: datetime
    worker_id: Optional[UUID] = None
    assigned_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    result_cid_part1: Optional[str] = None
    result_cid_part2: Optional[str] = None
    full_result_cid: Optional[str] = None
    quality_score: Optional[int] = None
    status: str = "open"

    model_config = {"from_attributes": True}

class JobEventResponse(BaseModel):
    """Schema for job event responses"""
    id: UUID
    job_id: UUID
    event_type: str
    transaction_hash: Optional[str] = None
    block_number: Optional[int] = None
    timestamp: datetime
    actor_address: Optional[str] = None
    event_data: Optional[str] = None

    model_config = {"from_attributes": True}
