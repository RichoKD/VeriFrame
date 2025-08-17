import os
import time
import asyncio
import subprocess
import tempfile
import shutil
import ipfshttpclient
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.contract import Contract
from starknet_py.net.models import StarknetChainId
import json

STARKNET_RPC = os.getenv("STARKNET_RPC", "http://localhost:5050")
IPFS_API = os.getenv("IPFS_API", "/dns/ipfs-node/tcp/5001/http")
JOB_REGISTRY_ADDRESS = int(os.getenv("JOB_REGISTRY_ADDRESS", "0"), 16)
BLENDER_PATH = os.getenv("BLENDER_PATH", "blender")  # Path to Blender executable

# Load the contract ABI
CONTRACT_ABI = [
    {
        "type": "function",
        "name": "get_job_creator",
        "inputs": [{"name": "job_id", "type": "core::felt252"}],
        "outputs": [{"type": "core::felt252"}],
        "state_mutability": "view",
    },
    {
        "type": "function", 
        "name": "get_job_worker",
        "inputs": [{"name": "job_id", "type": "core::felt252"}],
        "outputs": [{"type": "core::felt252"}],
        "state_mutability": "view",
    },
    {
        "type": "function",
        "name": "get_job_reward", 
        "inputs": [{"name": "job_id", "type": "core::felt252"}],
        "outputs": [{"type": "core::integer::u256"}],
        "state_mutability": "view",
    },
    {
        "type": "function",
        "name": "get_job_asset_cid",
        "inputs": [{"name": "job_id", "type": "core::felt252"}],
        "outputs": [{"type": "core::felt252"}],
        "state_mutability": "view",
    },
    {
        "type": "function",
        "name": "submit_result",
        "inputs": [
            {"name": "job_id", "type": "core::felt252"},
            {"name": "result_cid", "type": "core::felt252"}
        ],
        "outputs": [],
        "state_mutability": "external",
    },
]

def felt252_to_string(felt_value):
    """Convert felt252 to string (simplified IPFS CID conversion)"""
    try:
        # Convert felt to bytes and decode (this is simplified - in production use proper encoding)
        if felt_value == 0:
            return ""
        byte_data = felt_value.to_bytes(32, 'big').lstrip(b'\x00')
        return byte_data.decode('utf-8', errors='ignore')
    except:
        return str(felt_value)

def string_to_felt252(text):
    """Convert string to felt252 (simplified conversion)"""
    try:
        # Take first 31 bytes to fit in felt252
        byte_data = text.encode('utf-8')[:31]
        return int.from_bytes(byte_data, 'big')
    except:
        return 0

async def download_blend_file(ipfs, cid, temp_dir):
    """Download .blend file from IPFS"""
    try:
        blend_path = os.path.join(temp_dir, f"{cid}.blend")
        print(f"[Worker] Downloading .blend file from IPFS CID: {cid}")
        
        # Download file from IPFS
        ipfs.get(cid, target=temp_dir)
        
        # IPFS creates a directory with the CID name, find the .blend file
        cid_dir = os.path.join(temp_dir, cid)
        if os.path.exists(cid_dir):
            for file in os.listdir(cid_dir):
                if file.endswith('.blend'):
                    src_path = os.path.join(cid_dir, file)
                    shutil.move(src_path, blend_path)
                    print(f"[Worker] Downloaded .blend file to: {blend_path}")
                    return blend_path
        
        # If no .blend file found, assume the CID itself is the .blend file
        downloaded_path = os.path.join(temp_dir, cid)
        if os.path.exists(downloaded_path):
            shutil.move(downloaded_path, blend_path)
            return blend_path
            
        print(f"[Worker] Error: Could not find .blend file for CID {cid}")
        return None
        
    except Exception as e:
        print(f"[Worker] Error downloading .blend file: {e}")
        return None

