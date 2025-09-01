from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID

class ContractEventResponse(BaseModel):
    """Schema for contract event responses"""
    id: UUID
    transaction_hash: str
    block_number: int
    event_index: int
    contract_address: str
    event_name: str
    event_data: str  # JSON string
    processed: bool = False
    processed_at: Optional[datetime] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class EventSummary(BaseModel):
    """Schema for event summary statistics"""
    total_events: int
    events_by_type: Dict[str, int]
    processed_events: int
    unprocessed_events: int
    latest_block_processed: Optional[int] = None
    timeframe_hours: int
