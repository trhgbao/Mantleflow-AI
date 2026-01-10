# MantleFlow Smart Contracts

Smart contracts cho MantleFlow - Invoice Factoring Protocol on Mantle Network.

## Contracts

| Contract | Description |
|----------|-------------|
| `InvoiceNFT.sol` | ERC-721 token hoa hoa don, luu metadata (invoice_hash, risk_tier, osint_score...) |
| `Escrow.sol` | Giu NFT lam tai san dam bao khi tao loan |
| `LendingPool.sol` | Core lending, Challenge Period 24h, multi-currency |
| `PaymentOracle.sol` | Bridge off-chain payment, Multi-sig 2/3 |
| `Liquidator.sol` | Dutch Auction + Insurance Fund |
| `MFLToken.sol` | Governance token ERC-20 (max 100M) |
| `Staking.sol` | Stake MFL de boost LTV |

## Features

- **Risk Tiers**: A (80% LTV, 5% APR), B (60% LTV, 8% APR), C (40% LTV, 12% APR)
- **Challenge Period**: 24h cho moi loan moi
- **Multi-sig Oracle**: 2/3 confirmations cho off-chain payments
- **Dutch Auction**: 80% → 20% face value trong 7 ngay
- **Insurance Fund**: 5% fee moi loan

## Setup

```bash
# Install dependencies
forge install

# Build
forge build

# Test
forge test

# Test with verbosity
forge test -vvv
```

## Deploy to Mantle Sepolia

```bash
# Copy env file
cp .env.example .env
# Edit .env with your private key

# Deploy
forge script script/Deploy.s.sol:Deploy --rpc-url https://rpc.sepolia.mantle.xyz --broadcast

# Verify (optional)
forge verify-contract <CONTRACT_ADDRESS> src/InvoiceNFT.sol:InvoiceNFT --chain-id 5003
```

## Network Info

- **Network**: Mantle Sepolia Testnet
- **Chain ID**: 5003
- **RPC**: https://rpc.sepolia.mantle.xyz
- **Explorer**: https://explorer.sepolia.mantle.xyz

## Contract ABIs

After build, ABIs available in `out/` folder:
- `out/InvoiceNFT.sol/InvoiceNFT.json`
- `out/Escrow.sol/Escrow.json`
- `out/LendingPool.sol/LendingPool.json`
- `out/PaymentOracle.sol/PaymentOracle.json`
- `out/Liquidator.sol/Liquidator.json`
- `out/MFLToken.sol/MFLToken.json`
- `out/Staking.sol/Staking.json`

## Events for Backend Integration

### LendingPool Events
- `LoanCreated(loanId, tokenId, borrower, currency, principal, dueDate, tier)`
- `LoanActivated(loanId, timestamp)`
- `LoanRepaid(loanId, amount, totalRepaid, fullyRepaid)`
- `LoanOverdue(loanId, daysOverdue)`
- `LoanDefaulted(loanId, timestamp)`
- `LoanChallenged(loanId, challenger, reason)`

### PaymentOracle Events
- `PaymentSubmitted(paymentId, loanId, amount, proofHash, submitter)`
- `PaymentConfirmed(paymentId, oracle, confirmationCount)`
- `PaymentExecuted(paymentId, loanId, amount)`

### Liquidator Events
- `AuctionStarted(auctionId, tokenId, loanId, startPrice, endPrice, endTime)`
- `AuctionBid(auctionId, buyer, price)`
- `AuctionSettled(auctionId, buyer, finalPrice, lpRecovery, badDebtCovered)`
