# Worker Architecture Diagrams

## System Overview

```
┌─────────────────┐
│                 │
│   Frontend      │  Creates jobs, views results
│   (Next.js)     │
│                 │
└────────┬────────┘
         │ HTTP
         ▼
┌─────────────────┐
│                 │
│   Backend API   │  Manages jobs, auth, events
│   (FastAPI)     │
│                 │
└────┬─────┬──────┘
     │     │
     │     └──────────┐
     │ HTTP           │ Blockchain
     ▼                ▼
┌─────────────┐  ┌──────────────┐
│             │  │              │
│   Worker    │  │  StarkNet    │
│  (Python)   │  │  Network     │
│             │  │              │
└──────┬──────┘  └──────────────┘
       │
       │ HTTP
       ▼
┌──────────────┐
│              │
│     IPFS     │  Stores .blend files & results
│   Network    │
│              │
└──────────────┘
```

## Old Worker Flow (Deprecated)

```
                    ┌──────────────────────────┐
                    │                          │
                    │     Worker Process       │
                    │                          │
                    └────────┬─────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │          │ │          │ │          │
         │ StarkNet │ │   IPFS   │ │ Blender  │
         │   RPC    │ │  Client  │ │  Engine  │
         │          │ │          │ │          │
         └──────────┘ └──────────┘ └──────────┘
               │
               │ Polls every 10s
               ▼
       ┌────────────────┐
       │ Job Registry   │
       │   Contract     │
       └────────────────┘

Issues:
- ❌ Heavy blockchain load
- ❌ No centralized state
- ❌ Difficult error handling
- ❌ No worker authentication
```

## New Worker Flow (API-Based)

```
                    ┌──────────────────────────┐
                    │                          │
                    │     Worker Process       │
                    │                          │
                    └────────┬─────────────────┘
                             │
                ┌────────────┼────────────┐
                │            │            │
                ▼            ▼            ▼
         ┌──────────┐ ┌──────────┐ ┌──────────┐
         │          │ │          │ │          │
         │ Backend  │ │   IPFS   │ │ Blender  │
         │   API    │ │  Client  │ │  Engine  │
         │          │ │          │ │          │
         └────┬─────┘ └──────────┘ └──────────┘
              │
              │ Backend handles blockchain
              ▼
       ┌────────────────┐
       │   Database +   │
       │   Blockchain   │
       └────────────────┘

Benefits:
- ✅ Reduced blockchain load
- ✅ Centralized job state
- ✅ Better error handling  
- ✅ Secure authentication
```

## Authentication Flow

```
┌─────────┐                           ┌──────────┐
│         │  1. POST /auth/challenge  │          │
│         │  {address}                │          │
│ Worker  │──────────────────────────>│ Backend  │
│         │                           │          │
│         │  2. {challenge}           │          │
│         │<──────────────────────────│          │
└────┬────┘                           └──────────┘
     │
     │ 3. Sign challenge
     │    with private key
     │
┌────▼────┐                           ┌──────────┐
│         │  4. POST /auth/auth       │          │
│         │  {address, sig, challenge}│          │
│ Worker  │──────────────────────────>│ Backend  │
│         │                           │          │
│         │  5. {access_token}        │          │
│         │<──────────────────────────│          │
└─────────┘                           └──────────┘
     │
     │ 6. Store token for
     │    future requests
     ▼
```

## Job Processing Flow

```
┌─────────────────────────────────────────────────────┐
│                   Worker Main Loop                  │
└─────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
     ┌────────┐      ┌────────┐     ┌────────┐
     │ Authen-│      │  Poll  │     │ Sleep  │
     │ ticate │      │  Jobs  │     │  10s   │
     └────┬───┘      └───┬────┘     └────────┘
          │              │
          │              ▼
          │         ┌─────────┐
          │         │Found Job?│
          │         └────┬─────┘
          │              │
          │         Yes  │  No ──────┐
          │              ▼           │
          │         ┌─────────┐      │
          │         │  Claim  │      │
          │         │   Job   │      │
          │         └────┬────┘      │
          │              │           │
          │              ▼           │
          │         ┌─────────┐      │
          │         │Download │      │
          │         │  .blend │      │
          │         └────┬────┘      │
          │              │           │
          │              ▼           │
          │         ┌─────────┐      │
          │         │Validate │      │
          │         │  File   │      │
          │         └────┬────┘      │
          │              │           │
          │              ▼           │
          │         ┌─────────┐      │
          │         │ Render  │      │
          │         │w/Blender│      │
          │         └────┬────┘      │
          │              │           │
          │              ▼           │
          │         ┌─────────┐      │
          │         │ Upload  │      │
          │         │to IPFS  │      │
          │         └────┬────┘      │
          │              │           │
          │              ▼           │
          │         ┌─────────┐      │
          │         │ Submit  │      │
          │         │ Result  │      │
          │         └────┬────┘      │
          │              │           │
          └──────────────┴───────────┘
                         │
                         ▼
                  Continue Loop
```

## API Endpoints Used by Worker

