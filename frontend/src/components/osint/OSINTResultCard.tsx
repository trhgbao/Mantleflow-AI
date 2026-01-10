import React from 'react';
import { Card, Progress, Tag, Typography, List, Row, Col, Alert, Tooltip } from 'antd';
import {
  CheckCircleFilled,
  ExclamationCircleFilled,
  CloseCircleFilled,
  GlobalOutlined,
  LinkedinOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  ShareAltOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import type { OSINTData, OSINTStatus } from '../../types';
import { OSINT_CHECK_NAMES } from '../../config/constants';

const { Text, Title } = Typography;

interface OSINTResultCardProps {
  data: OSINTData;
}

const getStatusIcon = (status: OSINTStatus) => {
  switch (status) {
    case 'passed':
      return <CheckCircleFilled style={{ color: '#52c41a', fontSize: 20 }} />;
    case 'warning':
      return <ExclamationCircleFilled style={{ color: '#faad14', fontSize: 20 }} />;
    case 'failed':
      return <CloseCircleFilled style={{ color: '#f5222d', fontSize: 20 }} />;
  }
};

const getCheckIcon = (checkName: string) => {
  const icons: Record<string, React.ReactNode> = {
    website: <GlobalOutlined />,
    linkedin: <LinkedinOutlined />,
    google_maps: <EnvironmentOutlined />,
    press_news: <FileTextOutlined />,
    social_media: <ShareAltOutlined />,
  };
  return icons[checkName] || <GlobalOutlined />;
};

const OSINTResultCard: React.FC<OSINTResultCardProps> = ({ data }) => {
  const isHighRisk = data.is_shell_company || data.auto_reject;

  const checkItems = [
    { key: 'website', data: data.checks.website },
    { key: 'linkedin', data: data.checks.linkedin },
    { key: 'google_maps', data: data.checks.google_maps },
    { key: 'press_news', data: data.checks.press_news },
    { key: 'social_media', data: data.checks.social_media },
  ];

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: `1px solid ${isHighRisk ? 'rgba(245, 34, 45, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: 16,
      }}
      bodyStyle={{ padding: 32 }}
    >
      {/* Header */}
      <Row gutter={24} align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: isHighRisk
                ? 'rgba(245, 34, 45, 0.1)'
                : 'rgba(82, 196, 26, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SafetyCertificateOutlined
              style={{
                fontSize: 32,
                color: isHighRisk ? '#f5222d' : '#52c41a',
              }}
            />
          </div>
        </Col>
        <Col flex={1}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            OSINT Verification
          </Title>
          <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Anti-fraud company verification
          </Text>
        </Col>
        <Col>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: isHighRisk ? '#f5222d' : '#52c41a',
                lineHeight: 1,
              }}
            >
              {data.osint_score}
            </div>
            <Text style={{ color: 'rgba(255, 255, 255, 0.5)' }}>/100</Text>
          </div>
        </Col>
      </Row>

      {/* Shell Company Alert */}
      {data.is_shell_company && (
        <Alert
          message="Shell Company Detected"
          description="This company shows multiple indicators of being a shell/fake company. Exercise extreme caution."
          type="error"
          showIcon
          icon={<WarningOutlined />}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Auto Reject Alert */}
      {data.auto_reject && !data.is_shell_company && (
        <Alert
          message="Verification Failed"
          description={data.reject_reason || 'Company failed OSINT verification checks.'}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Check Results */}
      <List
        itemLayout="horizontal"
        dataSource={checkItems}
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
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 18,
                    color: 'rgba(255, 255, 255, 0.7)',
                  }}
                >
                  {getCheckIcon(item.key)}
                </div>
              }
              title={
                <Text style={{ color: '#fff', fontWeight: 500 }}>
                  {OSINT_CHECK_NAMES[item.key as keyof typeof OSINT_CHECK_NAMES]}
                </Text>
              }
              description={
                <Tooltip
                  title={
                    <div>
                      {Object.entries(item.data.details).map(([k, v]) => (
                        <div key={k}>
                          {k}: {String(v)}
                        </div>
                      ))}
                    </div>
                  }
                >
                  <Text style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }}>
                    Click for details
                  </Text>
                </Tooltip>
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

      {/* Red Flags */}
      {data.red_flags.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <Title level={5} style={{ color: '#f5222d', marginBottom: 12 }}>
            <WarningOutlined style={{ marginRight: 8 }} />
            Red Flags ({data.red_flags.length})
          </Title>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {data.red_flags.map((flag, index) => (
              <Tag
                key={index}
                color="error"
                style={{
                  borderRadius: 8,
                  padding: '4px 12px',
                }}
              >
                {flag}
              </Tag>
            ))}
          </div>
        </div>
      )}

      {/* Business Age */}
      <div style={{ marginTop: 24 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>Business Age</Text>
          </Col>
          <Col>
            <Tag
              color={
                data.business_age.status === 'passed'
                  ? 'success'
                  : data.business_age.status === 'warning'
                  ? 'warning'
                  : 'error'
              }
            >
              {data.business_age.months} months
            </Tag>
          </Col>
        </Row>
      </div>

      {/* Recommendation */}
      <div
        style={{
          marginTop: 24,
          padding: 16,
          background: isHighRisk
            ? 'rgba(245, 34, 45, 0.1)'
            : 'rgba(82, 196, 26, 0.1)',
          borderRadius: 12,
          border: `1px solid ${isHighRisk ? 'rgba(245, 34, 45, 0.2)' : 'rgba(82, 196, 26, 0.2)'}`,
        }}
      >
        <Text style={{ color: isHighRisk ? '#f5222d' : '#52c41a' }}>
          {data.recommendation}
        </Text>
      </div>
    </Card>
  );
};

export default OSINTResultCard;
