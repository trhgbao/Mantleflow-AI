# PERSON B: BACKEND DEVELOPER
## Kế hoạch chi tiết 1 ngày - MantleFlow AI Hackathon

---

# 🎯 NHIỆM VỤ CHÍNH
Xây dựng Backend API, Database, kết nối Smart Contract và AI services

# 🛠️ TECH STACK
- Node.js + Express (hoặc Fastify)
- PostgreSQL (Supabase) + Prisma ORM
- Redis + Bull (Job Queue)
- ethers.js v6 (Web3)
- Nodemailer + Twilio (Notifications)

---

# 🗄️ DATABASE TABLES CẦN TẠO

| Table | Mô tả | Quan trọng |
|-------|-------|------------|
| users | Wallet address, KYC status, contact info | ⭐ |
| invoices | Invoice data, hash, status | ⭐ |
| risk_assessments | Score, tier, OSINT data, breakdown | ⭐ |
| loans | NFT ID, amounts, due date, status | ⭐ |
| payments | On-chain/off-chain, oracle confirmations | ⭐ |
| debtor_confirmations | OTP, expiry, confirmation hash | ⭐ |
| auctions | Dutch auction data | |
| notifications | Email/SMS logs | |
| whitelist | Trusted companies (VNR500) | ⭐ |
| audit_logs | Activity tracking | |

---

# 🔌 API ENDPOINTS CẦN XÂY DỰNG

## Auth (2 endpoints)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/auth/connect | Wallet login (SIWE) |
| GET | /api/auth/me | Get user info |

## KYC (2 endpoints)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/kyc/submit | Submit KYC documents |
| GET | /api/kyc/status | Check KYC status |

## Invoice (3 endpoints)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/invoices/upload | Upload + gọi AI extract |
| GET | /api/invoices | List user's invoices |
| GET | /api/invoices/:id | Invoice detail |

## Debtor Confirmation (3 endpoints) ⭐
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/debtor/send-otp | Gửi OTP email (48h expiry) |
| POST | /api/debtor/verify-otp | Verify OTP |
| GET | /api/debtor/status/:invoiceId | Check status |

## Risk Assessment (3 endpoints) ⭐
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/risk/assess | Gọi AI scoring + OSINT |
| GET | /api/risk/:invoiceId | Get assessment |
| POST | /api/risk/check-whitelist | Check whitelist |

## Loan (5 endpoints) ⭐
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/loans/create | Mint NFT + Create loan |
| GET | /api/loans | List user's loans |
| GET | /api/loans/:id | Loan detail |
| POST | /api/loans/:id/repay | Repay loan |
| POST | /api/loans/:id/activate | Activate after 24h |

## Challenge (2 endpoints) ⭐
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/loans/:id/challenge | Raise challenge (trong 24h) |
| POST | /api/challenges/:id/resolve | Resolve dispute |

## Oracle (3 endpoints) ⭐
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| POST | /api/oracle/submit | Submit off-chain payment |
| POST | /api/oracle/confirm | Oracle node confirm (2/3) |
| GET | /api/oracle/pending | List pending payments |

## Auction (3 endpoints)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | /api/auctions | List active auctions |
| GET | /api/auctions/:id | Auction detail |
| POST | /api/auctions/:id/bid | Place bid |

## Notifications (2 endpoints)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | /api/notifications | User notifications |
| PUT | /api/notifications/:id/read | Mark as read |

## Analytics (2 endpoints - mở rộng)
| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| GET | /api/analytics/dashboard | Stats overview |
| GET | /api/analytics/user | User stats |

**TỔNG: ~30 endpoints**

---

# 🔄 EVENT LISTENER

## Events cần listen từ Smart Contracts:

**Từ LendingPool:**
- LoanCreated → Lưu DB, schedule reminders
- LoanActivated → Update status
- LoanRepaid → Update status, cancel reminders
- LoanOverdue → Trigger Agent escalation
- LoanDefaulted → Start auction
- LoanChallenged → Pause, notify

**Từ PaymentOracle:**
- PaymentSubmitted → Lưu pending
- PaymentConfirmed → Update confirmations
- PaymentExecuted → Process repayment

**Từ Liquidator:**
- AuctionStarted → Lưu auction
- AuctionBid → Update price
- AuctionSettled → Close auction

---

# 📬 JOB QUEUES

| Queue | Jobs |
|-------|------|
| notification-queue | sendEmail, sendSMS, sendTelegram |
| reminder-queue | Level 1-4 escalation scheduling |
| oracle-queue | verifyPayment, submitToContract |
| agent-queue | escalate, sendAIEmail, triggerLiquidation |

