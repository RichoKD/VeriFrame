#!/bin/bash

# Debug script for transferFrom issues
# Usage: ./debug_transferfrom.sh <user_address>

STRK_TOKEN="0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
JOB_REGISTRY="0x0000f133b188900619b3df297bb72e46cc82b246a030acd14c132c12a32beafa"
USER_ADDRESS="$1"

if [ -z "$USER_ADDRESS" ]; then
    echo "❌ Usage: $0 <user_address>"
    echo "Example: $0 0x1234..."
    exit 1
fi

echo "🔍 Debugging transferFrom for JobRegistry"
echo "STRK Token: $STRK_TOKEN"
echo "JobRegistry: $JOB_REGISTRY" 
echo "User: $USER_ADDRESS"
echo "="=================================================

echo "1️⃣ Checking STRK balance..."
starkli call $STRK_TOKEN balanceOf $USER_ADDRESS --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7

echo ""
echo "2️⃣ Checking allowance..."
starkli call $STRK_TOKEN allowance $USER_ADDRESS $JOB_REGISTRY --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7

echo ""
echo "3️⃣ Checking JobRegistry token address..."
starkli call $JOB_REGISTRY get_token_address --rpc https://starknet-sepolia.public.blastapi.io/rpc/v0_7 2>/dev/null || echo "⚠️  Function not available or contract ABI issue"

echo ""
echo "🔧 COMMON SOLUTIONS:"
echo "• If balance is 0: User needs STRK tokens"
echo "• If allowance is 0: User needs to approve JobRegistry:"
echo "  starkli invoke $STRK_TOKEN approve $JOB_REGISTRY <amount> --account <account>"
echo "• If token address is wrong: Call initialize_token_address with STRK address"
