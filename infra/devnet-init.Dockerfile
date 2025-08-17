FROM rust:slim

# Install system dependencies needed for asdf and the plugins
RUN apt-get update && apt-get install -y --no-install-recommends git curl build-essential libssl-dev pkg-config jq

# Install asdf
ENV ASDF_DATA_DIR /root/.asdf
RUN git clone https://github.com/asdf-vm/asdf.git ${ASDF_DATA_DIR} --branch v0.14.0

# Add asdf to the PATH
ENV PATH=${ASDF_DATA_DIR}/bin:${ASDF_DATA_DIR}/shims:${PATH}

# Add the asdf plugins for Scarb and Starknet Foundry
RUN asdf plugin add scarb https://github.com/software-mansion/asdf-scarb.git
RUN asdf plugin add starknet-foundry https://github.com/foundry-rs/asdf-starknet-foundry.git

# Create a .tool-versions file to manage tool versions
# We use a specific, pinned version for reproducibility
# You can update these versions as needed
RUN echo "scarb 2.12.0" > /root/.tool-versions
RUN echo "starknet-foundry 0.48.0" >> /root/.tool-versions

# Install the tools defined in .tool-versions
RUN asdf install

WORKDIR /infra
COPY infra/devnet-init.sh /infra/devnet-init.sh
RUN chmod +x /infra/devnet-init.sh

# Copy Cairo contracts into the image
# This is required because the compiler needs access to the source code
# COPY contracts /contracts

ENTRYPOINT ["/infra/devnet-init.sh"]



# FROM rust:slim
# # FROM rust:1.80-slim

# # Install dependencies

# RUN apt-get update && apt-get install -y curl libssl-dev pkg-config jq

# # Install Scarb

# RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | bash

# ENV PATH="/root/.local/share/scarb/bin:${PATH}"

# # Install Starknet foundry
# RUN curl -L https://foundry.paradigm.xyz | bash

# RUN cargo install starknet-devnet --locked

# WORKDIR /infra

# COPY infra/devnet-init.sh /infra/devnet-init.sh

# RUN chmod +x /infra/devnet-init.sh

# ENTRYPOINT ["/infra/devnet-init.sh"]



# FROM rust:1.80-slim

# # Install dependencies
# RUN apt-get update && apt-get install -y curl pkg-config jq

# # Install Scarb
# RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | bash
# ENV PATH="/root/.local/share/scarb/bin:${PATH}"

# # Install Starknet CLI (if needed for the devnet-init.sh script)
# # RUN cargo install starkli --locked

# WORKDIR /infra
# COPY infra/devnet-init.sh /infra/devnet-init.sh
# RUN chmod +x /infra/devnet-init.sh

# # Copy your Cairo contract files into the image
# COPY contracts /contracts

# ENTRYPOINT ["/infra/devnet-init.sh"]




# FROM shardlabs/starknet-devnet-rs:latest-seed0

# # Install any additional dependencies you need
# RUN apt-get update && apt-get install -y curl jq

# # # Install scarb for building Cairo contracts
# # RUN curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# WORKDIR /infra
# COPY infra/devnet-init.sh /infra/devnet-init.sh
# RUN chmod +x /infra/devnet-init.sh

# # The entrypoint is already set by the base image, but we can override it
# # to run our custom initialization script.
# ENTRYPOINT ["/infra/devnet-init.sh"]
