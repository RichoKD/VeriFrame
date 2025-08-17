#!/bin/bash
set -e

echo "[INIT] Waiting for StarkNet Devnet..."
until curl -s http://starknet-devnet:5050/is_alive > /dev/null; do
    sleep 2
done

echo "[INIT] Compiling Cairo contract..."
cd /contracts/job_registry
scarb build 

# Use starkli for deployment
echo "[INIT] Deploying contract to Devnet..."

# NOTE: Starkli uses starkli.json for account management. 
# We'll need to create a temporary account for deployment.
# Starknet Devnet's seed=0 pre-funds an account you can use for this.
starkli --host http://starknet-devnet:5050 \
  --keystore ~/.starkli-wallets/deployer/keys/default_key \
  --account-path ~/.starkli-wallets/deployer/accounts/default_account.json \
  account create --salt 0x0

# The deploy command has changed. We need to use the contract class hash first.
# This finds the contract class hash from the build output.
CLASS_HASH=$(jq '.contract_class.class_hash' target/dev/job_registry_JobRegistry.sierra.json)

echo "[INIT] Deploying contract with class hash: $CLASS_HASH"
DEPLOY_OUTPUT=$(starkli --host http://starknet-devnet:5050 \
  --keystore ~/.starkli-wallets/deployer/keys/default_key \
  --account-path ~/.starkli-wallets/deployer/accounts/default_account.json \
  deploy $CLASS_HASH \
  --wait)
echo "$DEPLOY_OUTPUT"

# Extract the contract address from the output
ADDR=$(echo "$DEPLOY_OUTPUT" | grep "Contract address" | awk '{print $3}')
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
