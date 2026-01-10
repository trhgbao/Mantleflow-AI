import { create } from 'zustand';
import type { ExtractedInvoice, RiskScoreData, OSINTData, Loan } from '../types';

interface AppState {
  // Wallet state
  address: string | null;
  isConnected: boolean;
  chainId: number | null;

  // Current flow state
  currentInvoice: ExtractedInvoice | null;
  riskScore: RiskScoreData | null;
  osintResult: OSINTData | null;

  // Loans
  loans: Loan[];
  isLoadingLoans: boolean;

  // UI state
  sidebarCollapsed: boolean;

  // Actions
  setWallet: (address: string | null, chainId: number | null) => void;
  setConnected: (connected: boolean) => void;
  setInvoice: (invoice: ExtractedInvoice | null) => void;
  setRiskScore: (score: RiskScoreData | null) => void;
  setOsintResult: (result: OSINTData | null) => void;
  setLoans: (loans: Loan[]) => void;
  setLoadingLoans: (loading: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  resetFlow: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  address: null,
  isConnected: false,
  chainId: null,
  currentInvoice: null,
  riskScore: null,
  osintResult: null,
  loans: [],
  isLoadingLoans: false,
  sidebarCollapsed: false,

  // Actions
  setWallet: (address, chainId) => set({ address, chainId }),
  setConnected: (connected) => set({ isConnected: connected }),
  setInvoice: (invoice) => set({ currentInvoice: invoice }),
  setRiskScore: (score) => set({ riskScore: score }),
  setOsintResult: (result) => set({ osintResult: result }),
  setLoans: (loans) => set({ loans }),
  setLoadingLoans: (loading) => set({ isLoadingLoans: loading }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  resetFlow: () => set({
    currentInvoice: null,
    riskScore: null,
    osintResult: null,
  }),
}));
