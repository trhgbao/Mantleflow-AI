import { aiApi } from './api';
import type {
  ApiResponse,
  ExtractedInvoice,
  RiskScoreData,
  OSINTData,
  EscalateData,
  GenerateEmailData,
  OSINTStatus,
} from '../types';

// Helper function to determine status from score
const getStatusFromScore = (score: number, maxScore: number): OSINTStatus => {
  const ratio = score / maxScore;
  if (ratio >= 0.7) return 'passed';
  if (ratio >= 0.4) return 'warning';
  return 'failed';
};

export const aiService = {
  /**
   * Extract document data from uploaded file
   * Supports: Land Title, Vehicle, Savings, Business Reg, Patent, Invoice
   */
  extractInvoice: async (file: File): Promise<ApiResponse<ExtractedInvoice>> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await aiApi.post(
        '/ai/extract',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      // Transform API response to frontend ExtractedInvoice type
      const apiData = response.data;

      if (apiData.error) {
        return {
          success: false,
          error: apiData.message || 'Failed to extract document',
        };
      }

      const data = apiData.data || apiData;

      // Map API response to ExtractedInvoice
      const extractedInvoice: ExtractedInvoice = {
        invoice_number: data.invoiceNumber || data.invoice_number || '',
        amount: data.amount || 0,
        currency: data.currency || 'VND',
        debtor: {
          name: data.debtor?.name || '',
          tax_id: data.debtor?.taxId || data.debtor?.tax_id || '',
          address: data.debtor?.address || '',
        },
        items: data.items || [],
        confidence: data.confidence || 0.9,
        doc_type: data.doc_type,
        doc_name: data.doc_name,
        attributes: data.attributes || {},
      };

      return {
        success: true,
        data: extractedInvoice,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to extract document',
      };
    }
  },

  /**
   * Calculate risk score
   */
  getRiskScore: async (data: {
    wallet_address: string;
    debtor_tax_id?: string;
    invoice_amount: number;
    payment_term_days?: number;
    debtor_business_age_months?: number;
    osint_score?: number;
  }): Promise<ApiResponse<RiskScoreData>> => {
    try {
      const response = await aiApi.post('/ai/risk-score', data);
      const apiData = response.data;

      if (!apiData.success) {
        return {
          success: false,
          error: apiData.error || 'Risk score calculation failed',
        };
      }

      return {
        success: true,
        data: apiData.data as RiskScoreData,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Risk score calculation failed',
      };
    }
  },

  /**
   * Check OSINT - Đánh giá độ uy tín dữ liệu OCR bằng Gemini AI
   * 
   * Flow: OCR data → Gemini AI → Credibility Score (0-100)
   */
  checkOSINT: async (data: {
    // Full OCR extracted data
    doc_type?: string;
    doc_name?: string;
    invoice_number?: string;
    amount?: number;
    currency?: string;
    attributes?: Record<string, any>;
    // Basic debtor info
    company_name?: string;
    tax_id?: string;
    address?: string;
  }): Promise<ApiResponse<OSINTData>> => {
    try {
      const response = await aiApi.post('/ai/osint', data);
      const apiData = response.data;

      if (!apiData.success) {
        return {
          success: false,
          error: apiData.error || 'OSINT check failed',
        };
      }

      const backendData = apiData.data || apiData;
      const osintScore = backendData.osint_score || 0;
      const isCredible = backendData.is_credible ?? (osintScore >= 60);
      
      // Get scores from backend (new format with 4 criteria, 25 points each)
      const scores = backendData.analysis?.scores || {};
      
      // Transform backend response to frontend OSINTData format
      const osintData: OSINTData = {
        osint_score: osintScore,
        is_credible: isCredible,
        is_shell_company: !isCredible,
        auto_reject: osintScore < 40,
        reject_reason: osintScore < 40 ? 'Điểm uy tín quá thấp' : undefined,
        
        // 4 tiêu chí đánh giá
        criteria: {
          completeness: {
            score: scores.completeness ?? Math.round(osintScore / 4),
            max_score: 25,
            status: getStatusFromScore(scores.completeness ?? osintScore / 4, 25),
            label: 'Tính đầy đủ',
            description: 'Thông tin có đủ các trường quan trọng không?',
          },
          validity: {
            score: scores.validity ?? Math.round(osintScore / 4),
            max_score: 25,
            status: getStatusFromScore(scores.validity ?? osintScore / 4, 25),
            label: 'Tính hợp lệ',
            description: 'Format dữ liệu có đúng chuẩn không?',
          },
          consistency: {
            score: scores.consistency ?? Math.round(osintScore / 4),
            max_score: 25,
            status: getStatusFromScore(scores.consistency ?? osintScore / 4, 25),
            label: 'Tính nhất quán',
            description: 'Thông tin có mâu thuẫn nhau không?',
          },
          no_fraud_signs: {
            score: scores.no_fraud_signs ?? Math.round(osintScore / 4),
            max_score: 25,
            status: getStatusFromScore(scores.no_fraud_signs ?? osintScore / 4, 25),
            label: 'Không có dấu hiệu gian lận',
            description: 'Có dấu hiệu giả mạo, bất thường không?',
          },
        },
        
        red_flags: backendData.red_flags || [],
        positive_signs: backendData.positive_signs || [],
        
        summary: backendData.analysis?.summary || '',
        recommendation: backendData.analysis?.recommendation || 
          (isCredible ? 'Tài liệu đáng tin cậy' : 'Cần xem xét thêm'),
        doc_type: backendData.analysis?.doc_type || data.doc_type,
      };

      return {
        success: true,
        data: osintData,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'OSINT check failed',
      };
    }
  },

  /**
   * Trigger agent escalation
   */
  escalate: async (data: {
    loan_id: string;
    current_level?: number;
    days_overdue: number;
    borrower_email: string;
    borrower_phone?: string;
    amount_owed: number;
    currency?: string;
    borrower_name?: string;
    company_name?: string;
  }): Promise<ApiResponse<EscalateData>> => {
    const response = await aiApi.post<ApiResponse<EscalateData>>(
      '/ai/agent/escalate',
      data
    );
    return response.data;
  },

  /**
   * Generate collection email
   */
  generateEmail: async (data: {
    level: number;
    borrower_name: string;
    company_name?: string;
    loan_amount: number;
    currency?: string;
    due_date: string;
    days_overdue?: number;
    language?: string;
  }): Promise<ApiResponse<GenerateEmailData>> => {
    const response = await aiApi.post<ApiResponse<GenerateEmailData>>(
      '/ai/generate-email',
      data
    );
    return response.data;
  },

  /**
   * Health check
   */
  healthCheck: async (): Promise<any> => {
    const response = await aiApi.get('/health');
    return response.data;
  },
};
