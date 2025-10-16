# IPFS Integration in Frontend

## Overview

The frontend now automatically uploads files to IPFS when creating jobs, replacing the previous placeholder CID generation.

## How It Works

### File Upload Flow

1. **User selects a file** in the Create Job dialog
2. **Frontend uploads to IPFS** via HTTP API (127.0.0.1:5001)
3. **IPFS returns a CID** (Content Identifier)
4. **CID is stored** in the form data
5. **Job is created** with the real IPFS CID

### Code Implementation

```typescript
const uploadToIpfs = async (file: File): Promise<string | null> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://127.0.0.1:5001/api/v0/add', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  return result.Hash; // The IPFS CID
};
```

## UI Features

### Upload States

1. **Idle**: File input is ready
2. **Uploading**: Shows spinner and "Uploading to IPFS..."
3. **Success**: Shows file name and CID in a box
4. **Error**: Shows error message with troubleshooting tips

### Visual Feedback

- **Loading spinner** while uploading
- **Green checkmark** on success with file name
- **CID display** in a monospace box for easy copying
- **Info box** with IPFS daemon instructions
- **Error alerts** with actionable error messages
- **Disabled submit** button while uploading

## Prerequisites

### IPFS Daemon Must Be Running

```bash
# Start IPFS daemon
ipfs daemon

# Or run in background
ipfs daemon &
```

### Check IPFS Status

```bash
# Verify daemon is running
ipfs id

# Test API endpoint
curl http://127.0.0.1:5001/api/v0/version
```

## Error Handling

### Common Errors

1. **IPFS daemon not running**
   ```
   Error: Failed to fetch
   Solution: Start IPFS daemon
   ```

2. **CORS issues** (less common with local daemon)
   ```
   Error: CORS policy blocked
   Solution: IPFS daemon should allow localhost by default
   ```

3. **Large file upload timeout**
   ```
   Error: Upload timeout
   Solution: Increase timeout or use smaller files
   ```

## User Experience

### Before Upload
```
┌─────────────────────────────────────┐
│ Scene File * (.blend, .fbx, etc.)   │
│ [Choose File] No file chosen        │
│                                     │
│ ℹ IPFS Upload:                      │
│ File will be uploaded to your       │
│ local IPFS node (127.0.0.1:5001)   │
│ Make sure the IPFS daemon is        │
│ running: ipfs daemon                │
└─────────────────────────────────────┘
```

### During Upload
```
┌─────────────────────────────────────┐
│ Scene File * (.blend, .fbx, etc.)   │
│ [Choose File] cube.blend            │
│                                     │
│ ⟳ Uploading to IPFS...              │
└─────────────────────────────────────┘
```

### After Upload
```
┌─────────────────────────────────────┐
│ Scene File * (.blend, .fbx, etc.)   │
│ [Choose File] cube.blend            │
│                                     │
│ ✓ cube.blend                        │
│ ┌─────────────────────────────────┐ │
│ │ CID: QmYwAPJzv5CZsnA625s3Xf2... │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Testing

### 1. Create a Test File

```bash
# Simple cube scene
blender --background --python-expr "
import bpy
bpy.ops.mesh.primitive_cube_add()
bpy.ops.wm.save_as_mainfile(filepath='test_cube.blend')
"
```

### 2. Start IPFS

```bash
ipfs daemon
```

### 3. Create a Job

1. Go to `http://localhost:3000/dashboard/creators`
2. Click "Create Job"
3. Upload `test_cube.blend`
4. Watch it upload to IPFS
5. See the CID appear
6. Submit the job

### 4. Verify Worker Can Download

The worker should now successfully download and process the job:

```
[Worker] Found job xyz...
[Worker] Downloading asset CID: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
[Worker] Found blend file: /tmp/tmpxyz/test_cube.blend
[Worker] Rendering blend file...
[Worker] ✓ Successfully completed job xyz
```

## IPFS Configuration

### Local Node (Default)

```typescript
const IPFS_API_URL = 'http://127.0.0.1:5001';
```

### Remote Node (Infura, Pinata, etc.)

