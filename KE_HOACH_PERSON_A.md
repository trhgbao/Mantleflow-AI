# PERSON A: SMART CONTRACT DEVELOPER
## Kế hoạch chi tiết 1 ngày - MantleFlow AI Hackathon

---

# 🎯 NHIỆM VỤ CHÍNH
Xây dựng toàn bộ Smart Contracts trên Mantle Sepolia

# 🛠️ TECH STACK
- Solidity 0.8.20+
- Foundry (forge, cast, anvil)
- OpenZeppelin Contracts 5.x
- Mantle Sepolia Testnet (Chain ID: 5003)

---

# 📦 DANH SÁCH CONTRACTS CẦN VIẾT

## 1. InvoiceNFT.sol
**Chức năng:** Token hóa hóa đơn thành NFT (ERC-721)

**Metadata cần lưu:**
- invoice_hash (SHA-256 của document)
- debtor_confirmation_hash
- due_date, amount, risk_tier
- kyc_proof_hash
- osint_score

**Functions:**
- mint() - Tạo NFT với metadata
- burn() - Đốt NFT khi phát hiện gian lận
- getInvoiceData() - Lấy thông tin

**Events:** InvoiceMinted, InvoiceBurned

---

## 2. Escrow.sol
**Chức năng:** Giữ NFT làm tài sản đảm bảo

**Functions:**
- lockNFT() - Khóa NFT khi tạo loan
- releaseNFT() - Trả NFT khi repay xong
- transferToLiquidator() - Chuyển khi default

**Events:** NFTLocked, NFTReleased, NFTTransferredToLiquidator

---

## 3. LendingPool.sol
**Chức năng:** Quản lý pool cho vay

**Features quan trọng:**
- Multi-currency: mUSD, USDT, USDC
- Interest rates theo tier: A=5%, B=8%, C=12%
- LTV theo tier: A=80%, B=60%, C=40%
- **Challenge Period 24h** (chống gian lận)
- Fee: 1% origination

**Functions:**
- deposit() / withdraw() - LP quản lý vốn
- createLoan() - Tạo loan (status: Pending 24h)
- activateLoan() - Kích hoạt sau challenge period
- repay() - Trả nợ
- challengeLoan() - Raise challenge trong 24h
- resolveChallenge() - Giải quyết dispute
- markOverdue() / markDefaulted() - Keeper gọi

**Loan Status:** Pending → Active → Overdue → Defaulted → Liquidated

**Events:** LoanCreated, LoanActivated, LoanRepaid, LoanOverdue, LoanDefaulted, LoanChallenged

---

## 4. PaymentOracle.sol
**Chức năng:** Bridge off-chain payment → on-chain

**Features quan trọng:**
- **Multi-sig 2/3** oracle nodes confirm
- Challenge period 24h
- Dispute resolution

**Functions:**
- submitPayment() - Oracle submit proof
- confirmPayment() - Cần 2/3 confirms
- executePayment() - Thực thi khi đủ confirms
- challengePayment() - Raise dispute

**Events:** PaymentSubmitted, PaymentConfirmed, PaymentExecuted

---

## 5. Liquidator.sol
**Chức năng:** Thanh lý NFT khi default

**Features quan trọng:**
- **Dutch Auction:** Bắt đầu 80% face value, giảm dần
- **Insurance Fund:** 5% mỗi loan fee
- Bad debt coverage

**Functions:**
- startAuction() - Bắt đầu đấu giá
- getCurrentPrice() - Giá hiện tại (giảm theo thời gian)
- bid() - Mua NFT
- settleAuction() - Kết thúc
- addToInsurance() / coverBadDebt()

**Events:** AuctionStarted, AuctionBid, AuctionSettled, BadDebtCovered

---

## 6. MFLToken.sol (MỞ RỘNG - nếu kịp)
**Chức năng:** Governance token ERC-20
- ERC20Votes cho voting
- Max supply: 100M tokens

---

