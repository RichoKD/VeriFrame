// VeriFrame Job Registry with OpenZeppelin Integration
use starknet::{ContractAddress, get_caller_address, get_contract_address, get_block_timestamp};
use openzeppelin::token::erc20::interface::{IERC20Dispatcher, IERC20DispatcherTrait};
use openzeppelin::access::ownable::OwnableComponent;
use openzeppelin::security::reentrancy_guard::ReentrancyGuardComponent;
use openzeppelin::security::pausable::PausableComponent;

// Interface representing the Job Registry contract.
#[starknet::interface]
pub trait IJobRegistry<TContractState> {
    // Creates a new job and escrows the reward. Returns the new job ID.
    fn create_job(ref self: TContractState, asset_cid_part1: felt252, asset_cid_part2: felt252, reward_amount: u256, deadline_timestamp: u64) -> felt252;
    // Allows a worker to submit a result.
    fn submit_result(ref self: TContractState, job_id: felt252, result_cid_part1: felt252, result_cid_part2: felt252);
    // Finalizes a job and pays the reward to the worker.
    fn finalize_job(ref self: TContractState, job_id: felt252);
    // Emergency pause functionality
    fn pause(ref self: TContractState);
    fn unpause(ref self: TContractState);
    // Getter functions
    fn get_job_counter(self: @TContractState) -> felt252;
    fn get_job_creator(self: @TContractState, job_id: felt252) -> ContractAddress;
    fn get_job_worker(self: @TContractState, job_id: felt252) -> ContractAddress;
    fn get_job_reward(self: @TContractState, job_id: felt252) -> u256;
    fn get_job_asset_cid(self: @TContractState, job_id: felt252) -> (felt252, felt252);
    fn get_job_deadline(self: @TContractState, job_id: felt252) -> u64;
    fn is_job_completed(self: @TContractState, job_id: felt252) -> bool;
}

#[starknet::contract]
mod JobRegistry {
    use super::{IJobRegistry, IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::{get_caller_address, get_contract_address, get_block_timestamp, ContractAddress};
    use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess, StoragePointerWriteAccess, StoragePointerReadAccess};
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::security::reentrancy_guard::ReentrancyGuardComponent;
    use openzeppelin::security::pausable::PausableComponent;
    use core::num::traits::Zero;

