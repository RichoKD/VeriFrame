"""Pydantic schemas for authentication."""
from pydantic import BaseModel, Field
from typing import Optional, List, Union
from app.schemas.workers import WorkerResponse
from app.schemas.users import UserResponse


class ChallengeRequest(BaseModel):
    """Request for authentication challenge."""
    address: str = Field(..., description="StarkNet address")


class ChallengeResponse(BaseModel):
    """Response containing authentication challenge."""
    message: str = Field(..., description="Message to be signed")
    timestamp: str = Field(..., description="Challenge timestamp")
    nonce: str = Field(..., description="Random nonce")
    expires_at: str = Field(..., description="Challenge expiration timestamp")


class AuthRequest(BaseModel):
    """Request for authentication with signed challenge."""
    address: str = Field(..., description="StarkNet address")
    message: str = Field(..., description="Original challenge message")
    signature: List[str] = Field(..., description="Signature components")
    timestamp: int = Field(..., description="Challenge timestamp")


class AuthResponse(BaseModel):
    """Response after successful authentication."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: Optional[UserResponse] = Field(None, description="Authenticated user information")
    worker: Optional[WorkerResponse] = Field(None, description="Authenticated worker information")


class RefreshRequest(BaseModel):
    """Request to refresh access token."""
    refresh_token: str = Field(..., description="Valid refresh token")


class RefreshResponse(BaseModel):
    """Response with new access token."""
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")


class TokenPayload(BaseModel):
    """JWT token payload structure."""
    sub: str = Field(..., description="Subject (worker address)")
    role: str = Field(default="worker", description="User role")
    exp: int = Field(..., description="Expiration timestamp")
    iat: int = Field(..., description="Issued at timestamp")
    type: str = Field(..., description="Token type (access/refresh)")


class LogoutRequest(BaseModel):
    """Request to logout (invalidate tokens)."""
    refresh_token: Optional[str] = Field(None, description="Refresh token to invalidate")


class PasswordResetRequest(BaseModel):
    """Request for password reset (for future use)."""
    address: str = Field(..., description="StarkNet address")


class VerifyTokenRequest(BaseModel):
    """Request to verify token validity."""
    token: str = Field(..., description="Token to verify")


class VerifyTokenResponse(BaseModel):
    """Response with token verification result."""
    valid: bool = Field(..., description="Whether token is valid")
    payload: Optional[TokenPayload] = Field(None, description="Token payload if valid")
    error: Optional[str] = Field(None, description="Error message if invalid")
