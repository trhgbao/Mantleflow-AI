# PERSON C: FRONTEND + AI DEVELOPER
## Kế hoạch chi tiết 1 ngày - MantleFlow AI Hackathon

---

# 🎯 NHIỆM VỤ CHÍNH
1. **AI Engine:** OCR, Risk Scoring, OSINT, Agent
2. **Frontend:** ReactJS + Ant Design

# 🛠️ TECH STACK

## AI Engine:
- Python 3.10+
- Google Gemini 1.5 Flash API
- LangChain
- Flask/FastAPI

## Frontend:
- **ReactJS 18** + Vite
- **Ant Design 5.x**
- React Router v6
- Axios
- Zustand (state)
- wagmi + viem (Web3)

---

# 🤖 PHẦN 1: AI ENGINE

## 1.1 Invoice OCR (Gemini)

**Input:** PDF, Word, Excel, Image
**Output:** JSON chứa invoice data

| Field | Mô tả |
|-------|-------|
| invoiceNumber | Số hóa đơn |
| amount | Số tiền |
| currency | VND/USD |
| debtor.name | Tên công ty nợ |
| debtor.taxId | Mã số thuế |
| debtor.address | Địa chỉ |
| dueDate | Hạn thanh toán |
| items[] | Chi tiết line items |

**API Endpoint:** `POST /ai/extract`

---

## 1.2 Risk Scoring (8 Features)

| Feature | Weight | Logic |
|---------|--------|-------|
| wallet_age | 10% | <30d=0, 30-90=50, 90-180=75, >180=100 |
| tx_volume_30d | 15% | <$1K=25, 1K-10K=50, 10K-50K=75, >50K=100 |
| debtor_reputation | 15% | Từ database |
| debtor_business_age | 15% | <6mo=REJECT, 6-12=50, 12-24=75, >24=100 |
| debtor_osint_score | 15% | Từ OSINT check |
| invoice_amount | 10% | <$10K=100, 10-50K=75, 50-100K=50, >100K=25 |
| payment_term_days | 5% | <30d=100, 30-60=75, 60-90=50, >90=25 |
| past_loan_history | 10% | 0 defaults=100, 1=50, >1=0 |

**Output:**
| Tier | Score | LTV | Interest |
|------|-------|-----|----------|
| A | 80-100 | 80% | 5% APR |
| B | 50-79 | 60% | 8% APR |
| C | 30-49 | 40% | 12% APR |
| D | 0-29 | REJECT | - |

**API Endpoint:** `POST /ai/risk-score`

---

## 1.3 OSINT Anti-Fraud ⭐ QUAN TRỌNG NHẤT

**Kiểm tra 5 yếu tố (mỗi yếu tố max 20 điểm):**

| Yếu tố | Cách check | Điểm |
|--------|------------|------|
| **Website** | HTTP request, check nội dung, SSL | 0-20 |
| **LinkedIn** | Search company page, đếm employees | 0-20 |
| **Google Maps** | Search địa chỉ, reviews, rating | 0-20 |
| **Báo chí** | Search Google News | 0-20 |
| **Mạng xã hội** | Facebook Page, Zalo OA | 0-20 |

**Business Age Check:**
- < 6 tháng → **AUTO REJECT**
- "Ngừng hoạt động" → **AUTO REJECT**
- Vốn < 1 tỷ VND → FLAG manual review

**Shell Company Detection:**
- 3+ red flags → isShellCompany = true → **REJECT**
- osintScore < 30 → **REJECT**

**Red Flags:**
- ❌ Không có website
- ❌ 0 employees trên LinkedIn
- ❌ Không có Google Maps listing
- ❌ Không có tin tức
- ❌ Không có Facebook/Zalo
- ❌ Mới thành lập < 6 tháng

**API Endpoint:** `POST /ai/osint`

**⛔ ĐIỂM NHẤN THUYẾT TRÌNH:**
> "Công ty ma không có website, không có nhân viên LinkedIn, mã số thuế mới lập → AI chấm Tier D → Loại ngay!"

---

## 1.4 AI Agent (LangChain)

**Escalation Ladder:**

