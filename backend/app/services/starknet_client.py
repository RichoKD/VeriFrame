# from starknet_py.net.client import Client
from starknet_py.net.full_node_client import FullNodeClient

from starknet_py.net.models import StarknetChainId
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.signer.stark_curve_signer import KeyPair
from app.config import get_settings
import logging
import json
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

class StarkNetClient:
    def __init__(self):
        self.settings = get_settings()
        self.client = None
        self.contract = None
        self.account = None
        
    async def initialize(self):
        """Initialize the StarkNet client and contract"""
        try:
            # Create client
            self.client = FullNodeClient(node_url=self.settings.starknet_rpc_url)
            # self.client = GatewayClient(self.settings.starknet_rpc_url)
            # self.client = Client()
            # self.client = Client(
            #     node_url=self.settings.starknet_rpc_url,
            #     chain=StarknetChainId.TESTNET if self.settings.network == "testnet" else StarknetChainId.MAINNET
            # )
            
            # Load contract ABI
            with open(self.settings.contract_abi_path, 'r') as f:
                contract_class = json.load(f)
            
            # Extract ABI from contract class
            contract_abi = contract_class.get('abi', contract_class)
            
            # Create contract instance
            self.contract = Contract(
                address=self.settings.contract_address,
                abi=contract_abi,
                provider=self.client
            )
            
            logger.info(f"StarkNet client initialized for contract {self.settings.contract_address}")
            
        except Exception as e:
            logger.error(f"Failed to initialize StarkNet client: {e}")
            raise

    async def get_worker_info(self, worker_address: str) -> Optional[Dict[str, Any]]:
        """Get worker information from the contract"""
        try:
            if not self.contract:
                await self.initialize()
            
            # Call get_worker function
            result = await self.contract.functions["get_worker"].call(worker_address)
            
            return {
                "registered": result.registered,
                "verified": result.verified,
                "reputation": result.reputation,
                "jobs_completed": result.jobs_completed,
                "info_cid_part1": result.info_cid_part1,
                "info_cid_part2": result.info_cid_part2
            }
            
        except Exception as e:
            logger.error(f"Failed to get worker info for {worker_address}: {e}")
            return None

    async def get_job_info(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get job information from the contract"""
        try:
            if not self.contract:
                await self.initialize()
            
            # Call get_job function
            result = await self.contract.functions["get_job"].call(job_id)
            
            return {
                "creator": result.creator,
                "asset_cid_part1": result.asset_cid_part1,
                "asset_cid_part2": result.asset_cid_part2,
                "reward": result.reward,
                "deadline": result.deadline,
                "min_reputation": result.min_reputation,
                "worker": result.worker,
                "completed": result.completed,
                "result_cid_part1": result.result_cid_part1,
                "result_cid_part2": result.result_cid_part2,
                "quality_score": result.quality_score
            }
            
        except Exception as e:
            logger.error(f"Failed to get job info for {job_id}: {e}")
            return None

    async def is_worker_eligible(self, worker_address: str, job_id: int) -> bool:
        """Check if worker is eligible for a job"""
        try:
            if not self.contract:
                await self.initialize()
            
            result = await self.contract.functions["is_worker_eligible"].call(worker_address, job_id)
            return bool(result.eligible)
            
        except Exception as e:
            logger.error(f"Failed to check worker eligibility for {worker_address}, job {job_id}: {e}")
            return False

    async def get_latest_block_number(self) -> Optional[int]:
        """Get the latest block number"""
        try:
            if not self.client:
                await self.initialize()
            
            block = await self.client.get_block("latest")
            return block.block_number
            
        except Exception as e:
            logger.error(f"Failed to get latest block number: {e}")
            return None

    async def get_events(
        self, 
        from_block: int = 0, 
        to_block: Optional[int] = None,
        event_filter: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """Get contract events"""
        try:
            if not self.client:
                await self.initialize()
            
            if to_block is None:
                to_block = await self.get_latest_block_number()
            
            # Get events from the contract
            events = await self.client.get_events(
                address=self.settings.contract_address,
                from_block=from_block,
                to_block=to_block,
                keys=event_filter
            )
            
            processed_events = []
            for event in events.events:
                processed_events.append({
                    "transaction_hash": event.transaction_hash,
                    "block_number": event.block_number,
                    "event_index": event.event_index,
                    "contract_address": event.from_address,
                    "keys": event.keys,
                    "data": event.data
                })
            
            return processed_events
            
        except Exception as e:
            logger.error(f"Failed to get events from block {from_block} to {to_block}: {e}")
            return []

    async def decode_event(self, event_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Decode a contract event"""
        try:
            if not self.contract:
                await self.initialize()
            
            # Map event keys to event names
            event_map = {
                # Add event key mappings here based on your contract
                # This would need to be populated with actual event selectors
            }
            
            event_key = event_data.get("keys", [None])[0]
            if event_key in event_map:
                event_name = event_map[event_key]
                
                # Decode based on event type
                # This would need specific decoding logic for each event type
                return {
                    "event_name": event_name,
                    "decoded_data": event_data["data"]  # Simplified - would need proper decoding
                }
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to decode event: {e}")
            return None

# Singleton instance
_starknet_client = None

async def get_starknet_client() -> StarkNetClient:
    """Get or create StarkNet client instance"""
    global _starknet_client
    if _starknet_client is None:
        _starknet_client = StarkNetClient()
        await _starknet_client.initialize()
    return _starknet_client
