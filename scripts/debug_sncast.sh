#!/bin/bash

# Debug script using sncast for transferFrom issues
# Usage: ./debug_sncast.sh <user_address>

STRK_TOKEN="0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"
JOB_REGISTRY="0x0000f133b188900619b3df297bb72e46cc82b246a030acd14c132c12a32beafa"
USER_ADDRESS="$1"

if [ -z "$USER_ADDRESS" ]; then
    echo "❌ Usage: $0 <user_address>"
    echo "Example: $0 0x06b94abf5540e1e0602150a650749ddad92bb784a517b28f7aa836ad7fd3c4bc"
    exit 1
fi

echo "🔍 Debugging transferFrom for JobRegistry using sncast"
echo "STRK Token: $STRK_TOKEN"
echo "JobRegistry: $JOB_REGISTRY" 
echo "User: $USER_ADDRESS"
echo "=================================================="

echo ""
echo "1️⃣ Checking STRK balance..."
sncast call --contract-address $STRK_TOKEN --function "balanceOf" --calldata $USER_ADDRESS --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

echo ""
echo "2️⃣ Checking allowance for JobRegistry..."
sncast call --contract-address $STRK_TOKEN --function "allowance" --calldata $USER_ADDRESS $JOB_REGISTRY --url https://starknet-sepolia.public.blastapi.io/rpc/v0_7

echo ""
echo "🔧 COMMON SOLUTIONS:"
echo "• If balance is 0: User needs STRK tokens"
echo "• If allowance is 0: User needs to approve JobRegistry:"
echo "  sncast invoke --contract-address $STRK_TOKEN --function approve --calldata $JOB_REGISTRY <amount_low> <amount_high> --account <account_name>"
echo "• Make sure the amount being transferred doesn't exceed the allowance"
