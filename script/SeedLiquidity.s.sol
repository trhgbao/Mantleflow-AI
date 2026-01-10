// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/LendingPool.sol";
import "../src/MFLToken.sol";

contract SeedLiquidity is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        address lendingPoolAddress = 0x1710eF07b4BaE140257634e4452760c06fED93fB;
        address mflTokenAddress = 0x717a00a8BFc2cabEC617119c8f85e40cBe6c1Bba;

        vm.startBroadcast(deployerPrivateKey);

        MFLToken mfl = MFLToken(mflTokenAddress);
        LendingPool pool = LendingPool(lendingPoolAddress);

        // 1. Add Currency if not supported (For Demo)
        // Note: In prod, admin should do this separately.
        try pool.addCurrency(address(mfl)) {
            console.log("Added MFL as supported currency");
        } catch {
            console.log("Currency likely already supported");
        }

        // 2. Approve LendingPool to spend MFL
        uint256 amountToDeposit = 1_000_000 * 10**18; // 1 Million tokens
        mfl.approve(address(pool), amountToDeposit);
        console.log("Approved LendingPool to spend MFL");

        // 3. Deposit execution
        pool.deposit(address(mfl), amountToDeposit);
        console.log("Deposited", amountToDeposit, "MFL into LendingPool");

        vm.stopBroadcast();
    }
}
