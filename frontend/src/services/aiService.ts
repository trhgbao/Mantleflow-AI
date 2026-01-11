import { aiApi } from './api';
import type {
  ApiResponse,
  ExtractedInvoice,
  RiskScoreData,
  OSINTData,
  EscalateData,
  GenerateEmailData,
} from '../types';

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
   * Check OSINT - Gửi data OCR cho Gemini đánh giá độ tin cậy
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
      const isShellCompany = backendData.is_shell_company || false;

      // Get category scores from Gemini response
      const categoryScores = backendData.details?.category_scores || {};

      // Transform backend response to frontend OSINTData format
      const osintData: OSINTData = {
        osint_score: osintScore,
        is_shell_company: isShellCompany,
        auto_reject: isShellCompany || osintScore < 30,
        reject_reason: isShellCompany ? 'Tài liệu có dấu hiệu giả mạo' : undefined,
        red_flags: backendData.red_flags || [],
        recommendation: backendData.details?.recommendation ||
          backendData.details?.analysis_summary ||
          (osintScore >= 60 ? 'Tài liệu hợp lệ' : 'Cần xem xét thêm'),
        // Map Gemini category scores to frontend checks format
        checks: {
          website: {
            score: categoryScores.completeness || Math.round(osintScore / 5),
            max_score: 20,
            status: (categoryScores.completeness || osintScore / 5) >= 15 ? 'passed' : (categoryScores.completeness || osintScore / 5) >= 10 ? 'warning' : 'failed',
            details: { status: 'Đầy đủ thông tin' },
          },
          linkedin: {
            score: categoryScores.format_validity || Math.round(osintScore / 5),
            max_score: 20,
            status: (categoryScores.format_validity || osintScore / 5) >= 15 ? 'passed' : (categoryScores.format_validity || osintScore / 5) >= 10 ? 'warning' : 'failed',
            details: { status: 'Định dạng hợp lệ' },
          },
          google_maps: {
            score: categoryScores.consistency || Math.round(osintScore / 5),
            max_score: 20,
            status: (categoryScores.consistency || osintScore / 5) >= 15 ? 'passed' : (categoryScores.consistency || osintScore / 5) >= 10 ? 'warning' : 'failed',
            details: { status: 'Dữ liệu nhất quán' },
          },
          press_news: {
            score: categoryScores.fraud_signs || Math.round(osintScore / 5),
            max_score: 20,
            status: (categoryScores.fraud_signs || osintScore / 5) >= 15 ? 'passed' : (categoryScores.fraud_signs || osintScore / 5) >= 10 ? 'warning' : 'failed',
            details: { status: 'Không có dấu hiệu giả mạo' },
          },
          social_media: {
            score: categoryScores.doc_specific || Math.round(osintScore / 5),
            max_score: 20,
            status: (categoryScores.doc_specific || osintScore / 5) >= 15 ? 'passed' : (categoryScores.doc_specific || osintScore / 5) >= 10 ? 'warning' : 'failed',
            details: { status: 'Đánh giá theo loại tài liệu' },
          },
        },
        business_age: {
          months: 24,
          status: osintScore >= 60 ? 'passed' : osintScore >= 40 ? 'warning' : 'rejected',
        },
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
