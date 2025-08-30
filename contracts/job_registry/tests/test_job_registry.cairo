
// use starknet::ContractAddress;
// use snforge_std::{declare, ContractClassTrait, DeclareResultTrait, start_cheat_caller_address, stop_cheat_caller_address};
// use veriframe_job_registry::job_registry::{IJobRegistryDispatcher, IJobRegistryDispatcherTrait};

// // Mock ERC20 contract for testing
// #[starknet::contract]
// mod MockERC20 {
//     use starknet::storage::{Map, StorageMapReadAccess, StorageMapWriteAccess};
    
//     #[storage]
//     struct Storage {
//         balances: Map<felt252, u256>,
//         allowances: Map<(felt252, felt252), u256>,
//         total_supply: u256,
//     }
    
//     #[abi(embed_v0)]
//     impl MockERC20Impl of veriframe_job_registry::job_registry::IERC20<ContractState> {
//         fn transfer(ref self: ContractState, recipient: felt252, amount: u256) {
//             // Simple transfer implementation for testing
//         }
        
//         fn transfer_from(ref self: ContractState, sender: felt252, recipient: felt252, amount: u256) {
//             // Always return success for testing
//         }
//     }
    
//     #[starknet::interface]
//     trait MockERC20ExternalTrait<TContractState> {
//         fn transferFrom(ref self: TContractState, sender: felt252, recipient: felt252, amount: u256) -> felt252;
//     }

//     #[abi(embed_v0)]
//     impl MockERC20External of MockERC20ExternalTrait<ContractState> {
//         fn transferFrom(ref self: ContractState, sender: felt252, recipient: felt252, amount: u256) -> felt252 {
//             // Always return 1 (success) for testing
//             1
//         }
//     }
    
//     #[generate_trait]
//     impl MockERC20HelperImpl of MockERC20HelperTrait {
//         fn mint(ref self: ContractState, to: felt252, amount: u256) {
//             let current_balance = self.balances.read(to);
//             self.balances.write(to, current_balance + amount);
//         }
        
//         fn set_allowance(ref self: ContractState, owner: felt252, spender: felt252, amount: u256) {
//             self.allowances.write((owner, spender), amount);
//         }
//     }
// }

// fn deploy_mock_erc20() -> ContractAddress {
//     let contract = declare("MockERC20").unwrap().contract_class();
//     let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
//     contract_address
// }

// fn deploy_job_registry() -> ContractAddress {
//     let contract = declare("JobRegistry").unwrap().contract_class();
//     let (contract_address, _) = contract.deploy(@ArrayTrait::new()).unwrap();
//     contract_address
// }

// #[cfg(test)]
// mod tests {
//     use super::*;
//     use veriframe_job_registry::job_registry::{IJobRegistryDispatcher, IJobRegistryDispatcherTrait};
    
//     #[test]
//     fn test_create_job_success() {
//         // Deploy contracts
//         let token_address = deploy_mock_erc20();
//         let job_registry_address = deploy_job_registry();
        
//         let job_registry = IJobRegistryDispatcher { contract_address: job_registry_address };
        
//         // Initialize token address
//         let token_address_felt: felt252 = token_address.into();
//         job_registry.initialize_token_address(token_address_felt);
        
//         // Set up test parameters
//         let creator_address: felt252 = 0x123;
//         let asset_cid_part1: felt252 = 0x456;
//         let asset_cid_part2: felt252 = 0x789;
//         let reward_amount: u256 = u256 { low: 1000, high: 0 };
//         let deadline_timestamp: u64 = 1000;
        
//         // Mock the caller as the job creator
//         start_cheat_caller_address(job_registry_address, creator_address.try_into().unwrap());
        
//         // Create the job
//         let job_id = job_registry.create_job(asset_cid_part1, asset_cid_part2, reward_amount, deadline_timestamp);
        
//         // Stop cheating caller address
//         stop_cheat_caller_address(job_registry_address);
        
//         // Verify job was created successfully
//         assert(job_id == 1, 'First job should have ID 1');
//         assert(job_registry.get_job_counter() == 1, 'Job counter should be 1');
//         assert(job_registry.get_job_creator(job_id) == creator_address, 'Creator should match');
//         assert(job_registry.get_job_reward(job_id) == reward_amount, 'Reward should match');
        
//         let (cid_part1, cid_part2) = job_registry.get_job_asset_cid(job_id);
//         assert(cid_part1 == asset_cid_part1, 'Asset CID part1 should match');
//         assert(cid_part2 == asset_cid_part2, 'Asset CID part2 should match');
//     }

