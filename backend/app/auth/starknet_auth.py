"""StarkNet wallet authentication using signature verification."""
import os
import time
import hashlib
from typing import Dict, Optional
from app.services.starknet_client import get_starknet_client
import logging

logger = logging.getLogger(__name__)


class StarkNetAuthenticator:
    """Handles StarkNet wallet-based authentication."""
    
    def __init__(self):
        self.challenge_expiry = 300  # 5 minutes
        self.challenges = {}  # In production, use Redis
    
    def generate_challenge(self, address: str) -> Dict[str, str]:
        """Generate authentication challenge for wallet signing."""
        timestamp = int(time.time())
        nonce = os.urandom(16).hex()
        
        # Create a human-readable message
        message = (
            f"VeriFrame Authentication\\n"
            f"Address: {address}\\n"
            f"Timestamp: {timestamp}\\n"
            f"Nonce: {nonce}\\n"
            f"Please sign this message to authenticate with VeriFrame."
        )
        
        challenge_data = {
            "message": message,
            "timestamp": str(timestamp),
            "nonce": nonce,
            "expires_at": str(timestamp + self.challenge_expiry)
        }
        
        # Store challenge temporarily (in production, use Redis with TTL)
        self.challenges[address] = challenge_data
        
        logger.info(f"Generated authentication challenge for address: {address}")
        return challenge_data
    
    async def verify_signature(
        self, 
        address: str, 
        message: str, 
        signature: list,
        timestamp: int
    ) -> bool:
        """Verify wallet signature against message."""
        try:
            # Check timestamp validity
            current_time = int(time.time())
            if current_time - timestamp > self.challenge_expiry:
                logger.warning(f"Challenge expired for address: {address}")
                return False
            
            # Check if challenge exists
            stored_challenge = self.challenges.get(address)
            if not stored_challenge:
                logger.warning(f"No challenge found for address: {address}")
                return False
            
            # Verify the message matches the stored challenge
            if stored_challenge["message"] != message:
                logger.warning(f"Message mismatch for address: {address}")
                return False
            
            # Verify signature using StarkNet client
            starknet_client = get_starknet_client()
            
            # Convert message to felt for signature verification
            message_hash = self._message_to_hash(message)
            
            # Verify the signature (this would need to be implemented in starknet_client)
            is_valid = await self._verify_starknet_signature(
                address, message_hash, signature, starknet_client
            )
            
            if is_valid:
                # Clean up used challenge
                self.challenges.pop(address, None)
                logger.info(f"Successfully verified signature for address: {address}")
            else:
                logger.warning(f"Signature verification failed for address: {address}")
            
            return is_valid
            
        except Exception as e:
            logger.error(f"Error verifying signature for {address}: {e}")
            return False
    
    def _message_to_hash(self, message: str) -> str:
        """Convert message to hash for signature verification."""
        # Create a hash of the message that can be used for signature verification
        message_bytes = message.encode('utf-8')
        return hashlib.sha256(message_bytes).hexdigest()
    
    async def _verify_starknet_signature(
        self, 
        address: str, 
        message_hash: str, 
        signature: list,
        starknet_client
    ) -> bool:
        """Verify StarkNet signature (placeholder implementation)."""
        # This is a placeholder implementation
        # In a real implementation, you would:
        # 1. Convert the message to the proper format for StarkNet
        # 2. Use the StarkNet client to verify the signature
        # 3. Check that the signature was created by the account at the given address
        
        try:
            # For now, we'll do basic validation
            if not signature or len(signature) < 2:
                return False
            
            # Check if the address format is valid
            if not address.startswith("0x") or len(address) != 66:
                return False
            
            # TODO: Implement actual StarkNet signature verification
            # This would involve:
            # - Getting the account contract at the address
            # - Calling the account's is_valid_signature function
            # - Verifying the signature components
            
            # For development, return True for valid format
            logger.warning("Using placeholder signature verification - implement proper verification for production")
            return True
            
        except Exception as e:
            logger.error(f"Error in StarkNet signature verification: {e}")
            return False
    
    def cleanup_expired_challenges(self):
        """Clean up expired challenges."""
        current_time = int(time.time())
        expired_addresses = []
        
        for address, challenge in self.challenges.items():
            if current_time > int(challenge["expires_at"]):
                expired_addresses.append(address)
        
        for address in expired_addresses:
            self.challenges.pop(address, None)
            logger.info(f"Cleaned up expired challenge for address: {address}")


# Global authenticator instance
starknet_authenticator = StarkNetAuthenticator()
