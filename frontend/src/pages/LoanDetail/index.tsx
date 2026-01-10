import React, { useState } from 'react';
import {
  Typography,
  Card,
  Descriptions,
  Timeline,
  Button,
  Modal,
  InputNumber,
  Alert,
  Row,
  Col,
  Tag,
  Statistic,
  message,
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusTag from '../../components/common/StatusTag';
import { TIER_CONFIG } from '../../config/constants';
import type { Loan, LoanStatus } from '../../types';

const { Title, Text, Paragraph } = Typography;

// Mock loan data
const mockLoan: Loan = {
  id: 'LOAN-001',
  borrower: '0x1234567890abcdef1234567890abcdef12345678',
  principal: 120000000,
  interest_rate: 5,
  due_date: '2024-03-15',
  status: 'Active',
  nft_token_id: '1',
  created_at: '2024-02-15',
  tier: 'A',
  currency: 'VND',
};

const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan] = useState<Loan>(mockLoan);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number>(0);
  const [isRepaying, setIsRepaying] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculate total owed (principal + interest)
  const daysHeld = Math.ceil(
    (new Date().getTime() - new Date(loan.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );
  const interestAmount = (loan.principal * loan.interest_rate * daysHeld) / (365 * 100);
  const totalOwed = loan.principal + interestAmount;

  // Check if overdue
  const isOverdue = new Date(loan.due_date) < new Date() && loan.status !== 'Repaid';
  const daysOverdue = isOverdue
    ? Math.ceil((new Date().getTime() - new Date(loan.due_date).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const tierConfig = TIER_CONFIG[loan.tier];

  const handleRepay = async () => {
    if (repayAmount <= 0) {
      message.error('Please enter a valid amount');
      return;
    }

    setIsRepaying(true);
    // Simulate repayment
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsRepaying(false);
    setIsRepayModalOpen(false);
    message.success('Repayment successful!');
  };

  const timelineItems = [
    {
      color: 'green',
      children: (
        <>
          <Text style={{ color: '#fff' }}>Loan Created</Text>
          <br />
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
            {loan.created_at}
          </Text>
        </>
      ),
    },
    {
      color: loan.status === 'Pending' ? 'blue' : 'green',
      children: (
        <>
          <Text style={{ color: '#fff' }}>Loan Activated</Text>
          <br />
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
            After 24h challenge period
          </Text>
        </>
      ),
    },
    {
      color: isOverdue ? 'red' : 'gray',
      dot: isOverdue ? <ExclamationCircleOutlined /> : <ClockCircleOutlined />,
      children: (
        <>
          <Text style={{ color: isOverdue ? '#f5222d' : '#fff' }}>Due Date</Text>
          <br />
          <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
            {loan.due_date}
          </Text>
        </>
      ),
    },
    {
      color: loan.status === 'Repaid' ? 'green' : 'gray',
      dot: loan.status === 'Repaid' ? <CheckCircleOutlined /> : undefined,
      children: (
        <>
          <Text style={{ color: loan.status === 'Repaid' ? '#52c41a' : 'rgba(255, 255, 255, 0.5)' }}>
            {loan.status === 'Repaid' ? 'Fully Repaid' : 'Awaiting Repayment'}
          </Text>
        </>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* Back Button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/dashboard')}
          style={{ marginBottom: 24 }}
        >
          Back to Dashboard
        </Button>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <Title level={2} style={{ color: '#fff', margin: 0 }}>
                Loan {loan.id}
              </Title>
              <StatusTag status={loan.status} />
            </Col>
            <Col>
              <Tag
                style={{
                  background: `${tierConfig.color}20`,
                  color: tierConfig.color,
                  border: `1px solid ${tierConfig.color}40`,
                  borderRadius: 12,
                  padding: '8px 20px',
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Tier {loan.tier}
              </Tag>
            </Col>
          </Row>
        </div>

        {/* Overdue Alert */}
        {isOverdue && (
          <Alert
            message="Loan Overdue"
            description={`This loan is ${daysOverdue} days overdue. Please repay as soon as possible to avoid further penalties.`}
            type="error"
            showIcon
            style={{ marginBottom: 24 }}
          />
        )}

        <Row gutter={24}>
          {/* Loan Details */}
          <Col span={16}>
            <Card
              title={<Text style={{ color: '#fff' }}>Loan Details</Text>}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
                marginBottom: 24,
              }}
              headStyle={{
                background: 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Descriptions
                column={2}
                labelStyle={{ color: 'rgba(255, 255, 255, 0.6)' }}
                contentStyle={{ color: '#fff' }}
              >
                <Descriptions.Item label="Loan ID">{loan.id}</Descriptions.Item>
                <Descriptions.Item label="NFT Token">#{loan.nft_token_id}</Descriptions.Item>
                <Descriptions.Item label="Principal">
                  <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                    {formatCurrency(loan.principal, loan.currency)}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Interest Rate">
                  {loan.interest_rate}% APR
                </Descriptions.Item>
                <Descriptions.Item label="Created">{loan.created_at}</Descriptions.Item>
                <Descriptions.Item label="Due Date">
                  <Text style={{ color: isOverdue ? '#f5222d' : '#faad14' }}>
                    {loan.due_date}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Days Held">{daysHeld} days</Descriptions.Item>
                <Descriptions.Item label="Accrued Interest">
                  <Text style={{ color: '#faad14' }}>
                    {formatCurrency(interestAmount, loan.currency)}
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Timeline */}
            <Card
              title={<Text style={{ color: '#fff' }}>Loan Timeline</Text>}
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 16,
              }}
              headStyle={{
                background: 'transparent',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Timeline items={timelineItems} />
            </Card>
          </Col>

          {/* Repay Card */}
          <Col span={8}>
            <Card
              style={{
                background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                border: '1px solid rgba(102, 126, 234, 0.3)',
                borderRadius: 16,
              }}
              bodyStyle={{ padding: 32 }}
            >
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <DollarOutlined style={{ fontSize: 48, color: '#667eea', marginBottom: 16 }} />
                <Title level={4} style={{ color: '#fff', margin: 0 }}>
                  Total Amount Owed
                </Title>
              </div>

              <Statistic
                value={totalOwed}
                formatter={(val) => formatCurrency(Number(val), loan.currency)}
                valueStyle={{
                  color: '#fff',
                  fontSize: 32,
                  fontWeight: 700,
                  textAlign: 'center',
                  display: 'block',
                }}
              />

              <div
                style={{
                  marginTop: 24,
                  padding: 16,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                }}
              >
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Principal</Text>
                  <Text style={{ color: '#fff' }}>{formatCurrency(loan.principal, loan.currency)}</Text>
                </Row>
                <Row justify="space-between">
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Interest</Text>
                  <Text style={{ color: '#faad14' }}>
                    +{formatCurrency(interestAmount, loan.currency)}
                  </Text>
                </Row>
              </div>

              {loan.status !== 'Repaid' && (
                <Button
                  type="primary"
                  size="large"
                  icon={<SendOutlined />}
                  onClick={() => {
                    setRepayAmount(totalOwed);
                    setIsRepayModalOpen(true);
                  }}
                  style={{
                    width: '100%',
                    height: 56,
                    marginTop: 24,
                    fontWeight: 600,
                    fontSize: 16,
                    borderRadius: 12,
                  }}
                >
                  Repay Loan
                </Button>
              )}
            </Card>
          </Col>
        </Row>

        {/* Repay Modal */}
        <Modal
          title="Repay Loan"
          open={isRepayModalOpen}
          onCancel={() => setIsRepayModalOpen(false)}
          footer={null}
          centered
        >
          <div style={{ padding: '24px 0' }}>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 24 }}>
              Enter the amount you want to repay. Full repayment will release your NFT collateral.
            </Paragraph>

            <div style={{ marginBottom: 24 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: 8 }}>
                Repay Amount ({loan.currency})
              </Text>
              <InputNumber
                value={repayAmount}
                onChange={(val) => setRepayAmount(val || 0)}
                min={0}
                max={totalOwed}
                style={{ width: '100%' }}
                formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                size="large"
              />
            </div>

            <Row justify="space-between" style={{ marginBottom: 16 }}>
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Total Owed</Text>
              <Text style={{ color: '#fff', fontWeight: 600 }}>
                {formatCurrency(totalOwed, loan.currency)}
              </Text>
            </Row>

            <Button
              type="primary"
              size="large"
              loading={isRepaying}
              onClick={handleRepay}
              style={{ width: '100%', height: 48, fontWeight: 600 }}
            >
              {isRepaying ? 'Processing...' : 'Confirm Repayment'}
            </Button>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default LoanDetail;
