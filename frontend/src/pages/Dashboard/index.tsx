import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card, Table, Button, Statistic, Tag, Space, Empty } from 'antd';
import {
  WalletOutlined,
  FileTextOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  EyeOutlined,
  ReloadOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import type { ColumnsType } from 'antd/es/table';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusTag from '../../components/common/StatusTag';
import type { Loan, LoanStatus, RiskTier } from '../../types';
import { TIER_CONFIG } from '../../config/constants';

const { Title, Text } = Typography;

// Mock data for demo
const mockLoans: Loan[] = [
  {
    id: 'LOAN-001',
    borrower: '0x1234...5678',
    principal: 120000000,
    interest_rate: 5,
    due_date: '2024-03-15',
    status: 'Active',
    nft_token_id: '1',
    created_at: '2024-02-15',
    tier: 'A',
    currency: 'VND',
  },
  {
    id: 'LOAN-002',
    borrower: '0x1234...5678',
    principal: 80000000,
    interest_rate: 8,
    due_date: '2024-02-28',
    status: 'Overdue',
    nft_token_id: '2',
    created_at: '2024-01-28',
    tier: 'B',
    currency: 'VND',
  },
  {
    id: 'LOAN-003',
    borrower: '0x1234...5678',
    principal: 50000000,
    interest_rate: 5,
    due_date: '2024-01-30',
    status: 'Repaid',
    nft_token_id: '3',
    created_at: '2024-01-01',
    tier: 'A',
    currency: 'VND',
  },
];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Simulate loading loans
    setLoading(true);
    setTimeout(() => {
      setLoans(mockLoans);
      setLoading(false);
    }, 500);
  }, []);

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = [
    {
      title: 'Wallet Balance',
      value: 45000,
      prefix: '$',
      icon: <WalletOutlined />,
      color: '#667eea',
      trend: { value: 12.5, isUp: true },
    },
    {
      title: 'Active Loans',
      value: loans.filter((l) => l.status === 'Active').length,
      icon: <FileTextOutlined />,
      color: '#52c41a',
    },
    {
      title: 'Total Borrowed',
      value: loans.reduce((sum, l) => sum + l.principal, 0),
      formatter: (val: number) => formatCurrency(val),
      icon: <DollarOutlined />,
      color: '#faad14',
    },
    {
      title: 'Total Repaid',
      value: loans.filter((l) => l.status === 'Repaid').reduce((sum, l) => sum + l.principal, 0),
      formatter: (val: number) => formatCurrency(val),
      icon: <CheckCircleOutlined />,
      color: '#52c41a',
      trend: { value: 8.2, isUp: true },
    },
  ];

  const columns: ColumnsType<Loan> = [
    {
      title: 'Loan ID',
      dataIndex: 'id',
      key: 'id',
      render: (id: string) => (
        <Text style={{ color: '#667eea', fontWeight: 500 }}>{id}</Text>
      ),
    },
    {
      title: 'Principal',
      dataIndex: 'principal',
      key: 'principal',
      render: (val: number, record: Loan) => (
        <Text style={{ color: '#fff', fontWeight: 600 }}>
          {formatCurrency(val, record.currency)}
        </Text>
      ),
      sorter: (a, b) => a.principal - b.principal,
    },
    {
      title: 'Interest',
      dataIndex: 'interest_rate',
      key: 'interest_rate',
      render: (val: number) => <Text style={{ color: '#faad14' }}>{val}% APR</Text>,
    },
    {
      title: 'Tier',
      dataIndex: 'tier',
      key: 'tier',
      render: (tier: RiskTier) => {
        const config = TIER_CONFIG[tier];
        return (
          <Tag
            style={{
              background: `${config.color}20`,
              color: config.color,
              border: `1px solid ${config.color}40`,
              borderRadius: 12,
              fontWeight: 600,
            }}
          >
            Tier {tier}
          </Tag>
        );
      },
      filters: [
        { text: 'Tier A', value: 'A' },
        { text: 'Tier B', value: 'B' },
        { text: 'Tier C', value: 'C' },
      ],
      onFilter: (value, record) => record.tier === value,
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date: string) => {
        const dueDate = new Date(date);
        const isOverdue = dueDate < new Date();
        return (
          <Text style={{ color: isOverdue ? '#f5222d' : 'rgba(255, 255, 255, 0.7)' }}>
            {date}
          </Text>
        );
      },
      sorter: (a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime(),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: LoanStatus) => <StatusTag status={status} />,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Active', value: 'Active' },
        { text: 'Overdue', value: 'Overdue' },
        { text: 'Repaid', value: 'Repaid' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: Loan) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/loans/${record.id}`)}
            style={{ color: '#667eea' }}
          >
            View
          </Button>
          {record.status === 'Active' && (
            <Button type="primary" size="small" onClick={() => navigate(`/loans/${record.id}`)}>
              Repay
            </Button>
          )}
        </Space>
      ),
    },
  ];

  if (!isConnected) {
    return (
      <DashboardLayout>
        <div style={{ textAlign: 'center', padding: '120px 0' }}>
          <Empty
            description={
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Please connect your wallet to view dashboard
              </Text>
            }
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={2} style={{ color: '#fff', margin: 0 }}>
              Dashboard
            </Title>
            <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              Welcome back! Here's your lending overview.
            </Text>
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={() => setLoans([...mockLoans])}>
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/upload')}
              >
                New Loan
              </Button>
            </Space>
          </Col>
        </Row>
      </div>

      {/* Stats */}
      <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
              }}
              bodyStyle={{ padding: 24 }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: `${stat.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: stat.color,
                    fontSize: 22,
                  }}
                >
                  {stat.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
                    {stat.title}
                  </Text>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                    <Statistic
                      value={stat.value}
                      prefix={stat.prefix}
                      formatter={stat.formatter as any}
                      valueStyle={{
                        color: '#fff',
                        fontSize: 28,
                        fontWeight: 700,
                      }}
                    />
                    {stat.trend && (
                      <Tag
                        color={stat.trend.isUp ? 'success' : 'error'}
                        style={{ borderRadius: 12 }}
                      >
                        {stat.trend.isUp ? <RiseOutlined /> : <FallOutlined />}
                        {stat.trend.value}%
                      </Tag>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Loans Table */}
      <Card
        title={
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            My Loans
          </Title>
        }
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 16,
        }}
        headStyle={{
          background: 'transparent',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
        bodyStyle={{ padding: 0 }}
      >
        <Table
          dataSource={loans}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} loans`,
          }}
          locale={{
            emptyText: (
              <Empty
                description={
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    No loans yet. Upload an invoice to get started!
                  </Text>
                }
              >
                <Button type="primary" onClick={() => navigate('/upload')}>
                  Upload Invoice
                </Button>
              </Empty>
            ),
          }}
        />
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;
