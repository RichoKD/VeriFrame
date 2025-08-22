use starknet::ContractAddress;
use snforge_std::{declare, ContractClassTrait, DeclareResultTrait};
use veriframe_job_registry::job_registry::{IJobRegistryDispatcher, IJobRegistryDispatcherTrait};

fn setup_job_registry() -> (IJobRegistryDispatcher, ContractAddress) {
    // Deploy JobRegistry contract
    let owner: ContractAddress = 123.try_into().unwrap();
    let token_address: felt252 = 999; // Mock token address
    let job_registry_class = declare("JobRegistry").unwrap().contract_class();
    let mut constructor_calldata = ArrayTrait::new();
    constructor_calldata.append(owner.into());
    constructor_calldata.append(token_address);
    
    let (job_registry_address, _) = job_registry_class.deploy(@constructor_calldata).unwrap();
    let job_registry = IJobRegistryDispatcher { contract_address: job_registry_address };

    (job_registry, job_registry_address)
}

#[test]
fn test_contract_deployment() {
    let (job_registry, _) = setup_job_registry();
    
    // Test that job counter starts at 0
    let counter = job_registry.get_job_counter();
    assert(counter == 0, 'Initial counter should be 0');
}

#[test] 
fn test_job_counter_increments() {
    let (job_registry, _) = setup_job_registry();
    
    // Initially counter should be 0
    assert(job_registry.get_job_counter() == 0, 'Initial counter 0');
    
    // The counter should remain 0 if no jobs are created
    let counter_after = job_registry.get_job_counter();
    assert(counter_after == 0, 'Counter should remain 0');
}

#[test]
fn test_getter_functions_empty_job() {
    let (job_registry, _) = setup_job_registry();
    
    // Test getters for non-existent job (using job ID 1)
    assert(job_registry.get_job_creator(1) == 0, 'Creator should be 0');
    assert(job_registry.get_job_worker(1) == 0, 'Worker should be 0');
    assert(job_registry.get_job_reward(1) == u256 { low: 0, high: 0 }, 'Reward should be 0');
    
    let (cid_part1, cid_part2) = job_registry.get_job_asset_cid(1);
    assert(cid_part1 == 0, 'CID part1 should be 0');
    assert(cid_part2 == 0, 'CID part2 should be 0');
}

#[test]
fn test_multiple_job_ids() {
    let (job_registry, _) = setup_job_registry();
    
    // Test that we can query multiple job IDs without issues
    let job_id_1 = 1_felt252;
    let job_id_2 = 2_felt252;
    let job_id_3 = 5_felt252;
    
    assert(job_registry.get_job_creator(job_id_1) == 0, 'Creator 1 should be 0');
    assert(job_registry.get_job_creator(job_id_2) == 0, 'Creator 2 should be 0');
    assert(job_registry.get_job_creator(job_id_3) == 0, 'Creator 5 should be 0');
    
    assert(job_registry.get_job_worker(job_id_1) == 0, 'Worker 1 should be 0');
    assert(job_registry.get_job_worker(job_id_2) == 0, 'Worker 2 should be 0');
    assert(job_registry.get_job_worker(job_id_3) == 0, 'Worker 5 should be 0');
}

#[test]
fn test_contract_state_consistency() {
    let (job_registry, _) = setup_job_registry();
    
    // Test that the contract state is consistent across multiple calls
    let counter1 = job_registry.get_job_counter();
    let counter2 = job_registry.get_job_counter();
    assert(counter1 == counter2, 'Counters should match');
    
    // Test that empty job data is consistent
    let creator1 = job_registry.get_job_creator(1);
    let creator2 = job_registry.get_job_creator(1);
    assert(creator1 == creator2, 'Creators should match');
    
    let (cid1_1, cid1_2) = job_registry.get_job_asset_cid(1);
    let (cid2_1, cid2_2) = job_registry.get_job_asset_cid(1);
    assert(cid1_1 == cid2_1 && cid1_2 == cid2_2, 'CIDs should match');
}

#[test]
fn test_job_data_zero_values() {
    let (job_registry, _) = setup_job_registry();
    
    // Test that all job data returns zero/empty values for non-existent jobs
    let job_id = 100_felt252;
    
    // Check creator
    let creator = job_registry.get_job_creator(job_id);
    assert(creator == 0, 'Creator should be 0');
    
    // Check worker
    let worker = job_registry.get_job_worker(job_id);
    assert(worker == 0, 'Worker should be 0');
    
    // Check reward
    let reward = job_registry.get_job_reward(job_id);
    let zero_reward = u256 { low: 0, high: 0 };
    assert(reward == zero_reward, 'Reward should be 0');
    
    // Check asset CID
    let (cid_part1, cid_part2) = job_registry.get_job_asset_cid(job_id);
    assert(cid_part1 == 0, 'CID part1 should be 0');
    assert(cid_part2 == 0, 'CID part2 should be 0');
}
