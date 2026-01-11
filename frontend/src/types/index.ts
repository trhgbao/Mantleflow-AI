// Invoice types
export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export interface DebtorInfo {
  name: string;
  tax_id?: string;
  address?: string;
  email?: string;
  phone?: string;
}

export interface CreditorInfo {
  name: string;
  tax_id?: string;
  address?: string;
}

export type DocumentType = 'LAND_TITLE' | 'VEHICLE' | 'SAVINGS' | 'BUSINESS_REG' | 'PATENT' | 'INVOICE' | 'UNKNOWN';

export interface DocumentAttributes {
  // Land Title
  land_lot_no?: string;
  land_map_no?: string;
  land_area?: string;
  land_address?: string;
  land_purpose?: string;
  cert_book_entry?: string;

  // Vehicle
  plate_number?: string;
  brand?: string;
  vehicle_type?: string;
  chassis_no?: string;
  engine_no?: string;
  valid_until?: string;

  // Savings
  bank_name?: string;
  book_serial?: string;
  account_no?: string;
  term?: string;
  maturity_date?: string;

  // Business Registration
  business_code?: string;
  company_name?: string;
  headquarters?: string;
  charter_capital?: number;
  legal_representative?: string;
  representative_title?: string;
  registration_date?: string;

  // Patent
  patent_number?: string;
  patent_title?: string;
  patent_owner?: string;
  inventor?: string;
  application_number?: string;
  application_date?: string;
  grant_decision?: string;

  // Invoice
  buyer_name?: string;
  seller_name?: string;
}

export interface ExtractedInvoice {
  invoice_number: string;
  amount: number;
  currency: string;
  debtor: DebtorInfo;
  creditor?: CreditorInfo;
  issue_date?: string;
  due_date?: string;
  items: InvoiceItem[];
  confidence: number;
  // Extended fields for document types
  doc_type?: DocumentType;
  doc_name?: string;
  attributes?: DocumentAttributes;
}

// Risk types
export type RiskTier = 'A' | 'B' | 'C' | 'D';

export interface FeatureScore {
  score: number;
  weight: number;
  weighted: number;
  raw_value?: any;
  description?: string;
}

export interface RiskScoreData {
  total_score: number;
  tier: RiskTier;
  ltv: number;
  interest_rate: number;
  breakdown: Record<string, FeatureScore>;
  recommendation: string;
  is_approved: boolean;
}

// === OSINT types (updated for Gemini AI evaluation) ===
export type OSINTStatus = 'passed' | 'warning' | 'failed';

// Tiêu chí đánh giá độ uy tín
export interface CredibilityScores {
  completeness: number;      // Tính đầy đủ (0-25)
  validity: number;          // Tính hợp lệ (0-25)
  consistency: number;       // Tính nhất quán (0-25)
  no_fraud_signs: number;    // Không có dấu hiệu gian lận (0-25)
}

// Kết quả đánh giá từng tiêu chí
export interface CredibilityCriterion {
  score: number;
  max_score: number;
  status: OSINTStatus;
  label: string;
  description: string;
}

// Data OSINT trả về từ API
export interface OSINTData {
  osint_score: number;           // Điểm uy tín tổng (0-100)
  is_credible: boolean;          // Dữ liệu có đáng tin cậy không
  is_shell_company?: boolean;    // Backwards compatibility
  auto_reject: boolean;          // Tự động từ chối
  reject_reason?: string;        // Lý do từ chối
  
  // 4 tiêu chí đánh giá
  criteria: {
    completeness: CredibilityCriterion;
    validity: CredibilityCriterion;
    consistency: CredibilityCriterion;
    no_fraud_signs: CredibilityCriterion;
  };
  
  red_flags: string[];           // Các vấn đề phát hiện
  positive_signs: string[];      // Các điểm tích cực
  
  summary: string;               // Tóm tắt đánh giá
  recommendation: string;        // Khuyến nghị
  doc_type?: string;             // Loại tài liệu đã đánh giá
}

// Loan types
export type LoanStatus = 'Pending' | 'Active' | 'Overdue' | 'Defaulted' | 'Liquidated' | 'Repaid' | 'Challenged';

export interface Loan {
  id: string;
  borrower: string;
  principal: number;
  interest_rate: number;
  due_date: string;
  status: LoanStatus;
  nft_token_id?: string;
  created_at: string;
  tier: RiskTier;
  currency: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Agent types
export interface ActionTaken {
  action: string;
  status: 'sent' | 'pending' | 'failed';
  recipient?: string;
  timestamp?: string;
}

export interface EscalateData {
  level: number;
  actions_taken: ActionTaken[];
  next_escalation?: {
    level: number;
    trigger_at: string;
    actions: string[];
  };
  message: string;
}

export interface GenerateEmailData {
  subject: string;
  body: string;
  tone: string;
  level: number;
}