async def render_blend_file(blend_path, output_dir):
    """Render the .blend file using Blender"""
    try:
        output_path = os.path.join(output_dir, "render.png")
        print(f"[Worker] Rendering {blend_path} to {output_path}")
        
        # Blender command to render the file
        cmd = [
            BLENDER_PATH,
            "-b",  # Run in background
            blend_path,
            "-o", output_path,  # Output path
            "-f", "1",  # Render frame 1
            "--python-exit-code", "1"  # Exit with error code on Python errors
        ]
        
        # Run Blender
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        if result.returncode == 0 and os.path.exists(output_path):
            print(f"[Worker] Successfully rendered to: {output_path}")
            return output_path
        else:
            print(f"[Worker] Blender render failed:")
            print(f"[Worker] stdout: {result.stdout}")
            print(f"[Worker] stderr: {result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        print(f"[Worker] Blender render timed out")
        return None
    except Exception as e:
        print(f"[Worker] Error during rendering: {e}")
        return None

async def upload_render_result(ipfs, render_path):
    """Upload rendered image to IPFS"""
    try:
        print(f"[Worker] Uploading render result to IPFS: {render_path}")
        result = ipfs.add(render_path)
        cid = result['Hash']
        print(f"[Worker] Uploaded render result to IPFS CID: {cid}")
        return cid
    except Exception as e:
        print(f"[Worker] Error uploading render result: {e}")
        return None

async def check_for_jobs(contract, max_job_id=100):
    """Check for available jobs by iterating through job IDs"""
    available_jobs = []
    
    for job_id in range(1, max_job_id + 1):
        try:
            # Check if job exists by getting creator
            creator = await contract.functions["get_job_creator"].call(job_id)
            if creator != 0:  # Job exists
                # Check if job has no worker assigned yet
                worker = await contract.functions["get_job_worker"].call(job_id)
                if worker == 0:  # No worker assigned
                    reward = await contract.functions["get_job_reward"].call(job_id)
                    asset_cid_felt = await contract.functions["get_job_asset_cid"].call(job_id)
                    asset_cid = felt252_to_string(asset_cid_felt)
                    
                    available_jobs.append({
                        "job_id": job_id,
                        "creator": hex(creator),
                        "reward": reward,
                        "asset_cid": asset_cid,
                    })
                    print(f"[Worker] Found available job {job_id} with reward {reward}, asset CID: {asset_cid}")
        except Exception as e:
            # Job might not exist, continue
            continue
            
    return available_jobs

async def submit_job_result(contract, job_id, result_cid):
    """Submit a result for a specific job"""
    try:
        # Convert IPFS CID string to felt252
        cid_felt = string_to_felt252(result_cid)
        
        # Submit the result
        call = await contract.functions["submit_result"].invoke(job_id, cid_felt)
        await call.wait_for_acceptance()
        print(f"[Worker] Successfully submitted result for job {job_id}")
        return True
    except Exception as e:
        print(f"[Worker] Error submitting result for job {job_id}: {e}")
        return False

async def process_render_job(ipfs, job_id, asset_cid):
    """Process a complete rendering job: download .blend, render, upload result"""
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Download .blend file from IPFS
            blend_path = await download_blend_file(ipfs, asset_cid, temp_dir)
            if not blend_path:
                return None
                
            # Render the .blend file
            render_path = await render_blend_file(blend_path, temp_dir)
            if not render_path:
                return None
                
            # Upload rendered result to IPFS
            result_cid = await upload_render_result(ipfs, render_path)
            if not result_cid:
                return None
                
            print(f"[Worker] Job {job_id} rendering complete. Result CID: {result_cid}")
            return result_cid
            
        except Exception as e:
            print(f"[Worker] Error processing render job {job_id}: {e}")
            return None

async def main():
    print("[Worker] Starting Blender rendering worker...")
    print(f"[Worker] Blender path: {BLENDER_PATH}")
    
    # Check if Blender is available
    try:
        result = subprocess.run([BLENDER_PATH, "--version"], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            version_line = result.stdout.split('\n')[0] if result.stdout else "Unknown version"
            print(f"[Worker] Blender found: {version_line}")
        else:
            print("[Worker] Warning: Blender not found or not working properly")
            print(f"[Worker] Error: {result.stderr}")
    except Exception as e:
        print(f"[Worker] Warning: Could not check Blender version: {e}")
    
    if JOB_REGISTRY_ADDRESS == 0:
        print("[Worker] No job registry address provided. Exiting.")
        return
    
    try:
        # Initialize clients
        client = FullNodeClient(node_url=STARKNET_RPC)
        ipfs = ipfshttpclient.connect(IPFS_API)
        
        # Create contract instance
        contract = Contract(
            address=JOB_REGISTRY_ADDRESS,
            abi=CONTRACT_ABI,
            provider=client,
        )
        
        print(f"[Worker] Connected to job registry at {hex(JOB_REGISTRY_ADDRESS)}")
        print(f"[Worker] Connected to IPFS at {IPFS_API}")
        
        while True:
            try:
                # Check for available jobs
                print("[Worker] Polling for rendering jobs...")
                jobs = await check_for_jobs(contract)
                
                if jobs:
                    # Process the first available job
                    job = jobs[0]
                    job_id = job["job_id"]
                    asset_cid = job["asset_cid"]
                    
                    print(f"[Worker] Taking render job {job_id} for asset CID: {asset_cid}")
                    
                    # Process the rendering job
                    result_cid = await process_render_job(ipfs, job_id, asset_cid)
                    
                    if result_cid:
                        # Submit the result
                        success = await submit_job_result(contract, job_id, result_cid)
                        
                        if success:
                            print(f"[Worker] Completed render job {job_id}")
                        else:
                            print(f"[Worker] Failed to submit result for job {job_id}")
                    else:
                        print(f"[Worker] Failed to process render job {job_id}")
                else:
                    print("[Worker] No available rendering jobs found")
                
                # Wait before next polling cycle
                await asyncio.sleep(10)
                
            except Exception as e:
                print(f"[Worker] Error in main loop: {e}")
                await asyncio.sleep(5)
                
    except Exception as e:
        print(f"[Worker] Initialization error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
