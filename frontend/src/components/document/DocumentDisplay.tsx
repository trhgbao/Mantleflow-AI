/**
 * DocumentDisplay Component - Hiển thị thông tin chứng từ đẹp
 */

import React from 'react';
import { Card, Descriptions, Tag, Typography, Row, Col, Divider, Avatar } from 'antd';
import {
  HomeOutlined,
  CarOutlined,
  BankOutlined,
  FileTextOutlined,
  BulbOutlined,
  ShopOutlined,
  UserOutlined,
  EnvironmentOutlined,
  NumberOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import { useLanguage } from '../../i18n/LanguageContext';

const { Text, Title } = Typography;

interface DocumentData {
  doc_type: string;
  doc_name?: string;
  invoiceNumber?: string;
  amount?: number;
  currency?: string;
  confidence?: number;
  debtor?: {
    name?: string;
    taxId?: string;
    address?: string;
  };
  attributes?: Record<string, any>;
}

interface DocumentDisplayProps {
  data: DocumentData;
}

const DOC_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; gradient: string }> = {
  LAND_TITLE: {
    icon: <HomeOutlined />,
    color: '#52c41a',
    gradient: 'linear-gradient(135deg, #52c41a 0%, #237804 100%)',
  },
  VEHICLE: {
    icon: <CarOutlined />,
    color: '#1890ff',
    gradient: 'linear-gradient(135deg, #1890ff 0%, #0050b3 100%)',
  },
  SAVINGS: {
    icon: <BankOutlined />,
    color: '#faad14',
    gradient: 'linear-gradient(135deg, #faad14 0%, #ad6800 100%)',
  },
  BUSINESS_REG: {
    icon: <ShopOutlined />,
    color: '#722ed1',
    gradient: 'linear-gradient(135deg, #722ed1 0%, #391085 100%)',
  },
  PATENT: {
    icon: <BulbOutlined />,
    color: '#eb2f96',
    gradient: 'linear-gradient(135deg, #eb2f96 0%, #9e1068 100%)',
  },
  INVOICE: {
    icon: <FileTextOutlined />,
    color: '#13c2c2',
    gradient: 'linear-gradient(135deg, #13c2c2 0%, #006d75 100%)',
  },
};

