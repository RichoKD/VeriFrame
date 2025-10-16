# Worker Authentication Endpoint Fix

## Issue
Worker was using `/auth/authenticate` endpoint which is designed for **users** (frontend wallet connections), not **workers** (compute nodes).

## Difference Between Endpoints

### `/auth/authenticate` - For Users
- Creates/updates **User** records
- Returns `user` field in response
- Used by frontend for wallet login
- Tracks `login_count`, user activity

### `/auth/worker-auth` - For Workers  
- Creates/updates **Worker** records
- Returns `worker` field in response
- Used by worker nodes for API access
- Tracks worker performance, jobs completed

## The Fix

Changed worker authentication from:
```python
# WRONG - User endpoint
auth_response = requests.post(
    f"{self.backend_url}/auth/authenticate",
    ...
)
```

To:
```python
# CORRECT - Worker endpoint
auth_response = requests.post(
    f"{self.backend_url}/auth/worker-auth",
    ...
)
```

## Why This Matters

1. **Database Separation**: Workers and Users are separate entities with different fields
2. **Proper Tracking**: Worker statistics (jobs completed, reputation) are tracked separately
3. **Authorization**: Backend can enforce different permissions for workers vs users
4. **Data Integrity**: Worker addresses stored in `workers` table, not `users` table

## Response Differences

### User Authentication Response
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "user": {
    "id": "...",
    "address": "0x...",
    "role": "creator",
    "login_count": 5
  }
}
```

### Worker Authentication Response
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "worker": {
    "id": "...",
    "address": "0x...",
    "total_jobs_completed": 42,
    "reputation_score": 95
  }
}
```

## Files Updated

1. `worker/src/main_api.py` - Changed endpoint to `/auth/worker-auth`
2. `worker/test_auth.py` - Updated test description
3. `worker/README_API.md` - Updated documentation
4. `worker/FIXES.md` - Added endpoint issue to fixes

## Testing

Run the worker again to verify it creates a Worker record instead of User:

```bash
cd worker
python3 test_auth.py
```

Expected output:
```
[Worker] Submitting signed challenge to /worker-auth
[Worker] Successfully authenticated. Token: eyJhbGc...
✅ Authentication successful!
```

Backend should log:
```
INFO:     Created new worker account for address: 0x064b48...
```

## Database Check

To verify the worker was created correctly:

```sql
-- Check workers table
SELECT * FROM workers WHERE address = '0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691';

-- Should return a row with worker info
```

---

**Status**: Worker now correctly authenticates as a Worker entity, not a User ✅
