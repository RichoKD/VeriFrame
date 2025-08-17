FROM shardlabs/starknet-devnet-rs:latest-seed0

# Install any additional dependencies you need
RUN apt-get update && apt-get install -y curl jq

WORKDIR /infra
COPY infra/devnet-init.sh /infra/devnet-init.sh
RUN chmod +x /infra/devnet-init.sh

# The entrypoint is already set by the base image, but we can override it
# to run our custom initialization script.
ENTRYPOINT ["/infra/devnet-init.sh"]
