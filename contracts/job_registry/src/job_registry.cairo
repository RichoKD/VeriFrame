
// Only keep imports that are actually used at the module level

// Interface for the ERC20 token, needed for reward transfers.
#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer(ref self: TContractState, recipient: felt252, amount: u256);
    fn transfer_from(ref self: TContractState, sender: felt252, recipient: felt252, amount: u256);
}

// Interface representing the Job Registry contract.
/// This interface allows for the creation, management, and finalization of jobs.
#[starknet::interface]
pub trait IJobRegistry<TContractState> {
    // Initializes the contract by setting the ERC20 token address.
    fn initialize_token_address(ref self: TContractState, token_address: felt252);
    // Creates a new job and escrows the reward. Returns the new job ID.
    fn create_job(ref self: TContractState, asset_cid: felt252, reward_amount: u256, deadline_timestamp: u64) -> felt252;
    // Allows a worker to submit a result.
    fn submit_result(ref self: TContractState, job_id: felt252, result_cid: felt252);
    // Finalizes a job and pays the reward to the worker.
    fn finalize_job(ref self: TContractState, job_id: felt252);
    // Getter functions to read job details.
    fn get_job_creator(self: @TContractState, job_id: felt252) -> felt252;
    fn get_job_worker(self: @TContractState, job_id: felt252) -> felt252;
    fn get_job_reward(self: @TContractState, job_id: felt252) -> u256;
    fn get_job_asset_cid(self: @TContractState, job_id: felt252) -> felt252;
}

// The main contract module.
#[starknet::contract]
mod JobRegistry {
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp, ContractAddress};
    use starknet::syscalls::call_contract_syscall;
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerWriteAccess, StoragePointerReadAccess};
    use super::{IJobRegistry};
    // use core::integer::u256_safe_add;

    // Storage struct containing all the contract's state variables.
    #[storage]
    struct Storage {
        job_asset_cid: Map<felt252, felt252>,
        job_reward: Map<felt252, u256>,
        job_creator: Map<felt252, felt252>,
        job_deadline: Map<felt252, u64>,
        job_worker: Map<felt252, felt252>,
        job_result_cid: Map<felt252, felt252>,
        job_counter: felt252,
        reward_token_address: felt252,
    }

    // Implementation of the IJobRegistry interface.
    #[abi(embed_v0)]
    impl JobRegistryImpl of IJobRegistry<ContractState> {
        // Initializes the contract with the ERC20 token address.
        fn initialize_token_address(ref self: ContractState, token_address: felt252) {
            assert(self.reward_token_address.read() == 0, 'Token address already set');
            self.reward_token_address.write(token_address);
        }

        // Creates a new job, taking in the job details and transferring the reward.
        fn create_job(
            ref self: ContractState,
            asset_cid: felt252,
            reward_amount: u256,
            deadline_timestamp: u64
        ) -> felt252 {
            let caller: felt252 = get_caller_address().into();
            
            // Get the current job ID and increment it for the new job.
            let job_id = self.job_counter.read() + 1;
            self.job_counter.write(job_id);

            // Escrow the reward from the creator. Assumes creator has approved this contract.
            let token_address = self.reward_token_address.read();
            assert(token_address != 0, 'Token address not set');
            let contract_address: ContractAddress = token_address.try_into().unwrap();
            let mut calldata: Array<felt252> = ArrayTrait::new();
            calldata.append(caller);
            calldata.append(get_contract_address().into());
            calldata.append(reward_amount.low.into());
            calldata.append(reward_amount.high.into());
            let call_result = call_contract_syscall(contract_address, selector!("transferFrom"), calldata.span());
            let result = call_result.expect('TransferFrom call failed');
            assert(result.len() == 1, 'TransferFrom failed');
            assert(*result.at(0) == 1, 'TransferFrom failed');

            // Store the job details.
            self.job_creator.write(job_id, caller);
            self.job_asset_cid.write(job_id, asset_cid);
            self.job_reward.write(job_id, reward_amount);
            self.job_deadline.write(job_id, deadline_timestamp);

            job_id
        }

        // Allows a worker to submit their result.
        fn submit_result(ref self: ContractState, job_id: felt252, result_cid: felt252) {
            let caller: felt252 = get_caller_address().into();
            let creator = self.job_creator.read(job_id);
            assert(creator != 0, 'Job does not exist');
            assert(caller != creator, 'Creator cannot be the worker');
            assert(self.job_worker.read(job_id) == 0, 'Job already has a worker');
            
            // Assign the worker and store the result.
            self.job_worker.write(job_id, caller);
            self.job_result_cid.write(job_id, result_cid);
        }

        // Finalizes a job and pays the reward.
        fn finalize_job(ref self: ContractState, job_id: felt252) {
            let block_timestamp = get_block_timestamp();
            let deadline = self.job_deadline.read(job_id);
            assert(block_timestamp >= deadline, 'Deadline has not passed');
            
            let worker = self.job_worker.read(job_id);
            assert(worker != 0, 'No worker submitted a result');

            let reward = self.job_reward.read(job_id);
            let token_address = self.reward_token_address.read();

            // Transfer the reward from the contract to the worker.
            let contract_address: ContractAddress = token_address.try_into().unwrap();
            let mut calldata: Array<felt252> = ArrayTrait::new();
            calldata.append(worker);
            calldata.append(reward.low.into());
            calldata.append(reward.high.into());
            let result = call_contract_syscall(contract_address, selector!("transfer"), calldata.span()).expect('Transfer call failed');
            assert(result.len() == 1, 'Transfer failed');
            assert(*result.at(0) == 1, 'Transfer failed');

            // Clear storage variables to mark the job as complete.
            self.job_creator.write(job_id, 0);
            self.job_worker.write(job_id, 0);
            self.job_asset_cid.write(job_id, 0);
            self.job_result_cid.write(job_id, 0);
            self.job_deadline.write(job_id, 0);
            self.job_reward.write(job_id, u256 { low: 0, high: 0 });
        }
        
        // --- Getter Functions ---
        
        fn get_job_creator(self: @ContractState, job_id: felt252) -> felt252 {
            self.job_creator.read(job_id)
        }

        fn get_job_worker(self: @ContractState, job_id: felt252) -> felt252 {
            self.job_worker.read(job_id)
        }

        fn get_job_reward(self: @ContractState, job_id: felt252) -> u256 {
            self.job_reward.read(job_id)
        }

        fn get_job_asset_cid(self: @ContractState, job_id: felt252) -> felt252 {
            self.job_asset_cid.read(job_id)
        }
    }
}
