// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

// Chain Configuration (Mantle Sepolia)
export const CHAIN_ID = 5003;
export const CHAIN_NAME = 'Mantle Sepolia Testnet';
export const RPC_URL = 'https://rpc.sepolia.mantle.xyz';
export const EXPLORER_URL = 'https://explorer.sepolia.mantle.xyz';

// Contract Addresses (Mantle Sepolia Testnet)
export const CONTRACTS = {
  INVOICE_NFT: '0x58bd279e9fe238d7d078d75021da60b991606680',
  LENDING_POOL: '0x1710ef07b4bae140257634e4452760c06fed93fb',
  ESCROW: '0x86d4dbf4af9f9e9ddb44cc7b14e145bd8c93eb07',
  PAYMENT_ORACLE: '0xa8850959cc380db7ce5f0fc8e985c830cef04e44',
  LIQUIDATOR: '0x24ce976c9fd23464f1f4e81e90ba940b2d01195b',
  MFL_TOKEN: '0x0000000000000000000000000000000000000000',
  STAKING: '0x0000000000000000000000000000000000000000',
};

// Risk Tier Configuration
export const TIER_CONFIG = {
  A: { color: '#52c41a', ltv: 80, interest: 5, label: 'Excellent' },
  B: { color: '#faad14', ltv: 60, interest: 8, label: 'Good' },
  C: { color: '#fa8c16', ltv: 40, interest: 12, label: 'Fair' },
  D: { color: '#f5222d', ltv: 0, interest: 0, label: 'Rejected' },
};

// Loan Status Configuration
export const STATUS_CONFIG = {
  Pending: { color: 'blue', label: 'Pending' },
  Active: { color: 'green', label: 'Active' },
  Overdue: { color: 'gold', label: 'Overdue' },
  Defaulted: { color: 'red', label: 'Defaulted' },
  Liquidated: { color: 'purple', label: 'Liquidated' },
  Repaid: { color: 'default', label: 'Repaid' },
  Challenged: { color: 'orange', label: 'Challenged' },
};

// OSINT Check Names
export const OSINT_CHECK_NAMES = {
  website: 'Website',
  linkedin: 'LinkedIn',
  google_maps: 'Google Maps',
  press_news: 'Press & News',
  social_media: 'Social Media',
};

// Supported File Types
export const SUPPORTED_FILE_TYPES = [
  '.pdf',
  '.docx',
  '.xlsx',
  '.png',
  '.jpg',
  '.jpeg',
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
