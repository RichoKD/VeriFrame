"""JWT token handling for authentication."""
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)


class JWTHandler:
    """Handles JWT token creation and verification."""
    
    def __init__(self):
        self.settings = get_settings()
        self.secret_key = self.settings.jwt_secret_key
        self.algorithm = self.settings.jwt_algorithm
        self.access_token_expire = timedelta(minutes=self.settings.jwt_access_token_expire_minutes)
        self.refresh_token_expire = timedelta(days=self.settings.jwt_refresh_token_expire_days)
    
    def create_access_token(self, worker_address: str, role: str = "worker") -> str:
        """Create JWT access token for a worker."""
        expire = datetime.utcnow() + self.access_token_expire
        payload = {
            "sub": worker_address,
            "role": role,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        }
        
        try:
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"Created access token for worker: {worker_address}")
            return token
        except Exception as e:
            logger.error(f"Failed to create access token: {e}")
            raise
    
    def create_refresh_token(self, worker_address: str) -> str:
        """Create JWT refresh token for a worker."""
        expire = datetime.utcnow() + self.refresh_token_expire
        payload = {
            "sub": worker_address,
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        }
        
        try:
            token = jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
            logger.info(f"Created refresh token for worker: {worker_address}")
            return token
        except Exception as e:
            logger.error(f"Failed to create refresh token: {e}")
            raise
    
    def verify_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            
            # Check if token has expired
            exp = payload.get("exp")
            if exp and datetime.utcnow().timestamp() > exp:
                logger.warning("Token has expired")
                return None
                
            return payload
        except JWTError as e:
            logger.warning(f"JWT verification failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error during token verification: {e}")
            return None
    
    def decode_token_without_verification(self, token: str) -> Optional[Dict[str, Any]]:
        """Decode token without verification (for debugging)."""
        try:
            return jwt.get_unverified_claims(token)
        except Exception as e:
            logger.error(f"Failed to decode token: {e}")
            return None


# Global JWT handler instance
jwt_handler = JWTHandler()
