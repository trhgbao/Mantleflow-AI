import React from 'react';
import { Card, Descriptions, Table, Typography, Tag, Divider } from 'antd';
import {
  FileTextOutlined,
  BankOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import type { ExtractedInvoice } from '../../types';

const { Title, Text } = Typography;

interface InvoiceDataDisplayProps {
  data: ExtractedInvoice;
}

const InvoiceDataDisplay: React.FC<InvoiceDataDisplayProps> = ({ data }) => {
  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
    }).format(amount);
  };

  const itemColumns = [
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Qty',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Unit Price',
      dataIndex: 'unit_price',
      key: 'unit_price',
      width: 150,
      render: (val: number) => formatCurrency(val, data.currency),
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 150,
      render: (val: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          {formatCurrency(val, data.currency)}
        </Text>
      ),
    },
  ];

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 16,
      }}
      bodyStyle={{ padding: 24 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <FileTextOutlined style={{ fontSize: 24, color: '#fff' }} />
        </div>
        <div>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Invoice #{data.invoice_number}
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Extracted with {(data.confidence * 100).toFixed(0)}% confidence
          </Text>
        </div>
        <Tag
          color="success"
          style={{ marginLeft: 'auto', borderRadius: 20, padding: '4px 16px' }}
        >
          <DollarOutlined style={{ marginRight: 4 }} />
          {formatCurrency(data.amount, data.currency)}
        </Tag>
      </div>

      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Main Info */}
      <Descriptions
        column={{ xs: 1, sm: 2 }}
        labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
        contentStyle={{ color: '#fff' }}
      >
        <Descriptions.Item label={<><CalendarOutlined /> Issue Date</>}>
          {data.issue_date || 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label={<><CalendarOutlined /> Due Date</>}>
          <Text style={{ color: '#faad14' }}>{data.due_date || 'N/A'}</Text>
        </Descriptions.Item>
      </Descriptions>

      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Debtor Info */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ color: '#fff', marginBottom: 12 }}>
          <BankOutlined style={{ marginRight: 8 }} />
          Debtor Information
        </Title>
        <Descriptions
          column={{ xs: 1, sm: 2 }}
          size="small"
          labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
          contentStyle={{ color: '#fff' }}
        >
          <Descriptions.Item label="Company Name">
            {data.debtor.name}
          </Descriptions.Item>
          <Descriptions.Item label="Tax ID">
            {data.debtor.tax_id || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {data.debtor.address || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Email">
            {data.debtor.email || 'N/A'}
          </Descriptions.Item>
          <Descriptions.Item label="Phone">
            {data.debtor.phone || 'N/A'}
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* Line Items */}
      {data.items.length > 0 && (
        <>
          <Title level={5} style={{ color: '#fff', marginBottom: 12 }}>
            Line Items
          </Title>
          <Table
            dataSource={data.items.map((item, index) => ({ ...item, key: index }))}
            columns={itemColumns}
            pagination={false}
            size="small"
            style={{
              background: 'transparent',
            }}
          />
        </>
      )}
    </Card>
  );
};

export default InvoiceDataDisplay;
