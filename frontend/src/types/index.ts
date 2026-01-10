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

// OSINT types
export type OSINTStatus = 'passed' | 'warning' | 'failed';

export interface OSINTCheckResult {
  score: number;
  max_score: number;
  status: OSINTStatus;
  details: Record<string, any>;
}

export interface OSINTChecks {
  website: OSINTCheckResult;
  linkedin: OSINTCheckResult;
  google_maps: OSINTCheckResult;
  press_news: OSINTCheckResult;
  social_media: OSINTCheckResult;
}

export interface BusinessAgeResult {
  months: number;
  status: 'passed' | 'warning' | 'rejected';
}

export interface OSINTData {
  osint_score: number;
  is_shell_company: boolean;
  auto_reject: boolean;
  reject_reason?: string;
  checks: OSINTChecks;
  business_age: BusinessAgeResult;
  red_flags: string[];
  recommendation: string;
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