## 7. Staking.sol (MỞ RỘNG - nếu kịp)
**Chức năng:** Stake MFL để boost LTV
- Stake 1000 MFL → +2% LTV
- Stake 5000 MFL → +5% LTV
- Stake 10000 MFL → +10% LTV

---

# ⏰ TIMELINE CHI TIẾT

## 🌅 SÁNG (6:00 - 12:00)

| Giờ | Task | Output |
|-----|------|--------|
| 6:00-7:00 | Setup Foundry, install OpenZeppelin, tạo structure | Project ready |
| 7:00-8:30 | Viết **InvoiceNFT.sol** | ERC-721 với metadata |
| 8:30-10:00 | Viết **Escrow.sol** | Lock/release logic |
| 10:00-11:30 | Viết **LendingPool.sol** | Core lending + Challenge Period |
| 11:30-12:00 | Viết **Liquidator.sol** (basic) | Dutch auction |

**🔄 SYNC 12:30:** Gửi ABI + local addresses cho Person B

---

## ☀️ CHIỀU (13:00 - 18:00)

| Giờ | Task | Output |
|-----|------|--------|
| 13:00-14:30 | Viết **PaymentOracle.sol** | Multi-sig 2/3 |
| 14:30-15:30 | Viết **MFLToken + Staking** (optional) | Governance |
| 15:30-16:30 | Viết Unit Tests | Core tests pass |
| 16:30-17:30 | Deploy lên **Mantle Sepolia** | Contracts live |
| 17:30-18:00 | Verify contracts trên Explorer | Verified ✓ |

**🔄 SYNC 15:00:** Gửi testnet addresses cho Person B
**🔄 SYNC 18:30:** Test integration với Backend

---

## 🌙 TỐI (19:00 - 23:00)

| Giờ | Task | Output |
|-----|------|--------|
| 19:00-20:30 | Integration tests với Backend | Full flow works |
| 20:30-21:30 | Security review | Reentrancy, access control OK |
| 21:30-22:30 | Gas optimization | Optimized |
| 22:30-23:00 | Documentation (NatSpec) | Comments done |

---

# 🔗 INTEGRATION VỚI TEAM

## Gửi cho Person B:
- Contract ABIs (JSON)
- Deployed addresses
- Event signatures

## Person B sẽ gọi:
- InvoiceNFT.mint()
- LendingPool.createLoan(), repay()
- PaymentOracle.submitPayment()
- Liquidator.startAuction()

## Events cho Person C's Agent listen:
- LoanCreated, LoanOverdue, LoanDefaulted
- PaymentReceived, LiquidationTriggered

---

# ✅ CHECKLIST CUỐI NGÀY

**Contracts deployed:**
- [ ] InvoiceNFT.sol
- [ ] Escrow.sol
- [ ] LendingPool.sol
- [ ] PaymentOracle.sol
- [ ] Liquidator.sol
- [ ] (Optional) MFLToken.sol
- [ ] (Optional) Staking.sol

**Features hoạt động:**
- [ ] Mint NFT với metadata
- [ ] Challenge Period 24h
- [ ] Multi-sig Oracle 2/3
- [ ] Dutch Auction
- [ ] Insurance Fund 5%

**Security:**
- [ ] Reentrancy guards
- [ ] Access control (roles)
- [ ] Events emit đầy đủ

---

# 📝 LƯU Ý QUAN TRỌNG

1. **Challenge Period 24h** - Feature chống gian lận, đừng bỏ
2. **Multi-sig 2/3** - Không hardcode 1 address
3. **Events đầy đủ** - Person C's Agent phụ thuộc vào events
4. **Dutch Auction** - Giá giảm theo thời gian
5. **Insurance Fund** - Trích 5% fee mỗi loan

---

# 🆘 KHI GẶP KHÓ KHĂN

| Vấn đề | Giải pháp |
|--------|-----------|
| Contract không compile | Check Solidity version, imports |
| Deploy fail | Check gas, RPC, private key |
| Test fail | Check mock setup |
| Stuck > 30 phút | Báo ngay trong group chat |