```typescript
// Infura
const IPFS_API_URL = 'https://ipfs.infura.io:5001';

// Pinata
const uploadToIpfs = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
    },
    body: formData,
  });

  const result = await response.json();
  return result.IpfsHash;
};
```

## File Size Limits

### Local IPFS
- No hard limit, but large files take longer
- Recommend < 100MB for better UX
- Consider chunking for very large files

### Remote Services
- **Infura**: 100MB limit
- **Pinata**: 25MB free tier
- **Web3.Storage**: Unlimited (but rate limited)

## Future Enhancements

### 1. Upload Progress Bar

```typescript
const uploadToIpfs = async (file: File, onProgress: (progress: number) => void) => {
  const xhr = new XMLHttpRequest();
  
  xhr.upload.addEventListener('progress', (e) => {
    const progress = (e.loaded / e.total) * 100;
    onProgress(progress);
  });
  
  // ... upload logic
};
```

### 2. Pinning Service Integration

```typescript
// Pin to ensure persistence
const pinToPinata = async (cid: string) => {
  await fetch('https://api.pinata.cloud/pinning/pinByHash', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ hashToPin: cid }),
  });
};
```

### 3. IPFS Gateway Selection

```typescript
const GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://gateway.pinata.cloud/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
];

// Test fastest gateway and use that
```

### 4. File Preview Before Upload

```typescript
const previewFile = (file: File) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    // Show file info, size, etc.
  };
  reader.readAsArrayBuffer(file);
};
```

## Troubleshooting

### Upload Fails Silently

**Check browser console**:
```javascript
// Open DevTools (F12) and look for errors
```

**Check IPFS logs**:
```bash
# In the terminal where IPFS daemon is running
# Look for POST /api/v0/add requests
```

### CID Not Appearing

**Verify upload succeeded**:
```bash
# List recently added files
ipfs pin ls --type=recursive | head

# Check specific file
ipfs cat <CID>
```

### Worker Can't Download File

**Test CID manually**:
```bash
# Download via CLI
ipfs get <CID>

# Download via gateway
curl http://127.0.0.1:8080/ipfs/<CID> -o test.blend
```

**Check IPFS connectivity**:
```bash
# See connected peers
ipfs swarm peers

# If no peers, file may not be discoverable
# Pin it to ensure it stays available
ipfs pin add <CID>
```

## Security Considerations

### File Type Validation

Currently accepts: `.blend`, `.fbx`, `.obj`, `.gltf`, `.glb`

```typescript
accept=".blend,.fbx,.obj,.gltf,.glb"
```

### File Size Validation

Add client-side size check:

```typescript
if (file.size > 100 * 1024 * 1024) { // 100MB
  setErrors({ file: 'File too large (max 100MB)' });
  return;
}
```

### Content Scanning

For production, consider:
- Virus scanning before upload
- Content validation (actually a valid .blend file)
- Metadata stripping for privacy

## Performance Optimization

### 1. Parallel Uploads

If splitting large files:
```typescript
const chunkFile = (file: File, chunkSize: number) => {
  const chunks = [];
  for (let i = 0; i < file.size; i += chunkSize) {
    chunks.push(file.slice(i, i + chunkSize));
  }
  return chunks;
};
```

### 2. Caching CIDs

Store uploaded CIDs locally:
```typescript
const cachedCids = new Map<string, string>(); // filename -> CID

// Before upload, check cache
const cached = cachedCids.get(file.name);
if (cached) {
  return cached;
}
```

### 3. Compression

Compress before upload:
```typescript
import pako from 'pako';

const compressFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const compressed = pako.gzip(new Uint8Array(arrayBuffer));
  return new Blob([compressed]);
};
```

---

## Summary

✅ **Real IPFS upload** instead of placeholder CIDs  
✅ **Visual feedback** during upload process  
✅ **Error handling** with helpful messages  
✅ **CID display** for verification  
✅ **Worker compatibility** - jobs now have valid CIDs  

The frontend now provides a complete IPFS integration for job creation! 🎉
