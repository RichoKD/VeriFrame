from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class WorkerBase(BaseModel):
    address: str = Field(..., description="StarkNet address of the worker")
    public_key: Optional[str] = Field(None, description="Public key for verification")
    info_cid: Optional[str] = Field(None, description="IPFS CID for worker information")
    capabilities: Optional[str] = Field(None, description="JSON string of worker capabilities")
    hardware_specs: Optional[str] = Field(None, description="JSON string of hardware specifications")
    contact_info: Optional[str] = Field(None, description="Contact information")

class WorkerRegistration(WorkerBase):
    """Schema for worker registration"""
    pass

class WorkerCreate(WorkerBase):
    """Schema for creating a worker"""
    pass

class WorkerUpdate(BaseModel):
    """Schema for updating worker information"""
    public_key: Optional[str] = None
    info_cid: Optional[str] = None
    capabilities: Optional[str] = None
    hardware_specs: Optional[str] = None
    contact_info: Optional[str] = None
    active: Optional[bool] = None

class WorkerResponse(WorkerBase):
    """Schema for worker API responses"""
    id: UUID
    registered_at: datetime
    verified: bool = False
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    reputation: int = 500
    jobs_completed: int = 0
    jobs_failed: int = 0
    total_earnings: int = 0
    active: bool = True
    is_admin: bool = False
    last_seen: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ReputationHistoryResponse(BaseModel):
    """Schema for reputation history entries"""
    id: UUID
    old_reputation: int
    new_reputation: int
    change_amount: int
    reason: str
    job_chain_id: Optional[int] = None
    quality_score: Optional[int] = None
    changed_by: Optional[str] = None
    transaction_hash: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}