| Level | Trigger | Actions |
|-------|---------|---------|
| 1 | 3 ngày trước due | Email friendly |
| 2 | Due date | Email urgent + SMS |
| 3 | 7 ngày quá hạn | Email final + List NFT |
| 4 | 14 ngày quá hạn | Trigger liquidation |

**Agent Tools:**
1. check_loan_status
2. send_email
3. send_sms
4. list_nft_marketplace
5. trigger_liquidation
6. generate_email_content

**Email Tones:**
- Level 1: Friendly (nhắc nhở nhẹ nhàng)
- Level 2: Urgent (khẩn cấp)
- Level 3: Final (cảnh báo cuối)
- Level 4: Liquidation (thông báo thanh lý)

**API Endpoints:**
- `POST /ai/agent/escalate`
- `POST /ai/generate-email`

---

# 💻 PHẦN 2: FRONTEND (ReactJS + Ant Design)

## 2.1 Pages cần làm (5-6 pages)

### Page 1: Landing (/)
**Sections:**
- Hero: "Unlock Your Invoice Value Instantly"
- Features: 3 cards (AI Score, Instant Liquidity, Auto Collect)
- How it works: Steps component (4 bước)
- CTA: Connect Wallet button

**Ant Design Components:**
- Layout, Typography, Button, Card, Row/Col, Steps

---

### Page 2: Dashboard (/dashboard)
**Sections:**
- Stats row: Balance, Active Loans, Total Borrowed, Repaid
- Loans table: ID, Amount, Due Date, Status, Actions

**Ant Design Components:**
- Layout.Sider + Menu (sidebar)
- Statistic trong Card
- Table với Tag cho status
- Status colors: 🔵Pending, 🟢Active, 🟡Overdue, 🔴Defaulted, ⚪Repaid

---

### Page 3: Upload (/upload) ⭐ QUAN TRỌNG
**Flow:**
1. Drag-drop file upload
2. Loading: "AI đang phân tích..."
3. Hiển thị extracted data
4. Hiển thị Risk Score card
5. Hiển thị OSINT results
6. Button "Get Loan"

**Ant Design Components:**
- Steps (progress)
- Upload.Dragger
- Spin (loading)
- Descriptions (invoice data)
- Progress type="circle" (risk score)
- List (OSINT checks với ✅/⚠️)
- Tag (tier badge)
- Button type="primary"

**Components tự tạo:**
- **RiskScoreCard:** Progress circle + Tier badge + LTV + Interest
- **OSINTResultCard:** 5 checks với icons + Overall score

---

### Page 4: Loan Detail (/loans/:id)
**Sections:**
- Loan info: Descriptions component
- Timeline: Created → Active → Due → Repaid
- Repay button + Modal

**Ant Design Components:**
- Descriptions bordered
- Timeline
- Alert (nếu overdue)
- Modal + InputNumber (repay form)
- Button

---

### Page 5: Marketplace (/marketplace) - Optional
**Sections:**
- Auction grid
- Countdown timer
- Bid button

**Ant Design Components:**
- Card với Card.Meta
- Statistic.Countdown
- InputNumber, Button

---

## 2.2 Common Components

| Component | Ant Design | Chức năng |
|-----------|------------|-----------|
| Header | Layout.Header, Menu, Button | Navigation + Wallet |
| Sidebar | Layout.Sider, Menu | Dashboard nav |
| ConnectButton | Button | Wallet connect |
| FileUpload | Upload.Dragger | Drag-drop upload |
| RiskScoreCard | Card, Progress, Statistic, Tag | Hiển thị tier |
| OSINTResultCard | Card, List, CheckCircleOutlined | Hiển thị 5 checks |
| LoanCard | Card, Tag, Button | Loan item |
| LoanTimeline | Timeline | Loan progress |
| RepayModal | Modal, InputNumber, Button | Repay form |

---

## 2.3 Màu sắc Tier

| Tier | Màu | Ant Design |
|------|-----|------------|
| A | Green | `#52c41a` hoặc `color="green"` |
| B | Yellow | `#faad14` hoặc `color="gold"` |
| C | Orange | `#fa8c16` hoặc `color="orange"` |
| D | Red | `#f5222d` hoặc `color="red"` |

---

# ⏰ TIMELINE CHI TIẾT

## 🌅 SÁNG (6:00 - 12:00) - AI Engine

