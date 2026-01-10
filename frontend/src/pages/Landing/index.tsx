import React from 'react';
import { Layout, Typography, Button, Row, Col, Card, Steps, Space } from 'antd';
import {
  WalletOutlined,
  RobotOutlined,
  ThunderboltOutlined,
  SafetyOutlined,
  ArrowRightOutlined,
  CheckCircleOutlined,
  UploadOutlined,
  FileSearchOutlined,
  DollarOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAccount, useConnect } from 'wagmi';
import Header from '../../components/layout/Header';

const { Content, Footer } = Layout;
const { Title, Text, Paragraph } = Typography;

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();

  const handleGetStarted = () => {
    if (isConnected) {
      navigate('/upload');
    } else {
      const connector = connectors[0];
      if (connector) {
        connect({ connector });
      }
    }
  };

  const features = [
    {
      icon: <RobotOutlined style={{ fontSize: 32 }} />,
      title: 'AI Risk Scoring',
      description: 'Advanced 8-feature AI analysis with OSINT verification to detect shell companies and assess creditworthiness.',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 32 }} />,
      title: 'Instant Liquidity',
      description: 'Convert your invoices to NFTs and get instant loans with competitive LTV ratios up to 80%.',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    },
    {
      icon: <SafetyOutlined style={{ fontSize: 32 }} />,
      title: 'Auto Collection',
      description: 'AI-powered 4-level escalation system automatically handles payment collection and reminders.',
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    },
  ];

  const steps = [
    {
      icon: <UploadOutlined />,
      title: 'Upload Invoice',
      description: 'Upload your invoice in PDF, Word, Excel, or image format',
    },
    {
      icon: <FileSearchOutlined />,
      title: 'AI Analysis',
      description: 'Our AI extracts data, scores risk, and verifies debtor',
    },
    {
      icon: <DollarOutlined />,
      title: 'Get Loan',
      description: 'Receive instant loan based on your tier (A/B/C)',
    },
    {
      icon: <SyncOutlined />,
      title: 'Auto Repay',
      description: 'AI agent handles collection, you repay and unlock NFT',
    },
  ];

  const stats = [
    { value: '$2.5M+', label: 'Total Volume' },
    { value: '1,200+', label: 'Invoices Processed' },
    { value: '95%', label: 'Repayment Rate' },
    { value: '<5min', label: 'Avg. Processing Time' },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f0f23' }}>
      <Header />

      <Content style={{ marginTop: 72 }}>
        {/* Hero Section */}
        <section
          style={{
            padding: '120px 48px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background Effects */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '100%',
              height: '100%',
              background: 'radial-gradient(ellipse at 50% 0%, rgba(102, 126, 234, 0.15) 0%, transparent 60%)',
              pointerEvents: 'none',
            }}
          />

          <div style={{ maxWidth: 1200, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
            <div
              style={{
                display: 'inline-block',
                padding: '8px 24px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: 30,
                marginBottom: 24,
              }}
            >
              <Text style={{ color: '#667eea', fontWeight: 500 }}>
                Powered by Mantle Network
              </Text>
            </div>

            <Title
              style={{
                fontSize: 64,
                fontWeight: 800,
                color: '#fff',
                marginBottom: 24,
                lineHeight: 1.1,
              }}
            >
              Unlock Your Invoice
              <br />
              <span
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Value Instantly
              </span>
            </Title>

            <Paragraph
              style={{
                fontSize: 20,
                color: 'rgba(255, 255, 255, 0.7)',
                maxWidth: 600,
                margin: '0 auto 40px',
              }}
            >
              AI-powered invoice factoring on blockchain. Get instant liquidity by
              tokenizing your invoices with transparent risk scoring and automated collection.
            </Paragraph>

            <Space size={16}>
              <Button
                type="primary"
                size="large"
                icon={isConnected ? <ArrowRightOutlined /> : <WalletOutlined />}
                onClick={handleGetStarted}
                style={{
                  height: 56,
                  padding: '0 40px',
                  fontSize: 18,
                  fontWeight: 600,
                  borderRadius: 12,
                }}
              >
                {isConnected ? 'Start Uploading' : 'Connect Wallet'}
              </Button>
              <Button
                size="large"
                onClick={() => navigate('/marketplace')}
                style={{
                  height: 56,
                  padding: '0 40px',
                  fontSize: 18,
                  fontWeight: 600,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                }}
              >
                View Marketplace
              </Button>
            </Space>

            {/* Stats */}
            <Row gutter={48} style={{ marginTop: 80 }}>
              {stats.map((stat, index) => (
                <Col span={6} key={index}>
                  <div>
                    <div
                      style={{
                        fontSize: 40,
                        fontWeight: 700,
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      {stat.value}
                    </div>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>{stat.label}</Text>
                  </div>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* Features Section */}
        <section style={{ padding: '80px 48px', background: 'rgba(0, 0, 0, 0.2)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}>
              Why Choose MantleFlow?
            </Title>

            <Row gutter={32}>
              {features.map((feature, index) => (
                <Col span={8} key={index}>
                  <Card
                    hoverable
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 20,
                      height: '100%',
                    }}
                    bodyStyle={{ padding: 32 }}
                  >
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 18,
                        background: feature.gradient,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#fff',
                        marginBottom: 24,
                        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
                      }}
                    >
                      {feature.icon}
                    </div>
                    <Title level={4} style={{ color: '#fff', marginBottom: 12 }}>
                      {feature.title}
                    </Title>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 15 }}>
                      {feature.description}
                    </Text>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* How It Works Section */}
        <section style={{ padding: '80px 48px' }}>
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', color: '#fff', marginBottom: 48 }}>
              How It Works
            </Title>

            <Steps
              direction="horizontal"
              current={-1}
              items={steps.map((step, index) => ({
                title: (
                  <Text style={{ color: '#fff', fontWeight: 600 }}>{step.title}</Text>
                ),
                description: (
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: 13 }}>
                    {step.description}
                  </Text>
                ),
                icon: (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      fontSize: 20,
                    }}
                  >
                    {step.icon}
                  </div>
                ),
              }))}
            />
          </div>
        </section>

        {/* Risk Tiers Section */}
        <section style={{ padding: '80px 48px', background: 'rgba(0, 0, 0, 0.2)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Title level={2} style={{ textAlign: 'center', color: '#fff', marginBottom: 16 }}>
              Transparent Risk Tiers
            </Title>
            <Paragraph
              style={{
                textAlign: 'center',
                color: 'rgba(255, 255, 255, 0.7)',
                marginBottom: 48,
                maxWidth: 600,
                margin: '0 auto 48px',
              }}
            >
              Our AI analyzes 8 risk factors including OSINT verification to assign fair,
              transparent loan terms
            </Paragraph>

            <Row gutter={24}>
              {[
                { tier: 'A', score: '80-100', ltv: '80%', apr: '5%', color: '#52c41a', label: 'Excellent' },
                { tier: 'B', score: '50-79', ltv: '60%', apr: '8%', color: '#faad14', label: 'Good' },
                { tier: 'C', score: '30-49', ltv: '40%', apr: '12%', color: '#fa8c16', label: 'Fair' },
                { tier: 'D', score: '0-29', ltv: '0%', apr: 'Rejected', color: '#f5222d', label: 'High Risk' },
              ].map((tier) => (
                <Col span={6} key={tier.tier}>
                  <Card
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: `1px solid ${tier.color}40`,
                      borderRadius: 16,
                      textAlign: 'center',
                    }}
                    bodyStyle={{ padding: 32 }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 16,
                        background: `${tier.color}20`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                      }}
                    >
                      <span style={{ fontSize: 32, fontWeight: 700, color: tier.color }}>
                        {tier.tier}
                      </span>
                    </div>
                    <Text style={{ color: tier.color, fontWeight: 600 }}>{tier.label}</Text>
                    <div style={{ marginTop: 16 }}>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                        Score: {tier.score}
                      </Text>
                      <Text style={{ color: '#fff', fontSize: 24, fontWeight: 700, display: 'block' }}>
                        {tier.ltv} LTV
                      </Text>
                      <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block' }}>
                        {tier.apr} APR
                      </Text>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '120px 48px', textAlign: 'center' }}>
          <div style={{ maxWidth: 800, margin: '0 auto' }}>
            <Title level={2} style={{ color: '#fff', marginBottom: 24 }}>
              Ready to Unlock Your Invoice Value?
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 18, marginBottom: 40 }}>
              Join hundreds of businesses already using MantleFlow for instant invoice financing
            </Paragraph>
            <Button
              type="primary"
              size="large"
              icon={<ArrowRightOutlined />}
              onClick={handleGetStarted}
              style={{
                height: 64,
                padding: '0 48px',
                fontSize: 20,
                fontWeight: 600,
                borderRadius: 16,
              }}
            >
              Get Started Now
            </Button>
          </div>
        </section>
      </Content>

      {/* Footer */}
      <Footer
        style={{
          background: '#080816',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '48px',
          textAlign: 'center',
        }}
      >
        <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          MantleFlow - Built for Mantle Network Hackathon 2024
        </Text>
      </Footer>
    </Layout>
  );
};

export default Landing;
