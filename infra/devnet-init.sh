#!/bin/bash
set -e

echo "[INIT] Waiting for StarkNet Devnet..."
until curl -s http://starknet-devnet:5050/is_alive > /dev/null; do
    sleep 2
done

echo "[INIT] Waiting for IPFS..."
until curl -s http://ipfs-node:5001/api/v0/id > /dev/null; do
    sleep 2
done


echo "[INIT] Compiling Cairo contract..."
cd /contracts/job_registry
scarb build

echo "[INIT] Deploying contract to Devnet..."
DEPLOY_OUTPUT=$(starknet deploy \
    --contract target/dev/job_registry_JobRegistry.contract_class.json \
    --rpc http://starknet-devnet:5050 \
    --account devnet_account \
    --max_fee 0 \
    --wait-for-accept)
echo "$DEPLOY_OUTPUT"

ADDR=$(echo "$DEPLOY_OUTPUT" | grep "Contract address" | awk '{print $3}')
echo "[INIT] Contract deployed at: $ADDR"

echo "JOB_REGISTRY_ADDRESS=$ADDR" > /infra/worker.env
echo "STARKNET_RPC=http://starknet-devnet:5050" >> /infra/worker.env
echo "IPFS_API=http://ipfs-node:5001" >> /infra/worker.env

echo "[INIT] Env file written to /infra/worker.env"