//     #[test]
//     fn test_create_job_increments_counter() {
//         // Deploy contracts
//         let token_address = deploy_mock_erc20();
//         let job_registry_address = deploy_job_registry();
        
//         let job_registry = IJobRegistryDispatcher { contract_address: job_registry_address };
        
//         // Initialize token address
//         job_registry.initialize_token_address(token_address.into());
        
//         // Initial counter should be 0
//         assert(job_registry.get_job_counter() == 0, 'Initial counter should be 0');
        
//         // Set up test parameters
//         let creator_address: felt252 = 0x123;
//         let asset_cid_part1: felt252 = 0x456;
//         let asset_cid_part2: felt252 = 0x789;
//         let reward_amount: u256 = u256 { low: 1000, high: 0 };
//         let deadline_timestamp: u64 = 1000;
        
//         // Mock the caller as the job creator
//         start_cheat_caller_address(job_registry_address, creator_address.try_into().unwrap());
        
//         // Create first job
//         let job_id1 = job_registry.create_job(asset_cid_part1, asset_cid_part2, reward_amount, deadline_timestamp);
//         assert(job_id1 == 1, 'First job ID should be 1');
//         assert(job_registry.get_job_counter() == 1, 'Counter should be 1');
        
//         // Create second job
//         let job_id2 = job_registry.create_job(asset_cid_part1, asset_cid_part2, reward_amount, deadline_timestamp);
//         assert(job_id2 == 2, 'Second job ID should be 2');
//         assert(job_registry.get_job_counter() == 2, 'Counter should be 2');
        
//         // Stop cheating caller address
//         stop_cheat_caller_address(job_registry_address);
//     }
// }
// // #[test]
// // #[should_panic(expected: ('Token address not set',))]
// // fn test_create_job_fails_without_token_address() {
// //     // Deploy job registry without initializing token address
// //     let job_registry_address = deploy_job_registry();
// //     let job_registry = IJobRegistryDispatcher { contract_address: job_registry_address };
    
// //     // Set up test parameters
// //     let creator_address: felt252 = 0x123;
// //     let asset_cid_part1: felt252 = 0x456;
// //     let asset_cid_part2: felt252 = 0x789;
// //     let reward_amount: u256 = u256 { low: 1000, high: 0 };
// //     let deadline_timestamp: u64 = 1000;
    
// //     // Mock the caller as the job creator
// //     start_cheat_caller_address(job_registry_address, creator_address.try_into().unwrap());
    
// //     // This should panic because token address is not set
// //     job_registry.create_job(asset_cid_part1, asset_cid_part2, reward_amount, deadline_timestamp);
// // }

// // #[test]
// // fn test_create_job_with_different_parameters() {
// //     // Deploy contracts
// //     let token_address = deploy_mock_erc20();
// //     let job_registry_address = deploy_job_registry();
    
// //     let job_registry = IJobRegistryDispatcher { contract_address: job_registry_address };
    
// //     // Initialize token address
// //     job_registry.initialize_token_address(token_address.into());
    
// //     // Test with different parameter values
// //     let creator_address: felt252 = 0x999;
// //     let asset_cid_part1: felt252 = 0xabc;
// //     let asset_cid_part2: felt252 = 0xdef;
// //     let reward_amount: u256 = u256 { low: 5000, high: 1 }; // Large reward
// //     let deadline_timestamp: u64 = 9999;
    
// //     // Mock the caller as the job creator
// //     start_cheat_caller_address(job_registry_address, creator_address.try_into().unwrap());
    
// //     // Create the job
// //     let job_id = job_registry.create_job(asset_cid_part1, asset_cid_part2, reward_amount, deadline_timestamp);
    
// //     // Stop cheating caller address
// //     stop_cheat_caller_address(job_registry_address);
    
// //     // Verify all parameters are stored correctly
// //     assert(job_registry.get_job_creator(job_id) == creator_address, 'Creator should match');
// //     assert(job_registry.get_job_reward(job_id) == reward_amount, 'Large reward should match');
    
// //     let (cid_part1, cid_part2) = job_registry.get_job_asset_cid(job_id);
// //     assert(cid_part1 == asset_cid_part1, 'Asset CID part1 should match');
// //     assert(cid_part2 == asset_cid_part2, 'Asset CID part2 should match');
// // }
