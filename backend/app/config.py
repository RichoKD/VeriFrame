from pydantic_settings import BaseSettings
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
    
    # The Graph settings
    use_graph: bool = False  # Use The Graph instead of direct indexing
    graph_endpoint: str = "http://localhost:8000/subgraphs/name/veriframe/veriframe-subgraph"
    
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
    debug: bool = False
    
    # Additional fields from existing .env (optional)
    job_registry_contract_address: str = ""  # Legacy field
    starknet_network: str = "dev_net"  # Legacy field
    ipfs_api_url: str = "http://127.0.0.1:5001"
    ipfs_gateway_url: str = "http://127.0.0.1:8080"
    access_token_expire_minutes: int = 60
    algorithm: str = "HS256"
    event_polling_interval: int = 5
    max_retries: int = 3
    batch_size: int = 100
    log_format: str = "json"
    celery_broker_url: str = "redis://localhost:6379/1"
    celery_result_backend: str = "redis://localhost:6379/2"
    
    model_config = {"env_file": ".env", "extra": "ignore"}

# Global settings instance
_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
