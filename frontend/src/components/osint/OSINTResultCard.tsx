import React from 'react';
import { Card, Progress, Tag, Typography, List, Row, Col, Alert, Divider } from 'antd';
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  FileTextOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  LikeOutlined,
} from '@ant-design/icons';
import type { OSINTData, OSINTStatus, CredibilityCriterion } from '../../types';
import { CREDIBILITY_TIERS } from '../../config/constants';

const { Text, Title, Paragraph } = Typography;

interface OSINTResultCardProps {
  data: OSINTData;
}

const getStatusIcon = (status: OSINTStatus, size: number = 20) => {
  switch (status) {
    case 'passed':
      return <CheckCircleFilled style={{ color: '#52c41a', fontSize: size }} />;
    case 'warning':
      return <ExclamationCircleFilled style={{ color: '#faad14', fontSize: size }} />;
    case 'failed':
      return <CloseCircleFilled style={{ color: '#f5222d', fontSize: size }} />;
  }
};

const getCriterionIcon = (key: string) => {
  const icons: Record<string, React.ReactNode> = {
    completeness: <FileTextOutlined />,
    validity: <CheckCircleOutlined />,
    consistency: <SyncOutlined />,
    no_fraud_signs: <SafetyCertificateOutlined />,
  };
  return icons[key] || <FileTextOutlined />;
};

const getCredibilityTier = (score: number): { label: string; color: string } => {
  if (score >= 80) return CREDIBILITY_TIERS.A;
  if (score >= 60) return CREDIBILITY_TIERS.B;
  if (score >= 40) return CREDIBILITY_TIERS.C;
  return CREDIBILITY_TIERS.D;
};

const OSINTResultCard: React.FC<OSINTResultCardProps> = ({ data }) => {
  const isCredible = data.is_credible;
  const tier = getCredibilityTier(data.osint_score);

  // Prepare criteria items for display
  const criteriaItems: { key: string; data: CredibilityCriterion }[] = [
    { key: 'completeness', data: data.criteria.completeness },
    { key: 'validity', data: data.criteria.validity },
    { key: 'consistency', data: data.criteria.consistency },
    { key: 'no_fraud_signs', data: data.criteria.no_fraud_signs },
  ];

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isCredible ? 'rgba(82, 196, 26, 0.3)' : 'rgba(245, 34, 45, 0.3)'}`,
        borderRadius: 16,
      }}
      styles={{ body: { padding: 32 } }}
    >
      {/* Header */}
      <Row gutter={24} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: isCredible
                ? 'rgba(82, 196, 26, 0.1)'
                : 'rgba(245, 34, 45, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SafetyCertificateOutlined
              style={{
                fontSize: 32,
                color: isCredible ? '#52c41a' : '#f5222d',
              }}
            />
          </div>
        </Col>
        <Col flex={1}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            Đánh Giá Độ Uy Tín
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Phân tích bởi Gemini AI
            {data.doc_type && <Tag style={{ marginLeft: 8 }}>{data.doc_type}</Tag>}
          </Text>
        </Col>
        <Col>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: tier.color,
                lineHeight: 1,
              }}
            >
              {data.osint_score}
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>/100</Text>
            <div>
              <Tag color={isCredible ? 'success' : 'error'} style={{ marginTop: 4 }}>
                {tier.label}
              </Tag>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alert for low credibility */}
      {!isCredible && (
        <Alert
          message="Cảnh báo: Độ uy tín thấp"
          description={data.reject_reason || "Tài liệu này có điểm uy tín dưới ngưỡng cho phép. Vui lòng xem xét kỹ trước khi chấp nhận."}
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Auto reject alert */}
      {data.auto_reject && (
        <Alert
          message="Tự động từ chối"
          description="Tài liệu này đã bị tự động từ chối do điểm uy tín quá thấp."
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Criteria Results */}
      <div style={{ marginBottom: 24 }}>
        <Title level={5} style={{ color: '#fff', marginBottom: 16 }}>
          Tiêu chí đánh giá
        </Title>
        <List
          itemLayout="horizontal"
          dataSource={criteriaItems}
          renderItem={(item) => (
            <List.Item
              style={{
                padding: '16px',
                marginBottom: 8,
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: 12,
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <List.Item.Meta
                avatar={
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20,
                      color: 'rgba(255, 255, 255, 0.7)',
                    }}
                  >
                    {getCriterionIcon(item.key)}
                  </div>
                }
                title={
                  <Text style={{ color: '#fff', fontWeight: 500 }}>
                    {item.data.label}
                  </Text>
                }
                description={
                  <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
                    {item.data.description}
                  </Text>
                }
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Progress
                  percent={(item.data.score / item.data.max_score) * 100}
                  size="small"
                  strokeColor={
                    item.data.status === 'passed'
                      ? '#52c41a'
                      : item.data.status === 'warning'
                      ? '#faad14'
                      : '#f5222d'
                  }
                  trailColor="rgba(255, 255, 255, 0.1)"
                  style={{ width: 100 }}
                  format={() => `${item.data.score}/${item.data.max_score}`}
                />
                {getStatusIcon(item.data.status)}
              </div>
            </List.Item>
          )}
        />
      </div>

      {/* Summary */}
      {data.summary && (
        <div style={{ marginBottom: 24 }}>
          <Title level={5} style={{ color: '#fff', marginBottom: 8 }}>
            Tóm tắt
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', margin: 0 }}>
            {data.summary}
          </Paragraph>
        </div>
      )}

      <Divider style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />

      {/* Red Flags */}
      {data.red_flags.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ color: '#f5222d', marginBottom: 12 }}>
            <WarningOutlined style={{ marginRight: 8 }} />
            Vấn đề phát hiện ({data.red_flags.length})
          </Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.red_flags.map((flag, index) => (
              <Tag
                key={index}
                color="error"
                style={{
                  borderRadius: 8,
                  padding: '4px 12px',
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                }}
              >
                {flag}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Positive Signs */}
      {data.positive_signs && data.positive_signs.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Title level={5} style={{ color: '#52c41a', marginBottom: 12 }}>
            <LikeOutlined style={{ marginRight: 8 }} />
            Điểm tích cực ({data.positive_signs.length})
          </Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.positive_signs.map((sign, index) => (
              <Tag
                key={index}
                color="success"
                style={{
                  borderRadius: 8,
                  padding: '4px 12px',
                  maxWidth: '100%',
                  whiteSpace: 'normal',
                }}
              >
                {sign}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: isCredible
            ? 'rgba(82, 196, 26, 0.1)'
            : 'rgba(245, 34, 45, 0.1)',
          borderRadius: 12,
          border: `1px solid ${isCredible ? 'rgba(82, 196, 26, 0.2)' : 'rgba(245, 34, 45, 0.2)'}`,
        }}
      >
        <Text strong style={{ color: isCredible ? '#52c41a' : '#f5222d' }}>
          Khuyến nghị:
        </Text>
        <Text style={{ color: isCredible ? '#52c41a' : '#f5222d', marginLeft: 8 }}>
          {data.recommendation}
        </Text>
      </div>
    </Card>
  );
};

export default OSINTResultCard;
