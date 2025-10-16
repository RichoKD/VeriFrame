from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from typing import List, Optional
from datetime import datetime, timedelta
from app.database import get_db_session
from app.models import ContractEvent, Job, Worker
from app.schemas.events import ContractEventResponse, EventSummary
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/", response_model=List[ContractEventResponse])
async def get_contract_events(
    skip: int = Query(0, ge=0, description="Number of events to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of events to return"),
    event_name: Optional[str] = Query(None, description="Filter by event name"),
    contract_address: Optional[str] = Query(None, description="Filter by contract address"),
    processed: Optional[bool] = Query(None, description="Filter by processed status"),
    from_block: Optional[int] = Query(None, description="Filter events from block number"),
    to_block: Optional[int] = Query(None, description="Filter events to block number"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get contract events with optional filtering"""
    query = select(ContractEvent)
    
    if event_name:
        query = query.where(ContractEvent.event_name == event_name)
    
    if contract_address:
        query = query.where(ContractEvent.contract_address == contract_address)
    
    if processed is not None:
        query = query.where(ContractEvent.processed == processed)
    
    if from_block is not None:
        query = query.where(ContractEvent.block_number >= from_block)
    
    if to_block is not None:
        query = query.where(ContractEvent.block_number <= to_block)
    
    query = query.order_by(desc(ContractEvent.block_number), desc(ContractEvent.event_index))
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return events

@router.get("/unprocessed", response_model=List[ContractEventResponse])
async def get_unprocessed_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    event_name: Optional[str] = Query(None, description="Filter by event name"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get unprocessed contract events"""
    query = select(ContractEvent).where(ContractEvent.processed == False)
    
    if event_name:
        query = query.where(ContractEvent.event_name == event_name)
    
    query = query.order_by(ContractEvent.block_number, ContractEvent.event_index)
    query = query.offset(skip).limit(limit)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return events

@router.get("/{event_id}", response_model=ContractEventResponse)
async def get_event(
    event_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get specific contract event by ID"""
    query = select(ContractEvent).where(ContractEvent.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    return event

@router.post("/{event_id}/mark-processed")
async def mark_event_processed(
    event_id: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Mark an event as processed"""
    query = select(ContractEvent).where(ContractEvent.id == event_id)
    result = await db.execute(query)
    event = result.scalar_one_or_none()
    
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    event.processed = True
    event.processed_at = func.now()
    
    await db.commit()
    
    logger.info(f"Event marked as processed: {event_id}")
    return {"message": "Event marked as processed"}

@router.get("/summary/stats", response_model=EventSummary)
async def get_event_summary(
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back"),
    db: AsyncSession = Depends(get_db_session)
):
    """Get event summary statistics"""
    since = datetime.utcnow() - timedelta(hours=hours)
    
    # Total events in timeframe
    total_query = select(func.count(ContractEvent.id)).where(
        ContractEvent.timestamp >= since
    )
    total_result = await db.execute(total_query)
    total_events = total_result.scalar()
    
    # Events by type
    type_query = select(
        ContractEvent.event_name, 
        func.count(ContractEvent.id)
    ).where(
        ContractEvent.timestamp >= since
    ).group_by(ContractEvent.event_name)
    type_result = await db.execute(type_query)
    events_by_type = dict(type_result.all())
    
    # Processed vs unprocessed
    processed_query = select(func.count(ContractEvent.id)).where(
        ContractEvent.timestamp >= since,
        ContractEvent.processed == True
    )
    processed_result = await db.execute(processed_query)
    processed_events = processed_result.scalar()
    
    unprocessed_query = select(func.count(ContractEvent.id)).where(
        ContractEvent.processed == False
    )
    unprocessed_result = await db.execute(unprocessed_query)
    unprocessed_events = unprocessed_result.scalar()
    
    # Latest block processed
    latest_block_query = select(func.max(ContractEvent.block_number))
    latest_block_result = await db.execute(latest_block_query)
    latest_block = latest_block_result.scalar()
    
    return EventSummary(
        total_events=total_events,
        events_by_type=events_by_type,
        processed_events=processed_events,
        unprocessed_events=unprocessed_events,
        latest_block_processed=latest_block,
        timeframe_hours=hours
    )

@router.get("/blocks/{block_number}")
async def get_events_by_block(
    block_number: int,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all events from a specific block"""
    query = select(ContractEvent).where(
        ContractEvent.block_number == block_number
    ).order_by(ContractEvent.event_index)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return events

@router.get("/transactions/{tx_hash}")
async def get_events_by_transaction(
    tx_hash: str,
    db: AsyncSession = Depends(get_db_session)
):
    """Get all events from a specific transaction"""
    query = select(ContractEvent).where(
        ContractEvent.transaction_hash == tx_hash
    ).order_by(ContractEvent.event_index)
    
    result = await db.execute(query)
    events = result.scalars().all()
    
    return events

@router.delete("/cleanup")
async def cleanup_old_events(
    days: int = Query(30, ge=1, le=365, description="Delete events older than this many days"),
    dry_run: bool = Query(True, description="If true, only count events to be deleted"),
    db: AsyncSession = Depends(get_db_session)
):
    """Clean up old processed events"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = select(func.count(ContractEvent.id)).where(
        ContractEvent.timestamp < cutoff_date,
        ContractEvent.processed == True
    )
    result = await db.execute(query)
    count = result.scalar()
    
    if dry_run:
        return {
            "message": f"Would delete {count} events older than {days} days",
            "dry_run": True,
            "count": count
        }
    
    # Actually delete the events
    delete_query = select(ContractEvent).where(
        ContractEvent.timestamp < cutoff_date,
        ContractEvent.processed == True
    )
    events_to_delete = await db.execute(delete_query)
    
    for event in events_to_delete.scalars():
        await db.delete(event)
    
    await db.commit()
    
    logger.info(f"Deleted {count} old events older than {days} days")
    return {
        "message": f"Deleted {count} events older than {days} days",
        "dry_run": False,
        "count": count
    }
