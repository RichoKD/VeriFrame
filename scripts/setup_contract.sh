#!/bin/bash

# Post-deployment setup script for VeriFrame Job Registry
# Usage: ./setup_contract.sh [network] [contract_address] [token_address]

set -e

# Default values
NETWORK=${1:-"sepolia"}
CONTRACT_ADDRESS=${2:-""}
TOKEN_ADDRESS=${3:-"0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d"}  # Sepolia STRK
ACCOUNT=${4:-"stark1"}

if [ -z "$CONTRACT_ADDRESS" ]; then
    # Try to read from deployment file
    DEPLOYMENT_FILE="../contracts/job_registry/deployments/job_registry_${NETWORK}.json"
    if [ -f "$DEPLOYMENT_FILE" ]; then
        CONTRACT_ADDRESS=$(grep -o '"contract_address": "[^"]*"' "$DEPLOYMENT_FILE" | cut -d'"' -f4)
        echo "📖 Read contract address from deployment file: $CONTRACT_ADDRESS"
    else
        echo "❌ No contract address provided and no deployment file found"
        echo "Usage: ./setup_contract.sh [network] [contract_address] [token_address]"
        exit 1
    fi
fi

echo "🔧 Setting up Job Registry Contract..."
echo "Network: $NETWORK"
echo "Contract: $CONTRACT_ADDRESS"
echo "Token: $TOKEN_ADDRESS"
echo ""

cd "$(dirname "$0")/../contracts/job_registry"

# Step 1: Initialize the contract with token address
echo "1️⃣ Initializing contract with token address..."
INIT_OUTPUT=$(sncast --profile $ACCOUNT invoke --contract-address $CONTRACT_ADDRESS --function initialize_token_address --calldata $TOKEN_ADDRESS 2>&1)

if echo "$INIT_OUTPUT" | grep -q "error"; then
    echo "❌ Contract initialization failed:"
    echo "$INIT_OUTPUT"
    
    # Check if it's already initialized
    if echo "$INIT_OUTPUT" | grep -q "already initialized\|Token address already set"; then
        echo "ℹ️  Contract is already initialized"
    else
        exit 1
    fi
else
    echo "✅ Contract initialized successfully"
    echo "Transaction: $INIT_OUTPUT"
fi

echo ""

# Step 2: Approve the contract to spend tokens
echo "2️⃣ Setting up token approval..."
echo "Approving 1000 STRK tokens for the contract to spend..."

APPROVE_OUTPUT=$(sncast --profile $ACCOUNT invoke --contract-address $TOKEN_ADDRESS --function approve --calldata $CONTRACT_ADDRESS 1000000000000000000000 0 2>&1)

if echo "$APPROVE_OUTPUT" | grep -q "error"; then
    echo "❌ Token approval failed:"
    echo "$APPROVE_OUTPUT"
    
    # Check if it's already approved or other recoverable error
    if echo "$APPROVE_OUTPUT" | grep -q "already approved\|insufficient allowance"; then
        echo "ℹ️  Token approval might already be set"
    else
        echo "❌ Continuing without approval - you may need to approve manually"
    fi
else
    echo "✅ Token approval successful"
    echo "Transaction: $APPROVE_OUTPUT"
fi

echo ""

# Step 3: Test contract functions
echo "3️⃣ Testing contract functions..."
echo "Checking job counter..."
JOB_COUNTER=$(sncast --profile $ACCOUNT call --contract-address $CONTRACT_ADDRESS --function get_job_counter 2>&1)

if echo "$JOB_COUNTER" | grep -q "error"; then
    echo "❌ Failed to read job counter:"
    echo "$JOB_COUNTER"
else
    echo "✅ Current job counter: $JOB_COUNTER"
fi

echo ""
echo "🎉 Contract setup completed!"
echo ""
echo "📋 Summary:"
echo "=========="
echo "Contract Address: $CONTRACT_ADDRESS"
echo "Token Address: $TOKEN_ADDRESS"
echo "Network: $NETWORK"
echo ""
echo "🔗 Next steps:"
echo "1. Create a job: sncast --account $ACCOUNT invoke --contract-address $CONTRACT_ADDRESS --function create_job --calldata <asset_cid_part1> <asset_cid_part2> <reward_amount_low> <reward_amount_high> <deadline>"
