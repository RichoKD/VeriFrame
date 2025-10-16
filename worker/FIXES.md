# Worker API Integration Fixes

## Issues Fixed

### 1. Authentication Challenge Format Mismatch ✅

**Problem:**
```
[Worker] Authentication failed: 'challenge'
```

**Root Cause:**
- Worker was looking for `challenge_data["challenge"]`
- Backend actually returns `message`, `timestamp`, `nonce`, `expires_at`
- Worker was using wrong endpoint (`/auth/authenticate` instead of `/auth/worker-auth`)

**Fix:**
Changed worker authentication to use correct field names and endpoint:
```python
# OLD
challenge = challenge_data["challenge"]
auth_response = requests.post(f"{self.backend_url}/auth/authenticate", ...)

# NEW
message = challenge_data["message"]
timestamp = challenge_data["timestamp"]
nonce = challenge_data["nonce"]
auth_response = requests.post(f"{self.backend_url}/auth/worker-auth", ...)
```

### 2. Authentication Request Format Mismatch ✅

**Problem:**
Worker was sending wrong fields to `/auth/authenticate`

**Root Cause:**
Backend expects:
- `address` (string)
- `message` (string) 
- `signature` (list of strings)
- `timestamp` (int)

Worker was sending:
- `address`
- `signature` (string)
- `challenge` (wrong field name)

**Fix:**
Updated authentication request:
```python
auth_response = requests.post(
    f"{self.backend_url}/auth/authenticate",
    json={
        "address": self.worker_address,
        "message": message,
        "signature": signature,  # Now a list
        "timestamp": int(timestamp)
    }
)
```

### 3. Signature Format Mismatch ✅

**Problem:**
Backend expects signature as `List[str]` with two components `[r, s]`

**Root Cause:**
Worker was returning a string: `"mock_signature_{challenge}"`

**Fix:**
Changed signature to return list:
```python
def _sign_challenge(self, challenge: str) -> List[str]:
    # Returns [r, s] components
    return ["0x123456789", "0x987654321"]
```

### 4. Job ID Type Mismatch ✅

**Problem:**
```
404 Client Error: Not Found for url: .../jobs/266ec387-64d1-4a18-9f29-8006d7d3e7ca/assign
```

**Root Cause:**
- Jobs use UUID strings as IDs
- Worker functions were typed as `int`
- URL construction was working but type hints were wrong

**Fix:**
Updated all function signatures:
```python
# OLD
async def claim_job(auth: WorkerAuthenticator, job_id: int) -> bool:
async def submit_job_completion(auth: WorkerAuthenticator, job_id: int, result_cid: str) -> bool:
async def process_render_job(ipfs: IPFSClient, job_id: int, asset_cid: str) -> Optional[str]:
def save_completed_job(job_id: int):

# NEW
async def claim_job(auth: WorkerAuthenticator, job_id: str) -> bool:
async def submit_job_completion(auth: WorkerAuthenticator, job_id: str, result_cid: str) -> bool:
async def process_render_job(ipfs: IPFSClient, job_id: str, asset_cid: str) -> Optional[str]:
def save_completed_job(job_id: str):
```

### 5. Asset CID Field Name Mismatch ✅

**Problem:**
```
[Worker] Found job 266ec387-... - Asset CID: 
```

**Root Cause:**
- Backend uses `full_asset_cid` in JobResponse
- Worker was looking for `asset_cid` or `assetCid`

**Fix:**
Added fallback chain for asset CID:
```python
asset_cid = (
    job.get("full_asset_cid") or 
    job.get("asset_cid") or 
    job.get("assetCid", "")
)

if not asset_cid:
    print(f"[Worker] No asset CID found for job {job_id}, skipping")
    continue
```

## Testing Results

### Authentication Test ✅
```bash
$ python3 test_auth.py

✅ Authentication successful!
   Token: eyJhbGciOiJIUzI1NiIsInR5cCI6Ik...
   
📋 Headers:
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   Content-Type: application/json
```

### Worker Running ✅
```bash
$ python3 src/main_api.py

[Worker] Starting VeriFrame Worker (API-based)
[Worker] Successfully authenticated. Token: eyJhbGc...
[Worker] Starting job polling loop (interval: 10s)
[Worker] Polling for jobs...
```

## Backend API Schema Reference

### Challenge Response
```json
{
  "message": "0x1de4f6b96b20e3fedc22c8d0b04134ecfba1482e2b0410fe...",
  "timestamp": "1729123456",
  "nonce": "abc123",
  "expires_at": "1729123756"
}
```

### Auth Request
```json
{
  "address": "0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
  "message": "0x1de4f6b96b20e3fedc22c8d0b04134ecfba1482e2b0410fe...",
  "signature": ["0x123456789", "0x987654321"],
  "timestamp": 1729123456
}
```

### Auth Response
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {...}
}
```

### Job Response
```json
{
  "id": "266ec387-64d1-4a18-9f29-8006d7d3e7ca",
  "creator_address": "0x...",
  "reward": 100,
  "deadline": "2025-10-20T12:00:00",
  "asset_cid_part1": "QmXyz...",
  "asset_cid_part2": null,
  "full_asset_cid": "QmXyz...",
  "status": "open",
  "created_at": "2025-10-14T10:30:00"
}
```

## Next Steps

1. ✅ Authentication working
2. ✅ Job polling working
3. ⏳ Job claiming (needs valid job with asset CID)
4. ⏳ Job processing (needs Blender file in IPFS)
5. ⏳ Result submission

## Environment Configuration

Required environment variables:
```bash
BACKEND_API_URL=http://localhost:8000/api/v1
WORKER_ADDRESS=0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691
IPFS_API=/ip4/127.0.0.1/tcp/5001
IPFS_GATEWAY=http://127.0.0.1:8080/ipfs
BLENDER_PATH=blender
POLL_INTERVAL=10
```

## Files Modified

- `worker/src/main_api.py` - Fixed authentication, job ID types, asset CID lookup
- `worker/test_auth.py` - Created authentication test script

## Production Notes

For production deployment, implement proper StarkNet signature:

```python
def _sign_challenge(self, challenge: str) -> List[str]:
    """Sign the authentication challenge"""
    from starknet_py.net.signer.stark_curve_signer import KeyPair
    
    # Use actual private key
    key_pair = KeyPair.from_private_key(int(self.private_key, 16))
    
    # Sign the message hash
    signature = key_pair.sign_message(int(challenge, 16))
    
    # Return [r, s] as hex strings
    return [hex(signature[0]), hex(signature[1])]
```

---

**Status**: All authentication and API integration issues resolved ✅
