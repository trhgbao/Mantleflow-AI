// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/InvoiceNFT.sol";
import "../src/Escrow.sol";
import "../src/LendingPool.sol";
import "../src/PaymentOracle.sol";
import "../src/Liquidator.sol";
import "../src/MFLToken.sol";
import "../src/Staking.sol";

/**
 * @title Deploy
 * @notice Deploy all MantleFlow contracts to Mantle Sepolia
 */
contract Deploy is Script {
    // Deployed contract addresses
    InvoiceNFT public invoiceNFT;
    Escrow public escrow;
    LendingPool public lendingPool;
    PaymentOracle public paymentOracle;
    Liquidator public liquidator;
    MFLToken public mflToken;
    Staking public staking;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy InvoiceNFT
        invoiceNFT = new InvoiceNFT();
        console.log("InvoiceNFT deployed at:", address(invoiceNFT));

        // 2. Deploy Escrow
        escrow = new Escrow(address(invoiceNFT));
        console.log("Escrow deployed at:", address(escrow));

        // 3. Deploy LendingPool
        lendingPool = new LendingPool(address(invoiceNFT), address(escrow));
        console.log("LendingPool deployed at:", address(lendingPool));

        // 4. Deploy PaymentOracle
        paymentOracle = new PaymentOracle(address(lendingPool));
        console.log("PaymentOracle deployed at:", address(paymentOracle));

        // 5. Deploy Liquidator
        liquidator = new Liquidator(address(invoiceNFT));
        console.log("Liquidator deployed at:", address(liquidator));

        // 6. Deploy MFLToken
        mflToken = new MFLToken();
        console.log("MFLToken deployed at:", address(mflToken));

        // 7. Deploy Staking
        staking = new Staking(address(mflToken));
        console.log("Staking deployed at:", address(staking));

        // ========== Setup Roles ==========

        // Grant LENDING_POOL_ROLE to LendingPool on Escrow
        escrow.grantRole(escrow.LENDING_POOL_ROLE(), address(lendingPool));
        console.log("Granted LENDING_POOL_ROLE to LendingPool on Escrow");

        // Set Liquidator on LendingPool
        lendingPool.setLiquidator(address(liquidator));
        console.log("Set Liquidator on LendingPool");

        // Set LendingPool on Liquidator
        liquidator.setLendingPool(address(lendingPool));
        console.log("Set LendingPool on Liquidator");

        // Grant MINTER_ROLE to LendingPool on InvoiceNFT (so backend can mint through pool)
        invoiceNFT.grantRole(invoiceNFT.MINTER_ROLE(), address(lendingPool));
        console.log("Granted MINTER_ROLE to LendingPool on InvoiceNFT");

        // Grant ORACLE_ROLE to PaymentOracle on LendingPool
        lendingPool.grantRole(lendingPool.ORACLE_ROLE(), address(paymentOracle));
        console.log("Granted ORACLE_ROLE to PaymentOracle on LendingPool");

        vm.stopBroadcast();

        // Print summary
        console.log("\n========== DEPLOYMENT SUMMARY ==========");
        console.log("Network: Mantle Sepolia (Chain ID: 5003)");
        console.log("");
        console.log("Core Contracts:");
        console.log("  InvoiceNFT:    ", address(invoiceNFT));
        console.log("  Escrow:        ", address(escrow));
        console.log("  LendingPool:   ", address(lendingPool));
        console.log("  PaymentOracle: ", address(paymentOracle));
        console.log("  Liquidator:    ", address(liquidator));
        console.log("");
        console.log("Token Contracts:");
        console.log("  MFLToken:      ", address(mflToken));
        console.log("  Staking:       ", address(staking));
        console.log("");
        console.log("==========================================");
    }
}

/**
 * @title AddCurrency
 * @notice Add supported currency to LendingPool
 */
contract AddCurrency is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address lendingPoolAddress = vm.envAddress("LENDING_POOL");
        address currencyAddress = vm.envAddress("CURRENCY");

        vm.startBroadcast(deployerPrivateKey);

        LendingPool lendingPool = LendingPool(lendingPoolAddress);
        lendingPool.addCurrency(currencyAddress);

        console.log("Added currency:", currencyAddress);

        vm.stopBroadcast();
    }
}

/**
 * @title AddOracleNode
 * @notice Add oracle node to PaymentOracle
 */
contract AddOracleNode is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address paymentOracleAddress = vm.envAddress("PAYMENT_ORACLE");
        address nodeAddress = vm.envAddress("NODE");

        vm.startBroadcast(deployerPrivateKey);

        PaymentOracle oracle = PaymentOracle(paymentOracleAddress);
        oracle.addOracleNode(nodeAddress);

        console.log("Added oracle node:", nodeAddress);

        vm.stopBroadcast();
    }
}