| Giờ | Task | Output |
|-----|------|--------|
| 6:00-7:00 | Setup Python + Flask/FastAPI | API server ready |
| 7:00-8:30 | **Gemini OCR** service | Extract works |
| 8:30-10:00 | **Risk Scoring** (8 features) | Score + Tier output |
| 10:00-11:30 | **OSINT Checker** (5 yếu tố) | Shell company detection |
| 11:30-12:00 | Test AI endpoints | All AI APIs work |

**🔄 SYNC 12:30:** Test AI với Person B

---

## ☀️ CHIỀU (13:00 - 18:00) - Frontend

| Giờ | Task | Output |
|-----|------|--------|
| 13:00-14:00 | Setup React + Vite + Ant Design + wagmi | Project ready |
| 14:00-15:00 | **Landing page** | Hero, features, CTA |
| 15:00-16:00 | **Upload page** + FileUpload component | Drag-drop works |
| 16:00-17:00 | **RiskScoreCard + OSINTResultCard** | AI results display |
| 17:00-18:00 | **Dashboard** + Loans table | List loans |

**🔄 SYNC 18:30:** Test full flow với team

---

## 🌙 TỐI (19:00 - 23:00) - Agent + Polish

| Giờ | Task | Output |
|-----|------|--------|
| 19:00-20:00 | **LangChain Agent** (6 tools) | Agent works |
| 20:00-20:30 | **Email generation** (4 levels) | Vietnamese emails |
| 20:30-21:30 | **Loan Detail page** + Repay modal | Complete flow |
| 21:30-22:30 | UI polish: Loading, errors, responsive | UX smooth |
| 22:30-23:00 | **Demo recording** | Video backup |

---

# 🔗 INTEGRATION VỚI TEAM

## AI Services (Person B gọi):
| Endpoint | Chức năng |
|----------|-----------|
| POST /ai/extract | Extract invoice data |
| POST /ai/risk-score | Calculate risk |
| POST /ai/osint | Check công ty ma |
| POST /ai/agent/escalate | Trigger agent |
| POST /ai/generate-email | Generate email |

## Frontend → Person B's API:
| Action | Endpoint |
|--------|----------|
| Login | POST /api/auth/connect |
| Upload | POST /api/invoices/upload |
| Get Risk | POST /api/risk/assess |
| Create Loan | POST /api/loans/create |
| List Loans | GET /api/loans |
| Repay | POST /api/loans/:id/repay |

---

# ✅ CHECKLIST CUỐI NGÀY

## AI Services:
- [ ] OCR extract từ PDF/Word/Excel
- [ ] Risk scoring 8 features
- [ ] OSINT 5 yếu tố
- [ ] Shell company detection
- [ ] LangChain Agent 6 tools
- [ ] Email generation 4 levels

## Frontend:
- [ ] Landing page
- [ ] Wallet connect
- [ ] Upload page + Drag-drop
- [ ] RiskScoreCard component
- [ ] OSINTResultCard component
- [ ] Dashboard + Loans table
- [ ] Loan detail + Repay
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive

## Demo ready:
- [ ] Scene 1: Upload + AI analyze
- [ ] Scene 2: Risk score + OSINT display
- [ ] Scene 3: Get loan + NFT mint
- [ ] Scene 4: Agent email demo
- [ ] Video recorded

---

# 📝 LƯU Ý QUAN TRỌNG

1. **OSINT là điểm nhấn** - Demo phải show rõ phát hiện công ty ma
2. **RiskScoreCard** - Visual đẹp, màu rõ ràng theo tier
3. **AI Email** - Tiếng Việt chuẩn, professional
4. **Agent demo** - Real-time email đến điện thoại team
5. **Ant Design** - Dùng components có sẵn, đừng tự style nhiều

---

# 🆘 KHI GẶP KHÓ KHĂN

| Vấn đề | Giải pháp |
|--------|-----------|
| Gemini rate limit | Cache responses |
| OSINT APIs fail | Mock data, UI vẫn đẹp |
| Frontend bugs | Test nhiều browsers |
| Agent không trigger | Check event listener |
| Stuck > 30 phút | Báo ngay group chat |

**Liên hệ Person B** nếu API không hoạt động.
