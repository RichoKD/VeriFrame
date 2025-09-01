from pydantic import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database settings
    database_url: str = "postgresql+asyncpg://user:password@localhost/veriframe"
    
    # StarkNet settings
    starknet_rpc_url: str = "http://localhost:5050"
    contract_address: str = ""
    contract_abi_path: str = "./contracts/job_registry/target/dev/veriframe_job_registry.contract_class.json"
    network: str = "devnet"
    
    # Event indexing settings
    enable_event_indexing: bool = True
    start_block: int = 0
    indexer_poll_interval: int = 10  # seconds
    
    # Redis settings
    redis_url: str = "redis://localhost:6379"
    
    # IPFS settings
    ipfs_url: str = "http://localhost:5001"
    
    # API settings
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:8080"]
    
    # Security
    secret_key: str = "your-secret-key-here"
    
    # Logging
    log_level: str = "INFO"
    
    class Config:
        env_file = ".env"

# Global settings instance
_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
