"""Authentication dependencies for FastAPI routes."""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.database import get_db_session
from app.models import Worker
from app.auth.jwt_handler import jwt_handler
import logging

logger = logging.getLogger(__name__)

# HTTP Bearer security scheme
security = HTTPBearer(auto_error=False)


async def get_current_worker(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> Optional[Worker]:
    """Get current authenticated worker from JWT token."""
    if not credentials:
        return None
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Verify the JWT token
        payload = jwt_handler.verify_token(credentials.credentials)
        if payload is None:
            return None
        
        # Extract worker address from token
        worker_address = payload.get("sub")
        if worker_address is None:
            return None
        
        # Get worker from database
        query = select(Worker).where(Worker.address == worker_address)
        result = await db.execute(query)
        worker = result.scalar_one_or_none()
        
        if worker is None:
            logger.warning(f"Worker not found in database: {worker_address}")
            return None
        
        # Check if worker is still active
        if not worker.active:
            logger.warning(f"Inactive worker attempted access: {worker_address}")
            return None
            
        return worker
        
    except Exception as e:
        logger.error(f"Error in get_current_worker: {e}")
        return None


async def require_authenticated_worker(
    current_worker: Optional[Worker] = Depends(get_current_worker)
) -> Worker:
    """Require authenticated worker (raises exception if not authenticated)."""
    if current_worker is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return current_worker


async def require_verified_worker(
    current_worker: Worker = Depends(require_authenticated_worker)
) -> Worker:
    """Require verified worker."""
    if not current_worker.verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Worker verification required"
        )
    return current_worker


async def require_admin_worker(
    current_worker: Worker = Depends(require_authenticated_worker)
) -> Worker:
    """Require admin privileges."""
    if not current_worker.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    
    return current_worker


def get_optional_current_worker():
    """Dependency that optionally gets current worker without raising exceptions."""
    async def _get_optional_current_worker(
        current_worker: Optional[Worker] = Depends(get_current_worker)
    ) -> Optional[Worker]:
        return current_worker
    
    return _get_optional_current_worker


def create_role_dependency(required_role: str):
    """Create a dependency that requires a specific role."""
    async def role_dependency(
        current_worker: Worker = Depends(require_authenticated_worker)
    ) -> Worker:
        # For now, we only have worker role
        # In the future, you could extend this for admin, moderator, etc.
        if required_role == "worker":
            return current_worker
        elif required_role == "verified":
            return await require_verified_worker(current_worker)
        elif required_role == "admin":
            return await require_admin_worker(current_worker)
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{required_role}' not recognized"
            )
    
    return role_dependency
