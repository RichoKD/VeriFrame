"""User schemas for API requests and responses."""
from pydantic import BaseModel, EmailStr, Field, validator
from datetime import datetime
from typing import Optional
from uuid import UUID


class UserBase(BaseModel):
    """Base user schema with common fields."""
    address: str = Field(..., description="StarkNet wallet address")
    username: Optional[str] = Field(None, max_length=50, description="Optional username")
    email: Optional[EmailStr] = Field(None, description="Optional email address")
    bio: Optional[str] = Field(None, max_length=1000, description="User bio/description")
    avatar_url: Optional[str] = Field(None, description="Profile picture URL")
    timezone: Optional[str] = Field("UTC", description="User timezone")
    language: Optional[str] = Field("en", description="Preferred language")
    notifications_enabled: bool = Field(True, description="Enable notifications")
    email_notifications: bool = Field(True, description="Enable email notifications")

    @validator('address')
    def validate_address(cls, v):
        if not v.startswith('0x'):
            raise ValueError('Address must start with 0x')
        if len(v) != 66:  # 0x + 64 hex characters
            raise ValueError('Address must be 66 characters long')
        return v.lower()

    @validator('username')
    def validate_username(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('Username must be at least 3 characters long')
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v


class UserCreate(UserBase):
    """Schema for creating a new user."""
    pass


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    username: Optional[str] = Field(None, max_length=50)
    email: Optional[EmailStr] = None
    bio: Optional[str] = Field(None, max_length=1000)
    avatar_url: Optional[str] = None
    timezone: Optional[str] = None
    language: Optional[str] = None
    notifications_enabled: Optional[bool] = None
    email_notifications: Optional[bool] = None

    @validator('username')
    def validate_username(cls, v):
        if v is not None:
            if len(v.strip()) < 3:
                raise ValueError('Username must be at least 3 characters long')
            if not v.replace('_', '').replace('-', '').isalnum():
                raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v


class UserResponse(UserBase):
    """Schema for user API responses."""
    id: UUID
    public_key: Optional[str] = None
    registered_at: datetime
    email_verified: bool
    email_verified_at: Optional[datetime] = None
    active: bool
    is_admin: bool
    is_verified: bool
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    last_seen: Optional[datetime] = None
    login_count: int

    class Config:
        from_attributes = True


class UserProfile(BaseModel):
    """Public user profile schema (limited information)."""
    id: UUID
    address: str
    username: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    registered_at: datetime
    is_verified: bool
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics schema."""
    jobs_created: int
    total_spent: int  # In wei
    active_jobs: int
    completed_jobs: int

    class Config:
        from_attributes = True


class UserList(BaseModel):
    """Schema for paginated user lists."""
    users: list[UserProfile]
    total: int
    page: int
    per_page: int
    pages: int


class UserVerificationRequest(BaseModel):
    """Schema for user verification requests."""
    user_id: UUID
    verification_reason: str = Field(..., max_length=500)


class UserVerificationResponse(BaseModel):
    """Schema for user verification responses."""
    user_id: UUID
    verified: bool
    verified_at: Optional[datetime] = None
    verified_by: Optional[str] = None
    message: str