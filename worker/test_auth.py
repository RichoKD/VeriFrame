#!/usr/bin/env python3
"""
Quick test script to verify worker authentication
"""

import asyncio
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from src.main_api import WorkerAuthenticator

async def test_auth():
    """Test authentication flow"""
    print("=" * 60)
    print("Worker Authentication Test (using /worker-auth endpoint)")
    print("=" * 60)
    
    auth = WorkerAuthenticator(
        backend_url="http://localhost:8000/api/v1",
        worker_address="0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691",
        private_key=""
    )
    
    print("\n🔐 Attempting authentication...")
    success = await auth.authenticate()
    
    if success:
        print("\n✅ Authentication successful!")
        print(f"   Token: {auth.token[:30]}...")
        print(f"\n📋 Headers:")
        for key, value in auth.get_headers().items():
            if key == "Authorization":
                print(f"   {key}: {value[:50]}...")
            else:
                print(f"   {key}: {value}")
        return True
    else:
        print("\n❌ Authentication failed!")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_auth())
    sys.exit(0 if result else 1)