    // Components
    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: ReentrancyGuardComponent, storage: reentrancy_guard, event: ReentrancyGuardEvent);
    component!(path: PausableComponent, storage: pausable, event: PausableEvent);

    // Component implementations
    #[abi(embed_v0)]
    impl OwnableImpl = OwnableComponent::OwnableImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    impl ReentrancyGuardInternalImpl = ReentrancyGuardComponent::InternalImpl<ContractState>;

    #[abi(embed_v0)]
    impl PausableImpl = PausableComponent::PausableImpl<ContractState>;
    impl PausableInternalImpl = PausableComponent::InternalImpl<ContractState>;

    #[storage]
    struct Storage {
        // OpenZeppelin components
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        reentrancy_guard: ReentrancyGuardComponent::Storage,
        #[substorage(v0)]
        pausable: PausableComponent::Storage,
        
        // Job registry specific storage
        reward_token_address: ContractAddress,
        job_counter: felt252,
        job_asset_cid_part1: Map<felt252, felt252>,
        job_asset_cid_part2: Map<felt252, felt252>,
        job_reward: Map<felt252, u256>,
        job_creator: Map<felt252, ContractAddress>,
        job_deadline: Map<felt252, u64>,
        job_worker: Map<felt252, ContractAddress>,
        job_result_cid_part1: Map<felt252, felt252>,
        job_result_cid_part2: Map<felt252, felt252>,
        job_completed: Map<felt252, bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        ReentrancyGuardEvent: ReentrancyGuardComponent::Event,
        #[flat]
        PausableEvent: PausableComponent::Event,
        JobCreated: JobCreated,
        ResultSubmitted: ResultSubmitted,
        JobFinalized: JobFinalized,
    }

    #[derive(Drop, starknet::Event)]
    struct JobCreated {
        #[key]
        job_id: felt252,
        #[key]
        creator: ContractAddress,
        reward_amount: u256,
        deadline: u64,
    }

    #[derive(Drop, starknet::Event)]
    struct ResultSubmitted {
        #[key]
        job_id: felt252,
        #[key]
        worker: ContractAddress,
    }

    #[derive(Drop, starknet::Event)]
    struct JobFinalized {
        #[key]
        job_id: felt252,
        #[key]
        worker: ContractAddress,
        reward_amount: u256,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress, reward_token_address: ContractAddress) {
        // Initialize OpenZeppelin components
        self.ownable.initializer(owner);
        self.reentrancy_guard.initializer();
        self.pausable.initializer();
        
        // Initialize contract-specific state
        self.reward_token_address.write(reward_token_address);
    }

    #[abi(embed_v0)]
    impl JobRegistryImpl of IJobRegistry<ContractState> {
        fn create_job(
            ref self: ContractState,
            asset_cid_part1: felt252,
            asset_cid_part2: felt252,
            reward_amount: u256,
            deadline_timestamp: u64
        ) -> felt252 {
            // Security checks
            self.pausable.assert_not_paused();
            self.reentrancy_guard.start();
            
            let caller = get_caller_address();
            assert(!caller.is_zero(), 'Caller cannot be zero');
            assert(reward_amount > 0, 'Reward must be positive');
            assert(deadline_timestamp > get_block_timestamp(), 'Deadline must be in future');
            
            // Get the current job ID and increment it
            let job_id = self.job_counter.read() + 1;
            self.job_counter.write(job_id);

            // Transfer tokens from creator to this contract (escrow)
            let token = IERC20Dispatcher { contract_address: self.reward_token_address.read() };
            token.transfer_from(caller, get_contract_address(), reward_amount);

            // Store job details
            self.job_creator.write(job_id, caller);
            self.job_asset_cid_part1.write(job_id, asset_cid_part1);
            self.job_asset_cid_part2.write(job_id, asset_cid_part2);
            self.job_reward.write(job_id, reward_amount);
            self.job_deadline.write(job_id, deadline_timestamp);

            // Emit event
            self.emit(JobCreated {
                job_id,
                creator: caller,
                reward_amount,
                deadline: deadline_timestamp,
            });

            self.reentrancy_guard.end();
            job_id
        }

        fn submit_result(ref self: ContractState, job_id: felt252, result_cid_part1: felt252, result_cid_part2: felt252) {
            // Security checks
            self.pausable.assert_not_paused();
            
            let caller = get_caller_address();
            let creator = self.job_creator.read(job_id);
            
            assert(!creator.is_zero(), 'Job does not exist');
            assert(caller != creator, 'Creator cannot be worker');
            assert(self.job_worker.read(job_id).is_zero(), 'Job already has worker');
            assert(!self.job_completed.read(job_id), 'Job already completed');
            
            // Assign worker and store result
            self.job_worker.write(job_id, caller);
            self.job_result_cid_part1.write(job_id, result_cid_part1);
            self.job_result_cid_part2.write(job_id, result_cid_part2);

            // Emit event
            self.emit(ResultSubmitted {
                job_id,
                worker: caller,
            });
        }

        fn finalize_job(ref self: ContractState, job_id: felt252) {
            // Security checks
            self.pausable.assert_not_paused();
            self.reentrancy_guard.start();
            
            let current_time = get_block_timestamp();
            let deadline = self.job_deadline.read(job_id);
            let worker = self.job_worker.read(job_id);
            
            assert(current_time >= deadline, 'Deadline not reached');
            assert(!worker.is_zero(), 'No worker assigned');
            assert(!self.job_completed.read(job_id), 'Job already completed');

            let reward = self.job_reward.read(job_id);
            
            // Transfer reward to worker
            let token = IERC20Dispatcher { contract_address: self.reward_token_address.read() };
            token.transfer(worker, reward);

            // Mark job as completed
            self.job_completed.write(job_id, true);

            // Emit event
            self.emit(JobFinalized {
                job_id,
                worker,
                reward_amount: reward,
            });

            self.reentrancy_guard.end();
        }

        fn pause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable._pause();
        }

        fn unpause(ref self: ContractState) {
            self.ownable.assert_only_owner();
            self.pausable._unpause();
        }

        // Getter functions
        fn get_job_counter(self: @ContractState) -> felt252 {
            self.job_counter.read()
        }
        
        fn get_job_creator(self: @ContractState, job_id: felt252) -> ContractAddress {
            self.job_creator.read(job_id)
        }

        fn get_job_worker(self: @ContractState, job_id: felt252) -> ContractAddress {
            self.job_worker.read(job_id)
        }

        fn get_job_reward(self: @ContractState, job_id: felt252) -> u256 {
            self.job_reward.read(job_id)
        }

        fn get_job_asset_cid(self: @ContractState, job_id: felt252) -> (felt252, felt252) {
            (self.job_asset_cid_part1.read(job_id), self.job_asset_cid_part2.read(job_id))
        }

        fn get_job_deadline(self: @ContractState, job_id: felt252) -> u64 {
            self.job_deadline.read(job_id)
        }

        fn is_job_completed(self: @ContractState, job_id: felt252) -> bool {
            self.job_completed.read(job_id)
        }
    }
}
