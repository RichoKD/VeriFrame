from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, BigInteger, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign
from sqlalchemy.sql import func
import uuid
from app.database import Base


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(String(66), unique=True, nullable=False, index=True)  # StarkNet address
    public_key = Column(String(66), nullable=True)
    
    # Profile info
    username = Column(String(50), nullable=True, unique=True)  # Optional username
    email = Column(String(255), nullable=True)  # Optional email
    bio = Column(Text, nullable=True)  # User bio/description
    avatar_url = Column(String(500), nullable=True)  # Profile picture URL
    
    # Registration info
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    email_verified = Column(Boolean, default=False)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status and permissions
    active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)  # Platform verification
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(66), nullable=True)  # Verifier address
    
    # Activity tracking
    last_seen = Column(DateTime(timezone=True), nullable=True)
    login_count = Column(Integer, default=0)
    
    # Preferences
    notifications_enabled = Column(Boolean, default=False)
    email_notifications = Column(Boolean, default=False)
    timezone = Column(String(50), nullable=True, default='UTC')
    language = Column(String(10), nullable=True, default='en')
    
    # Relationships
    # jobs_created = relationship("Job", primaryjoin="User.address == foreign(Job.creator_address)", back_populates="creator")
    jobs_created = relationship("Job", back_populates="creator")


class Worker(Base):
    __tablename__ = "workers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    address = Column(String(66), unique=True, nullable=False, index=True)  # StarkNet address
    public_key = Column(String(66), nullable=True)
    
    # Registration info
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    info_cid = Column(String(255), nullable=True)  # IPFS CID for worker info
    
    # Verification status
    verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String(66), nullable=True)  # Verifier address
    
    # Reputation and stats
    reputation = Column(Integer, default=500)  # 0-1000 scale
    jobs_completed = Column(Integer, default=0)
    jobs_failed = Column(Integer, default=0)
    total_earnings = Column(BigInteger, default=0)  # In wei
    
    # Metadata
    capabilities = Column(Text, nullable=True)  # JSON string
    hardware_specs = Column(Text, nullable=True)  # JSON string
    contact_info = Column(String(255), nullable=True)
    
    # Status
    active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    jobs_assigned = relationship("Job", back_populates="worker")
    reputation_history = relationship("ReputationHistory", back_populates="worker")


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chain_job_id = Column(Integer, unique=True, nullable=False, index=True)
    creator_address = Column(String(66), ForeignKey('users.address'), nullable=False, index=True)
    asset_cid_part1 = Column(String(255), nullable=False)
    asset_cid_part2 = Column(String(255), nullable=True)
    full_asset_cid = Column(String(510), nullable=True)  # Combined CID
    reward_amount = Column(BigInteger, nullable=False)
    deadline = Column(DateTime(timezone=True), nullable=False)
    min_reputation = Column(Integer, default=400)
    required_capabilities = Column(Text, nullable=True)  # JSON string
    
    # Assignment and completion
    worker_id = Column(UUID(as_uuid=True), ForeignKey('workers.id'), nullable=True)
    assigned_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    result_cid_part1 = Column(String(255), nullable=True)
    result_cid_part2 = Column(String(255), nullable=True)
    full_result_cid = Column(String(510), nullable=True)  # Combined result CID
    quality_score = Column(Integer, nullable=True)  # 0-100
    
    # Metadata
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String(20), default="open")  # open, assigned, completed, cancelled
    
    # Relationships
    creator = relationship("User", back_populates="jobs_created")
    worker = relationship("Worker", back_populates="jobs_assigned")
    events = relationship("JobEvent", back_populates="job", cascade="all, delete-orphan")


class JobEvent(Base):
    __tablename__ = "job_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    job_id = Column(UUID(as_uuid=True), ForeignKey("jobs.id"), nullable=False)
    
    event_type = Column(String(50), nullable=False)  # created, assigned, completed, etc.
    transaction_hash = Column(String(66), nullable=True)
    block_number = Column(BigInteger, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Event data
    actor_address = Column(String(66), nullable=True)  # Who triggered the event
    event_data = Column(Text, nullable=True)  # JSON string with event details
    
    # Relationships
    job = relationship("Job", back_populates="events")


class ReputationHistory(Base):
    __tablename__ = "reputation_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    worker_id = Column(UUID(as_uuid=True), ForeignKey("workers.id"), nullable=False)
    
    # Reputation change
    old_reputation = Column(Integer, nullable=False)
    new_reputation = Column(Integer, nullable=False)
    change_amount = Column(Integer, nullable=False)  # Can be negative
    
    # Reason for change
    reason = Column(String(100), nullable=False)  # job_completion, quality_score, slash, etc.
    job_chain_id = Column(Integer, nullable=True)  # Related job if applicable
    quality_score = Column(Integer, nullable=True)  # Quality score if job-related
    
    # Metadata
    changed_by = Column(String(66), nullable=True)  # Who initiated the change
    transaction_hash = Column(String(66), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    worker = relationship("Worker", back_populates="reputation_history")


class ContractEvent(Base):
    __tablename__ = "contract_events"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Blockchain data
    transaction_hash = Column(String(66), nullable=False, index=True)
    block_number = Column(BigInteger, nullable=False, index=True)
    event_index = Column(Integer, nullable=False)
    contract_address = Column(String(66), nullable=False)
    
    # Event details
    event_name = Column(String(100), nullable=False, index=True)
    event_data = Column(Text, nullable=False)  # JSON string
    processed = Column(Boolean, default=False, index=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Metadata
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Unique constraint to prevent duplicate events
    __table_args__ = (
        {"schema": None},
    )
