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
    const response = await aiApi.post<ApiResponse<RiskScoreData>>(
      '/ai/risk-score',
      data
    );
    return response.data;
  },

  /**
   * Check company OSINT
   */
  checkOSINT: async (data: {
    company_name: string;
    tax_id?: string;
    address?: string;
    website?: string;
    registration_date?: string;
  }): Promise<ApiResponse<OSINTData>> => {
    const response = await aiApi.post<ApiResponse<OSINTData>>(
      '/ai/osint',
      data
    );
    return response.data;
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
