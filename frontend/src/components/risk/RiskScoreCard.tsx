import React from 'react';
import { Card, Progress, Tag, Statistic, Row, Col, Tooltip, Typography } from 'antd';
import {
  TrophyOutlined,
  RiseOutlined,
  PercentageOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { RiskScoreData, RiskTier } from '../../types';
import { TIER_CONFIG } from '../../config/constants';

const { Text, Title } = Typography;

interface RiskScoreCardProps {
  data: RiskScoreData;
  showBreakdown?: boolean;
}

const RiskScoreCard: React.FC<RiskScoreCardProps> = ({ data, showBreakdown = true }) => {
  const tierConfig = TIER_CONFIG[data.tier];
  const isRejected = data.tier === 'D' || !data.is_approved;

  const getProgressStatus = (tier: RiskTier) => {
    if (tier === 'A') return 'success';
    if (tier === 'D') return 'exception';
    return 'active';
  };

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isRejected ? 'rgba(245, 34, 45, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 16,
      }}
      bodyStyle={{ padding: 32 }}
    >
      <Row gutter={[32, 24]} align="middle">
        {/* Score Circle */}
        <Col xs={24} md={8} style={{ textAlign: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Progress
              type="circle"
              percent={data.total_score}
              size={180}
              strokeWidth={8}
              strokeColor={{
                '0%': tierConfig.color,
                '100%': tierConfig.color + '80',
              }}
              trailColor="rgba(255, 255, 255, 0.1)"
              format={(percent) => (
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 700,
                      color: tierConfig.color,
                      lineHeight: 1,
                    }}
                  >
                    {percent?.toFixed(0)}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: 'rgba(255, 255, 255, 0.5)',
                      marginTop: 4,
                    }}
                  >
                    Risk Score
                  </div>
                </div>
              )}
            />
          </div>

          {/* Tier Badge */}
          <div style={{ marginTop: 16 }}>
            <Tag
              style={{
                background: `${tierConfig.color}20`,
                color: tierConfig.color,
                border: `1px solid ${tierConfig.color}40`,
                borderRadius: 20,
                padding: '6px 20px',
                fontSize: 16,
                fontWeight: 600,
              }}
            >
              <TrophyOutlined style={{ marginRight: 8 }} />
              Tier {data.tier} - {tierConfig.label}
            </Tag>
          </div>
        </Col>

        {/* Stats */}
        <Col xs={24} md={16}>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      <RiseOutlined style={{ marginRight: 8 }} />
                      Loan-to-Value
                    </span>
                  }
                  value={data.ltv}
                  suffix="%"
                  valueStyle={{
                    color: isRejected ? '#f5222d' : '#52c41a',
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                />
              </div>
            </Col>
            <Col span={12}>
              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 12,
                  padding: 20,
                  textAlign: 'center',
                }}
              >
                <Statistic
                  title={
                    <span style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      <PercentageOutlined style={{ marginRight: 8 }} />
                      Interest Rate
                    </span>
                  }
                  value={data.interest_rate}
                  suffix="% APR"
                  valueStyle={{
                    color: '#faad14',
                    fontSize: 36,
                    fontWeight: 700,
                  }}
                />
              </div>
            </Col>
          </Row>

          {/* Recommendation */}
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: isRejected
                ? 'rgba(245, 34, 45, 0.1)'
                : 'rgba(82, 196, 26, 0.1)',
              borderRadius: 12,
              border: `1px solid ${isRejected ? 'rgba(245, 34, 45, 0.2)' : 'rgba(82, 196, 26, 0.2)'}`,
            }}
          >
            <Text style={{ color: isRejected ? '#f5222d' : '#52c41a' }}>
              <InfoCircleOutlined style={{ marginRight: 8 }} />
              {data.recommendation}
            </Text>
          </div>
        </Col>
      </Row>

      {/* Score Breakdown */}
      {showBreakdown && (
        <div style={{ marginTop: 32 }}>
          <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
            Score Breakdown
          </Title>
          <Row gutter={[16, 12]}>
            {Object.entries(data.breakdown).map(([key, value]) => (
              <Col span={12} key={key}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    borderRadius: 8,
                  }}
                >
                  <Tooltip title={value.description}>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 13 }}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Text>
                  </Tooltip>
                  <div>
                    <Text style={{ color: '#fff', fontWeight: 600 }}>
                      {value.score.toFixed(0)}
                    </Text>
                    <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12, marginLeft: 4 }}>
                      ({value.weight}%)
                    </Text>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Card>
  );
};

export default RiskScoreCard;
