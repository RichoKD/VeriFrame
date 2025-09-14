"""Authentication routes for VeriFrame backend."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.sql import func
from app.database import get_db_session
from app.schemas.workers import WorkerResponse
from app.models import Worker
from app.auth.starknet_auth import starknet_authenticator
from app.auth.jwt_handler import jwt_handler
from app.auth.dependencies import require_authenticated_worker
from app.schemas.auth import (
    ChallengeRequest,
    ChallengeResponse,
    AuthRequest,
    AuthResponse,
    RefreshRequest,
    RefreshResponse,
    VerifyTokenRequest,
    VerifyTokenResponse,
    LogoutRequest
)
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()
settings = get_settings()


@router.post("/challenge", response_model=ChallengeResponse)
async def get_auth_challenge(request: ChallengeRequest):
    """Generate authentication challenge for wallet signing."""
    try:
        challenge = starknet_authenticator.generate_challenge(request.address)
        return ChallengeResponse(**challenge)
    except Exception as e:
        logger.error(f"Failed to generate challenge for {request.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate authentication challenge"
        )


@router.post("/authenticate", response_model=AuthResponse)
async def authenticate_worker(
    request: AuthRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """Authenticate worker with signed challenge."""
    try:
        # Verify signature
        is_valid = await starknet_authenticator.verify_signature(
            request.address,
            request.message,
            request.signature,
            request.timestamp
        )
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid signature or expired challenge"
            )
        
        # Get worker from database
        query = select(Worker).where(Worker.address == request.address)
        result = await db.execute(query)
        worker = result.scalar_one_or_none()
        
        if not worker:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Worker not registered. Please register first."
            )
        
        if not worker.active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Worker account is inactive"
            )
        
        # Generate tokens
        access_token = jwt_handler.create_access_token(worker.address)
        refresh_token = jwt_handler.create_refresh_token(worker.address)
        
        # Update last seen
        worker.last_seen = func.now()
        await db.commit()
        await db.refresh(worker)
        
        return AuthResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60,
            worker=worker
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Authentication failed for {request.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed"
        )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(request: RefreshRequest):
    """Refresh access token using refresh token."""
    try:
        payload = jwt_handler.verify_token(request.refresh_token)
        
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        worker_address = payload.get("sub")
        if not worker_address:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token payload"
            )
        
        # Generate new access token
        new_access_token = jwt_handler.create_access_token(worker_address)
        
        return RefreshResponse(
            access_token=new_access_token,
            token_type="bearer",
            expires_in=settings.jwt_access_token_expire_minutes * 60
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/verify-token", response_model=VerifyTokenResponse)
async def verify_token(request: VerifyTokenRequest):
    """Verify token validity."""
    try:
        payload = jwt_handler.verify_token(request.token)
        
        if payload:
            return VerifyTokenResponse(
                valid=True,
                payload=payload
            )
        else:
            return VerifyTokenResponse(
                valid=False,
                error="Invalid or expired token"
            )
            
    except Exception as e:
        logger.error(f"Token verification failed: {e}")
        return VerifyTokenResponse(
            valid=False,
            error="Token verification failed"
        )


@router.post("/logout")
async def logout(
    request: LogoutRequest,
    current_worker: Worker = Depends(require_authenticated_worker)
):
    """Logout worker (invalidate tokens)."""
    try:
        # In a production system, you would:
        # 1. Add the tokens to a blacklist (Redis)
        # 2. Clean up any session data
        # 3. Update last_seen timestamp
        
        logger.info(f"Worker logged out: {current_worker.address}")
        
        return {"message": "Successfully logged out"}
        
    except Exception as e:
        logger.error(f"Logout failed for {current_worker.address}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/me", response_model=WorkerResponse)
async def get_current_user(
    current_worker: Worker = Depends(require_authenticated_worker)
):
    """Get current authenticated worker information."""
    return current_worker


@router.post("/cleanup-challenges")
async def cleanup_expired_challenges():
    """Cleanup expired authentication challenges (admin endpoint)."""
    try:
        starknet_authenticator.cleanup_expired_challenges()
        return {"message": "Expired challenges cleaned up"}
    except Exception as e:
        logger.error(f"Challenge cleanup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Challenge cleanup failed"
        )
