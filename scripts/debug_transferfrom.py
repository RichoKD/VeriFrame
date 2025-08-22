#!/usr/bin/env python3
"""
Debug script to check transferFrom issues for the JobRegistry contract
"""

import asyncio
import sys
from starknet_py.net.full_node_client import FullNodeClient
from starknet_py.net.models import StarknetChainId
from starknet_py.contract import Contract
from starknet_py.net.account.account import Account
from starknet_py.net.signer.stark_curve_signer import KeyPair

# Configuration - you'll need to update these values
STARKNET_RPC_URL = "https://starknet-sepolia.public.blastapi.io/rpc/v0_7"  # or your RPC URL
STRK_TOKEN_ADDRESS = "0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
JOB_REGISTRY_ADDRESS = "0x0000f133b188900619b3df297bb72e46cc82b246a030acd14c132c12a32beafa"  # Updated address
USER_ADDRESS = ""  # Add the user's address who's trying to create the job
USER_PRIVATE_KEY = ""  # Add the private key (be careful with this!)

# ERC20 ABI for the functions we need
ERC20_ABI = [
    {
        "name": "balanceOf",
        "type": "function",
        "inputs": [{"name": "account", "type": "felt"}],
        "outputs": [{"name": "balance", "type": "Uint256"}],
        "stateMutability": "view"
    },
    {
        "name": "allowance",
        "type": "function", 
        "inputs": [
            {"name": "owner", "type": "felt"},
            {"name": "spender", "type": "felt"}
        ],
        "outputs": [{"name": "remaining", "type": "Uint256"}],
        "stateMutability": "view"
    },
    {
        "name": "approve",
        "type": "function",
        "inputs": [
            {"name": "spender", "type": "felt"},
            {"name": "amount", "type": "Uint256"}
        ],
        "outputs": [{"name": "success", "type": "felt"}],
        "stateMutability": "external"
    }
]

async def check_transferfrom_issues():
    """Check common issues that cause transferFrom to fail"""
    
    if not USER_ADDRESS:
        print("❌ Please set USER_ADDRESS in the script")
        return
        
    print("🔍 Debugging transferFrom issues...")
    print(f"STRK Token: {STRK_TOKEN_ADDRESS}")
    print(f"JobRegistry: {JOB_REGISTRY_ADDRESS}")
    print(f"User: {USER_ADDRESS}")
    print("-" * 50)
    
    # Initialize client
    client = FullNodeClient(node_url=STARKNET_RPC_URL)
    
    try:
        # Create contract instance for STRK token
        strk_contract = await Contract.from_address(
            address=STRK_TOKEN_ADDRESS,
            provider=client,
            proxy_config=False
        )
        
        # 1. Check user's STRK balance
        print("1️⃣ Checking user's STRK balance...")
        try:
            balance_result = await strk_contract.functions["balanceOf"].call(int(USER_ADDRESS, 16))
            balance = balance_result.balance
            balance_human = (balance.low + (balance.high << 128)) / 10**18
            print(f"   Balance: {balance_human:.6f} STRK")
            
            if balance_human == 0:
                print("   ❌ User has no STRK tokens!")
                return
            else:
                print("   ✅ User has STRK tokens")
        except Exception as e:
            print(f"   ❌ Error checking balance: {e}")
            return
            
        # 2. Check allowance
        print("\n2️⃣ Checking allowance for JobRegistry...")
        try:
            allowance_result = await strk_contract.functions["allowance"].call(
                int(USER_ADDRESS, 16), 
                int(JOB_REGISTRY_ADDRESS, 16)
            )
            allowance = allowance_result.remaining
            allowance_human = (allowance.low + (allowance.high << 128)) / 10**18
            print(f"   Allowance: {allowance_human:.6f} STRK")
            
            if allowance_human == 0:
                print("   ❌ No allowance set! User needs to approve the JobRegistry contract")
                print(f"   💡 User should call: approve({JOB_REGISTRY_ADDRESS}, amount)")
                return
            else:
                print("   ✅ Allowance is set")
        except Exception as e:
            print(f"   ❌ Error checking allowance: {e}")
            return
            
        # 3. Check if JobRegistry token address is set
        print("\n3️⃣ Checking JobRegistry configuration...")
        try:
            job_registry_contract = await Contract.from_address(
                address=JOB_REGISTRY_ADDRESS,
                provider=client,
                proxy_config=False
            )
            
            # This would require the JobRegistry ABI, which we don't have
            print("   ⚠️  Cannot check JobRegistry token address without ABI")
            print("   💡 Make sure initialize_token_address() was called with STRK address")
            
        except Exception as e:
            print(f"   ❌ Error accessing JobRegistry: {e}")
            
        print("\n" + "="*50)
        print("🔧 TROUBLESHOOTING STEPS:")
        print("1. Ensure user has sufficient STRK balance")
        print("2. User must approve JobRegistry contract:")
        print(f"   strk.approve('{JOB_REGISTRY_ADDRESS}', reward_amount)")
        print("3. Ensure JobRegistry was initialized with STRK token address")
        print("4. Check that reward_amount matches approved amount")
        
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print("💡 Make sure STARKNET_RPC_URL is correct and accessible")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        USER_ADDRESS = sys.argv[1]
    
    asyncio.run(check_transferfrom_issues())
