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
  INVOICE_NFT: '0x312a7393Ce4ccfdbcB80f19B06a529b547D2442C',
  LENDING_POOL: '0xD74f2ECf73606313Fc5A2af3A3B53c713Ed7abBD',
  ESCROW: '0x44C09902e70bC79006fa3649F387ee2b37b5a667',
  PAYMENT_ORACLE: '0x6A20797d025f6137c8f0018274F10Bb685059e72',
  LIQUIDATOR: '0xf333D1A050FdA2427BAe40B2f52E38C43e9CbdDA',
  MFL_TOKEN: '0x5EfDb4EEf2d7Bb9884C01cc3600E967Ed92A7AF5',
  STAKING: '0x3c51F786018A153b24DcA32000361610da55E4bd',
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

// OSINT Credibility Criteria (4 tiêu chí đánh giá)
export const CREDIBILITY_CRITERIA = {
  completeness: {
    key: 'completeness',
    label: 'Tính đầy đủ',
    description: 'Thông tin có đủ các trường quan trọng không?',
    icon: 'FileTextOutlined',
    max_score: 25,
  },
  validity: {
    key: 'validity',
    label: 'Tính hợp lệ',
    description: 'Format dữ liệu có đúng chuẩn không?',
    icon: 'CheckCircleOutlined',
    max_score: 25,
  },
  consistency: {
    key: 'consistency',
    label: 'Tính nhất quán',
    description: 'Thông tin có mâu thuẫn nhau không?',
    icon: 'SyncOutlined',
    max_score: 25,
  },
  no_fraud_signs: {
    key: 'no_fraud_signs',
    label: 'Không có dấu hiệu gian lận',
    description: 'Có dấu hiệu giả mạo, bất thường không?',
    icon: 'SafetyCertificateOutlined',
    max_score: 25,
  },
};

// Credibility Tiers
export const CREDIBILITY_TIERS = {
  A: { range: [80, 100], label: 'Rất đáng tin cậy', color: '#52c41a' },
  B: { range: [60, 79], label: 'Đáng tin cậy', color: '#1890ff' },
  C: { range: [40, 59], label: 'Cần xem xét', color: '#faad14' },
  D: { range: [0, 39], label: 'Không đáng tin cậy', color: '#f5222d' },
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
