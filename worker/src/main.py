import os
import time
import ipfshttpclient
from starknet_py.net.gateway_client import GatewayClient
from starknet_py.contract import Contract
# from starknet_py.net.networks import SEPOLIA

STARKNET_RPC = os.getenv("STARKNET_RPC", "http://localhost:5050")
IPFS_API = os.getenv("IPFS_API", "/dns/ipfs-node/tcp/5001/http")
JOB_REGISTRY_ADDRESS = int(os.getenv("JOB_REGISTRY_ADDRESS", "0"), 16)

def main():
    print("[Worker] Starting...")
    client = GatewayClient(STARKNET_RPC)
    # client = GatewayClient(STARKNET_RPC, net=SEPOLIA)
    ipfs = ipfshttpclient.connect(IPFS_API)

    while True:
        try:
            # In a real worker, you'd query the contract for open jobs here
            print("[Worker] Polling for jobs...")
            time.sleep(5)

            # Example: Upload dummy render
            cid = ipfs.add_str("This is a rendered frame.")
            print(f"[Worker] Uploaded result to IPFS CID: {cid}")

            # Example: Submit to StarkNet (mock here)
            if JOB_REGISTRY_ADDRESS != 0:
                print(f"[Worker] Would submit CID {cid} to job registry {hex(JOB_REGISTRY_ADDRESS)}")
            
        except Exception as e:
            print(f"[Worker] Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