const DocumentDisplay: React.FC<DocumentDisplayProps> = ({ data }) => {
  const { t, language } = useLanguage();

  const docType = data.doc_type || 'UNKNOWN';
  const config = DOC_TYPE_CONFIG[docType] || {
    icon: <FileTextOutlined />,
    color: '#666',
    gradient: 'linear-gradient(135deg, #666 0%, #333 100%)',
  };

  const formatCurrency = (amount: number, currency: string = 'VND') => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency === 'VND' ? 'VND' : 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDocTypeName = () => {
    return t.docTypes[docType as keyof typeof t.docTypes] || docType;
  };

  const renderAttributes = () => {
    const attrs = data.attributes || {};
    const items: { label: string; value: any; icon?: React.ReactNode }[] = [];

    switch (docType) {
      case 'LAND_TITLE':
        if (attrs.land_lot_no) items.push({ label: t.docFields.land_lot_no, value: attrs.land_lot_no, icon: <NumberOutlined /> });
        if (attrs.land_map_no) items.push({ label: t.docFields.land_map_no, value: attrs.land_map_no });
        if (attrs.land_area) items.push({ label: t.docFields.land_area, value: attrs.land_area });
        if (attrs.land_address) items.push({ label: t.docFields.land_address, value: attrs.land_address, icon: <EnvironmentOutlined /> });
        if (attrs.land_purpose) items.push({ label: t.docFields.land_purpose, value: attrs.land_purpose });
        if (attrs.cert_book_entry) items.push({ label: t.docFields.cert_book_entry, value: attrs.cert_book_entry });
        break;

      case 'VEHICLE':
        if (attrs.plate_number) items.push({ label: t.docFields.plate_number, value: attrs.plate_number, icon: <NumberOutlined /> });
        if (attrs.brand) items.push({ label: t.docFields.brand, value: attrs.brand });
        if (attrs.vehicle_type) items.push({ label: t.docFields.vehicle_type, value: attrs.vehicle_type });
        if (attrs.chassis_no) items.push({ label: t.docFields.chassis_no, value: attrs.chassis_no });
        if (attrs.engine_no) items.push({ label: t.docFields.engine_no, value: attrs.engine_no });
        if (attrs.valid_until) items.push({ label: t.docFields.valid_until, value: attrs.valid_until, icon: <CalendarOutlined /> });
        break;

      case 'SAVINGS':
        if (attrs.bank_name) items.push({ label: t.docFields.bank_name, value: attrs.bank_name, icon: <BankOutlined /> });
        if (attrs.book_serial) items.push({ label: t.docFields.book_serial, value: attrs.book_serial });
        if (attrs.account_no) items.push({ label: t.docFields.account_no, value: attrs.account_no, icon: <NumberOutlined /> });
        if (attrs.term) items.push({ label: t.docFields.term, value: attrs.term });
        if (attrs.maturity_date) items.push({ label: t.docFields.maturity_date, value: attrs.maturity_date, icon: <CalendarOutlined /> });
        break;

      case 'BUSINESS_REG':
        if (attrs.business_code) items.push({ label: t.docFields.business_code, value: attrs.business_code, icon: <NumberOutlined /> });
        if (attrs.company_name) items.push({ label: t.docFields.company_name, value: attrs.company_name, icon: <ShopOutlined /> });
        if (attrs.headquarters) items.push({ label: t.docFields.headquarters, value: attrs.headquarters, icon: <EnvironmentOutlined /> });
        if (attrs.charter_capital) items.push({ label: t.docFields.charter_capital, value: formatCurrency(attrs.charter_capital), icon: <DollarOutlined /> });
        if (attrs.legal_representative) items.push({ label: t.docFields.legal_representative, value: attrs.legal_representative, icon: <UserOutlined /> });
        if (attrs.representative_title) items.push({ label: t.docFields.representative_title, value: attrs.representative_title });
        if (attrs.registration_date) items.push({ label: t.docFields.registration_date, value: attrs.registration_date, icon: <CalendarOutlined /> });
        break;

      case 'PATENT':
        if (attrs.patent_number) items.push({ label: t.docFields.patent_number, value: attrs.patent_number, icon: <NumberOutlined /> });
        if (attrs.patent_title) items.push({ label: t.docFields.patent_title, value: attrs.patent_title, icon: <BulbOutlined /> });
        if (attrs.patent_owner) items.push({ label: t.docFields.patent_owner, value: attrs.patent_owner, icon: <UserOutlined /> });
        if (attrs.inventor) items.push({ label: t.docFields.inventor, value: attrs.inventor });
        if (attrs.application_number) items.push({ label: t.docFields.application_number, value: attrs.application_number });
        if (attrs.application_date) items.push({ label: t.docFields.application_date, value: attrs.application_date, icon: <CalendarOutlined /> });
        if (attrs.grant_decision) items.push({ label: t.docFields.grant_decision, value: attrs.grant_decision });
        break;

      default:
        // Show all attributes for unknown types
        Object.entries(attrs).forEach(([key, value]) => {
          if (value) items.push({ label: key, value: String(value) });
        });
    }

    return items;
  };

  const attributes = renderAttributes();

  return (
    <Card
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        overflow: 'hidden',
      }}
      bodyStyle={{ padding: 0 }}
    >
      {/* Header with doc type */}
      <div
        style={{
          background: config.gradient,
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <Avatar
          size={64}
          icon={config.icon}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            fontSize: 28,
          }}
        />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            {getDocTypeName()}
          </Title>
          {data.doc_name && (
            <Text style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {data.doc_name}
            </Text>
          )}
        </div>
        {data.confidence && (
          <Tag
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: '#fff',
              padding: '4px 12px',
              borderRadius: 20,
            }}
          >
            {Math.round(data.confidence * 100)}% {language === 'vi' ? 'độ tin cậy' : 'confidence'}
          </Tag>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        {/* Owner Info */}
        {data.debtor && (data.debtor.name || data.debtor.address) && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {t.docFields.owner}
              </Text>
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: 16,
                borderRadius: 12,
                marginBottom: 24,
              }}
            >
              <Row gutter={[16, 12]}>
                {data.debtor.name && (
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <UserOutlined style={{ color: config.color }} />
                      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 500 }}>
                        {data.debtor.name}
                      </Text>
                    </div>
                  </Col>
                )}
                {data.debtor.taxId && data.debtor.taxId !== 'Unknown' && (
                  <Col xs={24} sm={12}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <NumberOutlined style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {data.debtor.taxId}
                      </Text>
                    </div>
                  </Col>
                )}
                {data.debtor.address && (
                  <Col span={24}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <EnvironmentOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', marginTop: 4 }} />
                      <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        {data.debtor.address}
                      </Text>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </>
        )}

        {/* Amount */}
        {data.amount && data.amount > 0 && (
          <div
            style={{
              background: `${config.color}15`,
              padding: 16,
              borderRadius: 12,
              marginBottom: 24,
              border: `1px solid ${config.color}30`,
            }}
          >
            <Row justify="space-between" align="middle">
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {t.docFields.amount}
              </Text>
              <Text
                style={{
                  color: config.color,
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                {formatCurrency(data.amount, data.currency)}
              </Text>
            </Row>
          </div>
        )}

        {/* Document Attributes */}
        {attributes.length > 0 && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Text
                style={{
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontSize: 12,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {language === 'vi' ? 'Thông tin chi tiết' : 'Details'}
              </Text>
            </div>
            <Descriptions
              column={{ xs: 1, sm: 2 }}
              labelStyle={{
                color: 'rgba(255, 255, 255, 0.5)',
                padding: '8px 16px 8px 0',
              }}
              contentStyle={{
                color: '#fff',
                padding: '8px 0',
                fontWeight: 500,
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                padding: 16,
                borderRadius: 12,
              }}
            >
              {attributes.map((attr, index) => (
                <Descriptions.Item
                  key={index}
                  label={
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {attr.icon && <span style={{ color: config.color }}>{attr.icon}</span>}
                      {attr.label}
                    </span>
                  }
                >
                  {attr.value || '-'}
                </Descriptions.Item>
              ))}
            </Descriptions>
          </>
        )}

        {/* Document ID */}
        {data.invoiceNumber && (
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Text style={{ color: 'rgba(255, 255, 255, 0.4)', fontSize: 12 }}>
              ID: {data.invoiceNumber}
            </Text>
          </div>
        )}
      </div>
    </Card>
  );
};

export default DocumentDisplay;