---

# ⏰ TIMELINE CHI TIẾT

## 🌅 SÁNG (6:00 - 12:00)

| Giờ | Task | Output |
|-----|------|--------|
| 6:00-7:00 | Setup Express + PostgreSQL + Prisma | Project ready |
| 7:00-8:00 | Database schema + migrations | 10 tables created |
| 8:00-9:00 | Auth module (SIWE wallet login) | Login works |
| 9:00-10:00 | Invoice module (upload, store) | Upload works |
| 10:00-11:00 | Debtor confirmation (OTP flow) | OTP works |
| 11:00-12:00 | Risk module (gọi AI service) | Integration ready |

**🔄 SYNC 12:30:** Test với Person C's AI service

---

## ☀️ CHIỀU (13:00 - 18:00)

| Giờ | Task | Output |
|-----|------|--------|
| 13:00-14:00 | Contract service (connect Person A's contracts) | ethers.js setup |
| 14:00-15:00 | Loan module (create, list, detail) | CRUD works |
| 15:00-16:00 | Oracle module (submit, confirm 2/3) | Multi-sig works |
| 16:00-17:00 | Notification service (email setup) | Email sends |
| 17:00-18:00 | API documentation (Swagger) | Docs ready |

**🔄 SYNC 15:00:** Nhận contract addresses từ Person A
**🔄 SYNC 18:30:** Test full flow với team

---

## 🌙 TỐI (19:00 - 23:00)

| Giờ | Task | Output |
|-----|------|--------|
| 19:00-20:00 | Event listener (WebSocket/polling) | Listen contracts |
| 20:00-21:00 | Job queue (Bull + Redis) | Async tasks work |
| 21:00-22:00 | Challenge + Auction endpoints | Complete API |
| 22:00-23:00 | Testing + Bug fixes | Stable API |

---

# 🔗 INTEGRATION VỚI TEAM

## Với Person A (Smart Contract):
**Bạn gọi contracts:**
- InvoiceNFT.mint()
- LendingPool.createLoan(), activateLoan(), repay()
- PaymentOracle.submitPayment(), confirmPayment()
- Liquidator.startAuction(), bid()

**Bạn listen events:**
- Tất cả events → Update DB → Trigger jobs

## Với Person C (AI + Frontend):
**Person C gọi API của bạn:**
- Tất cả 30 endpoints ở trên

**Bạn gọi Person C's AI services:**
- POST /ai/extract - Extract invoice
- POST /ai/risk-score - Calculate risk
- POST /ai/osint - Check công ty ma
- POST /ai/generate-email - Generate email

---

# ✅ CHECKLIST CUỐI NGÀY

**API hoạt động:**
- [ ] Auth (wallet connect)
- [ ] KYC submit/status
- [ ] Invoice upload + AI extract
- [ ] Debtor OTP (48h expiry)
- [ ] Risk + OSINT + Whitelist
- [ ] Loan CRUD + Challenge
- [ ] Oracle multi-sig 2/3
- [ ] Notifications
- [ ] Auctions

**Integrations:**
- [ ] Connect Person A's contracts
- [ ] Call Person C's AI services
- [ ] Event listener running
- [ ] Job queue processing

**Documentation:**
- [ ] Swagger ready
- [ ] Endpoints documented

---

# 📝 LƯU Ý QUAN TRỌNG

## Anti-Fraud Logic (Bước 2.4):
1. Check whitelist trước (VNR500, verified partners)
2. Check business age (< 6 tháng → REJECT)
3. Gọi OSINT service
4. osintScore < 30 hoặc isShellCompany → REJECT

## Challenge Period:
- Loan mới: status = "pending"
- challenge_end_time = created_at + 24h
- Trong 24h: cho phép challenge
- Sau 24h: mới activate

## Oracle Multi-sig:
- Cần 2/3 confirmations
- Track confirmed_by array
- Không cho confirm 2 lần

## Debtor Confirmation:
- OTP 6 số, hash trước khi lưu
- Expire sau 48h
- Lưu confirmation_hash

---

# 🆘 KHI GẶP KHÓ KHĂN

| Vấn đề | Giải pháp |
|--------|-----------|
| DB connection fail | Check connection string, SSL |
| Contract call fail | Check ABI, address, gas |
| AI service timeout | Add retry logic |
| Event miss | Check block range, reconnect |
| Stuck > 30 phút | Báo ngay group chat |

**Liên hệ:**
- Person A: Contract issues
- Person C: AI service issues
