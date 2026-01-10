import React from 'react';
import { Tag } from 'antd';
import type { LoanStatus } from '../../types';
import { STATUS_CONFIG } from '../../config/constants';

interface StatusTagProps {
  status: LoanStatus;
}

const StatusTag: React.FC<StatusTagProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] || { color: 'default', label: status };

  return (
    <Tag
      color={config.color}
      style={{
        borderRadius: 20,
        padding: '2px 12px',
        fontWeight: 500,
      }}
    >
      {config.label}
    </Tag>
  );
};

export default StatusTag;
