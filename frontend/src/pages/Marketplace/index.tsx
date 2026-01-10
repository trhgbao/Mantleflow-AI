import React, { useState } from 'react';
import { Typography, Row, Col, Card, Button, Statistic, Tag, InputNumber, Modal, Empty } from 'antd';
import {
  ShopOutlined,
  ClockCircleOutlined,
  FireOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { TIER_CONFIG } from '../../config/constants';
import type { RiskTier } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { Countdown } = Statistic;

interface Auction {
  id: string;
  nft_token_id: string;
  face_value: number;
  current_price: number;
  starting_price: number;
  min_price: number;
  end_time: Date;
  tier: RiskTier;
  currency: string;
  bidders: number;
}

// Mock auction data
const mockAuctions: Auction[] = [
  {
    id: 'AUC-001',
    nft_token_id: '5',
    face_value: 200000000,
    current_price: 160000000,
    starting_price: 160000000,
    min_price: 40000000,
    end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    tier: 'B',
    currency: 'VND',
    bidders: 5,
  },
  {
    id: 'AUC-002',
    nft_token_id: '8',
    face_value: 100000000,
    current_price: 70000000,
    starting_price: 80000000,
    min_price: 20000000,
    end_time: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    tier: 'C',
    currency: 'VND',
    bidders: 3,
  },
  {
    id: 'AUC-003',
    nft_token_id: '12',
    face_value: 150000000,
    current_price: 135000000,
    starting_price: 120000000,
    min_price: 30000000,
    end_time: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    tier: 'A',
    currency: 'VND',
    bidders: 12,
  },
];

const Marketplace: React.FC = () => {
  const [auctions] = useState<Auction[]>(mockAuctions);
  const [selectedAuction, setSelectedAuction] = useState<Auction | null>(null);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isBidModalOpen, setIsBidModalOpen] = useState(false);

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleBid = (auction: Auction) => {
    setSelectedAuction(auction);
    setBidAmount(auction.current_price);
    setIsBidModalOpen(true);
  };

  const submitBid = () => {
    // Simulate bid submission
    setIsBidModalOpen(false);
    // Show success message
  };

  const getDiscountPercentage = (current: number, face: number) => {
    return Math.round(((face - current) / face) * 100);
  };

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Row justify="space-between" align="middle">
            <Col>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ShopOutlined style={{ fontSize: 28, color: '#fff' }} />
                </div>
                <div>
                  <Title level={2} style={{ color: '#fff', margin: 0 }}>
                    NFT Marketplace
                  </Title>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Buy defaulted invoice NFTs at a discount via Dutch auction
                  </Text>
                </div>
              </div>
            </Col>
            <Col>
              <Tag color="orange" style={{ padding: '8px 16px', fontSize: 14 }}>
                <FireOutlined style={{ marginRight: 8 }} />
                {auctions.length} Active Auctions
              </Tag>
            </Col>
          </Row>
        </div>

        {/* Auction Grid */}
        {auctions.length === 0 ? (
          <Empty
            description={
              <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                No active auctions at the moment
              </Text>
            }
          />
        ) : (
          <Row gutter={[24, 24]}>
            {auctions.map((auction) => {
              const tierConfig = TIER_CONFIG[auction.tier];
              const discount = getDiscountPercentage(auction.current_price, auction.face_value);

              return (
                <Col xs={24} sm={12} lg={8} key={auction.id}>
                  <Card
                    hoverable
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 20,
                      overflow: 'hidden',
                    }}
                    bodyStyle={{ padding: 0 }}
                  >
                    {/* NFT Image Placeholder */}
                    <div
                      style={{
                        height: 200,
                        background: `linear-gradient(135deg, ${tierConfig.color}30 0%, ${tierConfig.color}10 100%)`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 64,
                          fontWeight: 800,
                          color: tierConfig.color,
                          opacity: 0.5,
                        }}
                      >
                        #{auction.nft_token_id}
                      </Text>
                      <Tag
                        style={{
                          position: 'absolute',
                          top: 16,
                          right: 16,
                          background: `${tierConfig.color}20`,
                          color: tierConfig.color,
                          border: `1px solid ${tierConfig.color}40`,
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        Tier {auction.tier}
                      </Tag>
                      <Tag
                        color="red"
                        style={{
                          position: 'absolute',
                          top: 16,
                          left: 16,
                          borderRadius: 8,
                          fontWeight: 600,
                        }}
                      >
                        {discount}% OFF
                      </Tag>
                    </div>

                    {/* Content */}
                    <div style={{ padding: 24 }}>
                      {/* Face Value */}
                      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Face Value</Text>
                        <Text
                          style={{
                            color: '#fff',
                            fontSize: 18,
                            fontWeight: 600,
                            textDecoration: 'line-through',
                            opacity: 0.5,
                          }}
                        >
                          {formatCurrency(auction.face_value, auction.currency)}
                        </Text>
                      </Row>

                      {/* Current Price */}
                      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Current Price</Text>
                        <Text
                          style={{
                            color: '#52c41a',
                            fontSize: 24,
                            fontWeight: 700,
                          }}
                        >
                          {formatCurrency(auction.current_price, auction.currency)}
                        </Text>
                      </Row>

                      {/* Countdown */}
                      <div
                        style={{
                          padding: 16,
                          background: 'rgba(255, 255, 255, 0.05)',
                          borderRadius: 12,
                          marginBottom: 16,
                        }}
                      >
                        <Row align="middle" justify="space-between">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <ClockCircleOutlined style={{ color: '#faad14' }} />
                            <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Ends in</Text>
                          </div>
                          <Countdown
                            value={auction.end_time.getTime()}
                            format="D[d] H[h] m[m]"
                            valueStyle={{
                              color: '#fff',
                              fontSize: 16,
                              fontWeight: 600,
                            }}
                          />
                        </Row>
                      </div>

                      {/* Bidders */}
                      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                        <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Bidders</Text>
                        <Tag color="blue">{auction.bidders} bidders</Tag>
                      </Row>

                      {/* Bid Button */}
                      <Button
                        type="primary"
                        size="large"
                        icon={<DollarOutlined />}
                        onClick={() => handleBid(auction)}
                        style={{
                          width: '100%',
                          height: 48,
                          borderRadius: 12,
                          fontWeight: 600,
                        }}
                      >
                        Place Bid
                      </Button>
                    </div>
                  </Card>
                </Col>
              );
            })}
          </Row>
        )}

        {/* Bid Modal */}
        <Modal
          title={`Bid on NFT #${selectedAuction?.nft_token_id}`}
          open={isBidModalOpen}
          onCancel={() => setIsBidModalOpen(false)}
          footer={null}
          centered
        >
          {selectedAuction && (
            <div style={{ padding: '24px 0' }}>
              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 24 }}>
                Enter your bid amount. Price decreases over time in a Dutch auction.
              </Paragraph>

              <div
                style={{
                  marginBottom: 24,
                  padding: 16,
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                }}
              >
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Face Value</Text>
                  <Text style={{ color: '#fff' }}>
                    {formatCurrency(selectedAuction.face_value, selectedAuction.currency)}
                  </Text>
                </Row>
                <Row justify="space-between" style={{ marginBottom: 8 }}>
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Current Price</Text>
                  <Text style={{ color: '#52c41a', fontWeight: 600 }}>
                    {formatCurrency(selectedAuction.current_price, selectedAuction.currency)}
                  </Text>
                </Row>
                <Row justify="space-between">
                  <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>Min Price</Text>
                  <Text style={{ color: '#faad14' }}>
                    {formatCurrency(selectedAuction.min_price, selectedAuction.currency)}
                  </Text>
                </Row>
              </div>

              <div style={{ marginBottom: 24 }}>
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: 8 }}>
                  Your Bid ({selectedAuction.currency})
                </Text>
                <InputNumber
                  value={bidAmount}
                  onChange={(val) => setBidAmount(val || 0)}
                  min={selectedAuction.min_price}
                  style={{ width: '100%' }}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => Number(value?.replace(/,/g, '') || 0)}
                  size="large"
                />
              </div>

              <Button
                type="primary"
                size="large"
                onClick={submitBid}
                style={{ width: '100%', height: 48, fontWeight: 600 }}
              >
                Confirm Bid
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