```
┌──────────────────────────────────────────────────┐
│              Worker API Interactions             │
└──────────────────────────────────────────────────┘

POST /api/v1/auth/challenge
    Request:  {address: "0x..."}
    Response: {challenge: "random_string"}
    
POST /api/v1/auth/authenticate  
    Request:  {address, signature, challenge}
    Response: {access_token: "eyJhbG..."}
    
GET /api/v1/jobs/available?status=pending
    Headers:  Authorization: Bearer <token>
    Response: [{id, asset_cid, reward, ...}]
    
POST /api/v1/jobs/{id}/assign
    Headers:  Authorization: Bearer <token>
    Request:  {worker_address: "0x..."}
    Response: {success: true}
    
POST /api/v1/jobs/{id}/complete
    Headers:  Authorization: Bearer <token>
    Request:  {result_cid: "QmXyz..."}
    Response: {success: true}
```

## IPFS Operations

```
┌─────────────────────────────────────────────────┐
│              IPFS Client Workflow               │
└─────────────────────────────────────────────────┘

Download .blend file:
┌─────────┐
│ Try     │  ipfshttpclient.get(cid)
│ Client  │─────────────────────────────> Success
│ Library │                                   │
└────┬────┘                                   │
     │ Failed                                 │
     ▼                                        │
┌─────────┐                                   │
│ Try     │  POST /api/v0/get?arg=cid         │
│ IPFS    │─────────────────────────────> Success
│ API     │                                   │
└────┬────┘                                   │
     │ Failed                                 │
     ▼                                        │
┌─────────┐                                   │
│ Try     │  GET gateway/ipfs/{cid}           │
│ Gateway │─────────────────────────────> Success
│         │                                   │
└─────────┘                                   │
                                              ▼
                                         ┌─────────┐
                                         │  File   │
                                         │Extracted│
                                         └─────────┘

Upload result:
┌─────────┐
│ IPFS    │  ipfshttpclient.add(file)
│ Client  │────────────────────────────> {Hash: "QmXyz..."}
└─────────┘
     │ or
     ▼
┌─────────┐
│ HTTP    │  POST /api/v0/add
│ API     │────────────────────────────> {Hash: "QmXyz..."}
└─────────┘
```

## Error Handling

```
┌──────────────────────────────────────────────────┐
│              Worker Error Handling               │
└──────────────────────────────────────────────────┘

Authentication Failed
    ├─> Log error
    ├─> Wait 5 seconds
    └─> Retry

Job Download Failed
    ├─> Log error
    ├─> Skip job
    └─> Continue polling

Blend Validation Failed
    ├─> Log error
    ├─> Skip job
    └─> Continue polling

Render Failed
    ├─> Log error + traceback
    ├─> Skip job
    └─> Continue polling

Upload Failed
    ├─> Retry with gateway
    ├─> If still fails, skip job
    └─> Continue polling

Submission Failed
    ├─> Log error
    ├─> Retry once
    └─> Continue polling

Network Error
    ├─> Log error
    ├─> Wait 10 seconds
    └─> Continue polling
```

## Data Flow Example

```
Job Creation to Completion:

1. Frontend:
   User fills form → Uploads .blend to IPFS → Creates job
   
2. Backend:
   Receives job → Stores in DB → Sets status="pending"
   
3. Worker:
   Polls jobs → Finds pending job → Claims it
   
4. Worker:
   Downloads from IPFS → Validates → Renders
   
5. Worker:
   Uploads result → Gets CID → Submits to backend
   
6. Backend:
   Updates job status → Stores result_cid → Emits event
   
7. Frontend:
   Receives event → Updates UI → Shows result
```

## Comparison Matrix

| Feature | Old Worker | New Worker |
|---------|-----------|------------|
| **Blockchain Access** | Direct RPC | Via Backend |
| **Authentication** | None | JWT Token |
| **Job Discovery** | Contract Scan | API Poll |
| **Job Claiming** | Transaction | API Call |
| **Result Submission** | Transaction | API Call |
| **Error Reporting** | Logs Only | API + Logs |
| **State Management** | Local Only | Backend DB |
| **Monitoring** | None | Backend Metrics |
| **Scalability** | Limited | High |
| **Setup Complexity** | Medium | Low |

## Component Diagram

```
┌────────────────────────────────────────────────┐
│           WorkerAuthenticator                  │
├────────────────────────────────────────────────┤
│ - backend_url: str                             │
│ - worker_address: str                          │
│ - token: Optional[str]                         │
├────────────────────────────────────────────────┤
│ + authenticate() -> bool                       │
│ + ensure_authenticated() -> bool               │
│ + get_headers() -> Dict                        │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│              IPFSClient                        │
├────────────────────────────────────────────────┤
│ - api_endpoint: str                            │
│ - client: Optional[ipfshttpclient]             │
│ - http_url: str                                │
├────────────────────────────────────────────────┤
│ + get(cid, target) -> Dict                     │
│ + add(file_path) -> Dict                       │
└────────────────────────────────────────────────┘

┌────────────────────────────────────────────────┐
│           Main Worker Functions                │
├────────────────────────────────────────────────┤
│ • poll_available_jobs(auth) -> List[Job]       │
│ • claim_job(auth, job_id) -> bool              │
│ • download_blend_file(ipfs, cid, dir) -> str   │
│ • validate_blend_file(path) -> bool            │
│ • render_blend_file(path, output) -> str       │
│ • upload_render_result(ipfs, path) -> str      │
│ • submit_job_completion(auth, id, cid) -> bool │
│ • process_render_job(ipfs, id, cid) -> str     │
└────────────────────────────────────────────────┘
```

---

**Legend:**
- → : Data flow
- ▼ : Process flow
- ├─ : Decision branch
- └─ : Final action
