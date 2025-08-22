#!/bin/bash
set -e

echo "[INIT] Waiting for StarkNet Devnet..."
until curl -s http://starknet-devnet:5050/is_alive > /dev/null; do
    sleep 2
done

echo "[INIT] Compiling Cairo contract..."
cd /contracts/job_registry
scarb build 

# Use sncast (from starknet-foundry) for deployment with imported devnet account
echo "[INIT] Deploying contract to Devnet..."

# Set environment variables for account
export STARKNET_RPC_URL="http://starknet-devnet:5050"
export STARKNET_ACCOUNT="0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691"

# Import the pre-funded devnet account (ignore warnings/errors, just create account file)
echo "[INIT] Importing pre-funded devnet account..."
sncast account import \
  --url http://starknet-devnet:5050 \
  --name devnet-deployer \
  --address 0x064b48806902a367c8598f4f95c305e8c1a1acba5f082d294a43793113115691 \
  --private-key 0x0000000000000000000000000000000071d7bb07b9a64f6f78ac4c816aff4da9 \
  --type oz || echo "[INIT] Account import attempted (may have warnings)"

echo "[INIT] Account import completed"

# Declare the contract without profile
echo "[INIT] Declaring contract..."
DECLARE_OUTPUT=$(sncast declare \
  --url http://starknet-devnet:5050 \
  --account devnet-deployer \
  --contract-name JobRegistry)

echo "$DECLARE_OUTPUT"

# Extract class hash from declare output - try different patterns
CLASS_HASH=$(echo "$DECLARE_OUTPUT" | grep -E "(class_hash|Class hash)" | awk '{print $NF}' | tr -d ',' | tr -d '"')
echo "[INIT] Contract declared with class hash: $CLASS_HASH"

# Deploy the contract without profile
echo "[INIT] Deploying contract..."
DEPLOY_OUTPUT=$(sncast deploy \
  --url http://starknet-devnet:5050 \
  --account devnet-deployer \
  --class-hash $CLASS_HASH)

echo "$DEPLOY_OUTPUT"

# Extract the contract address from the output - try different patterns
ADDR=$(echo "$DEPLOY_OUTPUT" | grep -E "(contract_address|Contract address)" | awk '{print $NF}' | tr -d ',' | tr -d '"')
echo "[INIT] Contract deployed at: $ADDR"

echo "JOB_REGISTRY_ADDRESS=$ADDR" > /infra/worker.env
echo "STARKNET_RPC=http://starknet-devnet:5050" >> /infra/worker.env
echo "IPFS_API=http://ipfs-node:5001" >> /infra/worker.env

echo "[INIT] Env file written to /infra/worker.env"






# #!/bin/bash
# set -e

# echo "[INIT] Waiting for StarkNet Devnet..."
# until curl -s http://starknet-devnet:5050/is_alive > /dev/null; do
#     sleep 2
# done

# echo "[INIT] Waiting for IPFS..."
# until curl -s http://ipfs-node:5001/api/v0/id > /dev/null; do
#     sleep 2
# done


# echo "[INIT] Compiling Cairo contract..."
# cd /contracts/job_registry
# scarb build

# echo "[INIT] Deploying contract to Devnet..."
# DEPLOY_OUTPUT=$(starknet deploy \
#     --contract target/dev/job_registry_JobRegistry.contract_class.json \
#     --rpc http://starknet-devnet:5050 \
#     --account devnet_account \
#     --max_fee 0 \
#     --wait-for-accept)
# echo "$DEPLOY_OUTPUT"

# ADDR=$(echo "$DEPLOY_OUTPUT" | grep "Contract address" | awk '{print $3}')
# echo "[INIT] Contract deployed at: $ADDR"

# echo "JOB_REGISTRY_ADDRESS=$ADDR" > /infra/worker.env
# echo "STARKNET_RPC=http://starknet-devnet:5050" >> /infra/worker.env
# echo "IPFS_API=http://ipfs-node:5001" >> /infra/worker.env

# echo "[INIT] Env file written to /infra/worker.env"
