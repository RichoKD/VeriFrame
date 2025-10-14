# Testing with Real IPFS Files

## The Problem

When you create a job in the frontend, it currently generates a fake CID like `QmCopperblend` which is not a valid IPFS hash. The worker correctly fails to download this because it doesn't exist in IPFS.

## Solution: Upload to IPFS First

### Option 1: Upload via IPFS CLI

1. **Create or download a test .blend file**:
   ```bash
   # Option A: Create a simple cube scene
   blender --background --python - <<EOF
   import bpy
   bpy.ops.mesh.primitive_cube_add()
   bpy.ops.wm.save_as_mainfile(filepath='test_cube.blend')
   EOF
   
   # Option B: Use an existing .blend file
   cp /path/to/your/scene.blend test_scene.blend
   ```

2. **Start IPFS daemon** (if not running):
   ```bash
   ipfs daemon
   ```

3. **Upload the file to IPFS**:
   ```bash
   ipfs add test_cube.blend
   ```
   
   Output example:
   ```
   added QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG test_cube.blend
   ```

4. **Copy the CID** (the hash starting with `Qm...`)

5. **Use this CID when creating a job** in the frontend

### Option 2: Upload via IPFS HTTP API

```bash
# Upload using curl
curl -F "file=@test_cube.blend" http://127.0.0.1:5001/api/v0/add

# Returns JSON with the CID:
# {"Hash":"QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG","Name":"test_cube.blend"}
```

### Option 3: Upload via Python

```python
import ipfshttpclient

# Connect to IPFS
client = ipfshttpclient.connect('/ip4/127.0.0.1/tcp/5001')

# Upload file
result = client.add('test_cube.blend')
print(f"Uploaded to IPFS: {result['Hash']}")

# Example output: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
```

## Verifying the Upload

Test that IPFS can retrieve the file:

```bash
# Download to verify
ipfs get QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG

# Or via gateway
curl http://127.0.0.1:8080/ipfs/QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG -o downloaded.blend
```

## Creating a Job with Real CID

Now when creating a job in the frontend:

1. Go to `http://localhost:3000/dashboard/creators`
2. Click "Create Job"
3. Fill in the details
4. **Instead of uploading**, manually enter the IPFS CID in the form:
   - Asset CID Part 1: `QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG`
   - Asset CID Part 2: (leave empty)

## Expected Worker Behavior

With a valid CID, the worker should:

```
[Worker] Found job 45136f9b-... - Asset CID: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
[Worker] Successfully claimed job 45136f9b-...
[Worker] Downloading asset CID: QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG
[Worker] Connected to IPFS using ipfshttpclient
[Worker] Found blend file: /tmp/tmpxyz/test_cube.blend
[Worker] Validating blend file...
[Worker] Blend file validation successful
[Worker] Rendering blend file to: /tmp/tmpxyz/render.png
[Worker] Render successful: /tmp/tmpxyz/render0001.png
[Worker] Uploading render result to IPFS...
[Worker] Upload successful. CID: QmAbc123...
[Worker] Successfully submitted result for job 45136f9b-...
[Worker] ✓ Successfully completed job 45136f9b-...
```

## Sample .blend Files

You can use these free sample Blender files for testing:

1. **Simple Cube** (create with script above)
2. **Download demo files**:
   ```bash
   # From Blender's demo files
   wget https://download.blender.org/demo/test/cube.blend
   ```

## Troubleshooting

### "IPFS daemon not running"
```bash
# Start it
ipfs daemon

# Or run in background
ipfs daemon &
```

### "CID not found"
- Make sure you uploaded the file to the same IPFS node
- Check IPFS is running: `ipfs id`
- Try pinning: `ipfs pin add <CID>`

### "Invalid CID format"
- CIDs should start with `Qm` (v0) or `bafy` (v1)
- Must be 46+ characters long
- Contains only base58 characters: `123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz`

### "Worker can't download CID"
```bash
# Test manually
ipfs get QmYourCID

# Check gateway
curl http://127.0.0.1:8080/ipfs/QmYourCID
```

## Frontend Integration (Future)

To properly integrate IPFS upload in the frontend:

```typescript
// In CreateJobDialog.tsx
const handleFileUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch('http://127.0.0.1:5001/api/v0/add', {
    method: 'POST',
    body: formData
  });
  
  const result = await response.json();
  const cid = result.Hash;
  
  setFormData(prev => ({
    ...prev,
    asset_cid_part1: cid
  }));
};
```

## Quick Test Command

```bash
# One-liner to create test scene, upload to IPFS, and get CID
blender --background --python-expr "import bpy; bpy.ops.mesh.primitive_cube_add(); bpy.ops.wm.save_as_mainfile(filepath='/tmp/test.blend')" && ipfs add /tmp/test.blend | grep added | awk '{print $2}'
```

This will output a valid CID you can use for testing!

---

**Next Steps**: 
1. Upload a .blend file to IPFS
2. Get the real CID
3. Create a job with that CID
4. Watch the worker process it successfully! 🎉
