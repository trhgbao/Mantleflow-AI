import React, { useState } from 'react';
import { Typography, Steps, Button, Row, Col, Spin, message, Result } from 'antd';
import {
  UploadOutlined,
  LoadingOutlined,
  CheckCircleOutlined,
  RocketOutlined,
  FileSearchOutlined,
  SafetyOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';
import DashboardLayout from '../../components/layout/DashboardLayout';
import FileUpload from '../../components/common/FileUpload';
import RiskScoreCard from '../../components/risk/RiskScoreCard';
import OSINTResultCard from '../../components/osint/OSINTResultCard';
import DocumentDisplay from '../../components/document/DocumentDisplay';
import { aiService } from '../../services/aiService';
import { useAppStore } from '../../store/useAppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import type { ExtractedInvoice, RiskScoreData, OSINTData } from '../../types';

const { Title, Text, Paragraph } = Typography;

type UploadStep = 'upload' | 'analyzing' | 'results';
type AnalysisPhase = 'extracting' | 'osint' | 'scoring' | 'complete';

const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { address, isConnected } = useAccount();
  const { setInvoice, setRiskScore, setOsintResult } = useAppStore();
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState<UploadStep>('upload');
  const [analysisPhase, setAnalysisPhase] = useState<AnalysisPhase>('extracting');
  const [loading, setLoading] = useState(false);

  const [invoice, setInvoiceLocal] = useState<ExtractedInvoice | null>(null);
  const [riskScore, setRiskScoreLocal] = useState<RiskScoreData | null>(null);
  const [osintData, setOsintDataLocal] = useState<OSINTData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!isConnected || !address) {
      message.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setCurrentStep('analyzing');
    setError(null);

    try {
      // Phase 1: Extract Invoice
      setAnalysisPhase('extracting');
      const extractResult = await aiService.extractInvoice(file);

      if (!extractResult.success || !extractResult.data) {
        throw new Error(extractResult.error || 'Failed to extract invoice data');
      }

      const extractedInvoice = extractResult.data;
      setInvoiceLocal(extractedInvoice);
      setInvoice(extractedInvoice);

      // Phase 2: OSINT Check - Đánh giá độ uy tín bằng Gemini AI
      setAnalysisPhase('osint');
      const osintResult = await aiService.checkOSINT({
        // Document info
        doc_type: extractedInvoice.doc_type,
        doc_name: extractedInvoice.doc_name,
        invoice_number: extractedInvoice.invoice_number,
        amount: extractedInvoice.amount,
        currency: extractedInvoice.currency,
        attributes: extractedInvoice.attributes,
        // Debtor info
        company_name: extractedInvoice.debtor.name,
        tax_id: extractedInvoice.debtor.tax_id,
        address: extractedInvoice.debtor.address,
      });

      if (!osintResult.success || !osintResult.data) {
        throw new Error(osintResult.error || 'Failed to perform OSINT check');
      }

      setOsintDataLocal(osintResult.data);
      setOsintResult(osintResult.data);

      // Phase 3: Risk Scoring
      setAnalysisPhase('scoring');

      // Calculate payment term days from due date
      let paymentTermDays = 30;
      if (extractedInvoice.due_date && extractedInvoice.issue_date) {
        const due = new Date(extractedInvoice.due_date);
        const issue = new Date(extractedInvoice.issue_date);
        paymentTermDays = Math.ceil((due.getTime() - issue.getTime()) / (1000 * 60 * 60 * 24));
      }

      const riskResult = await aiService.getRiskScore({
        wallet_address: address,
        debtor_tax_id: extractedInvoice.debtor.tax_id,
        invoice_amount: extractedInvoice.amount,
        payment_term_days: paymentTermDays,
        debtor_business_age_months: 24, // Default or from OSINT
        osint_score: osintResult.data.osint_score,
      });

      if (!riskResult.success || !riskResult.data) {
        throw new Error(riskResult.error || 'Failed to calculate risk score');
      }

      setRiskScoreLocal(riskResult.data);
      setRiskScore(riskResult.data);

      setAnalysisPhase('complete');
      setCurrentStep('results');

    } catch (err: any) {
      console.error('Analysis error:', err);
      setError(err.message || 'An error occurred during analysis');
      message.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGetLoan = () => {
    if (riskScore && !riskScore.is_approved) {
      message.error('Your application was not approved');
      return;
    }
    // Navigate to loan creation
    navigate('/dashboard');
    message.success('Proceeding to loan creation...');
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setInvoiceLocal(null);
    setRiskScoreLocal(null);
    setOsintDataLocal(null);
    setError(null);
  };

  const getStepStatus = (step: number) => {
    const stepMap: Record<UploadStep, number> = {
      upload: 0,
      analyzing: 1,
      results: 2,
    };
    const currentIndex = stepMap[currentStep];

    if (step < currentIndex) return 'finish';
    if (step === currentIndex) return currentStep === 'analyzing' ? 'process' : 'finish';
    return 'wait';
  };

  const renderAnalyzingContent = () => {
    const phases = [
      { key: 'extracting', label: t.upload.extracting, icon: <FileSearchOutlined /> },
      { key: 'osint', label: t.upload.verifying, icon: <SafetyOutlined /> },
      { key: 'scoring', label: t.upload.scoring, icon: <RocketOutlined /> },
    ];

    const currentPhaseIndex = phases.findIndex((p) => p.key === analysisPhase);

    return (
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <Spin
          indicator={<LoadingOutlined style={{ fontSize: 64, color: '#667eea' }} spin />}
        />
        <Title level={3} style={{ color: '#fff', marginTop: 32, marginBottom: 16 }}>
          {t.upload.analyzing}
        </Title>
        <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 48 }}>
          {t.common.loading}
        </Paragraph>

        <div style={{ maxWidth: 400, margin: '0 auto' }}>
          {phases.map((phase, index) => {
            const isActive = index === currentPhaseIndex;
            const isComplete = index < currentPhaseIndex;

            return (
              <div
                key={phase.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px 24px',
                  marginBottom: 12,
                  background: isActive
                    ? 'rgba(102, 126, 234, 0.1)'
                    : 'rgba(255, 255, 255, 0.03)',
                  borderRadius: 12,
                  border: `1px solid ${isActive ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)'}`,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: isComplete
                      ? '#52c41a'
                      : isActive
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: 18,
                  }}
                >
                  {isComplete ? <CheckCircleOutlined /> : phase.icon}
                </div>
                <Text
                  style={{
                    color: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                    fontWeight: isActive ? 600 : 400,
                  }}
                >
                  {phase.label}
                </Text>
                {isActive && (
                  <LoadingOutlined
                    style={{ marginLeft: 'auto', color: '#667eea' }}
                    spin
                  />
                )}
                {isComplete && (
                  <CheckCircleOutlined
                    style={{ marginLeft: 'auto', color: '#52c41a' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderResultsContent = () => {
    if (error) {
      return (
        <Result
          status="error"
          title={t.common.error}
          subTitle={error}
          extra={
            <Button type="primary" onClick={handleReset}>
              {t.common.back}
            </Button>
          }
        />
      );
    }

    if (!invoice || !riskScore || !osintData) {
      return null;
    }

    const isApproved = riskScore.is_approved && !osintData.auto_reject;

    // Transform invoice data for DocumentDisplay
    const documentData = {
      doc_type: (invoice as any).doc_type || 'INVOICE',
      doc_name: (invoice as any).doc_name || invoice.invoice_number,
      invoiceNumber: invoice.invoice_number,
      amount: invoice.amount,
      currency: invoice.currency,
      confidence: (invoice as any).confidence,
      debtor: {
        name: invoice.debtor.name,
        taxId: invoice.debtor.tax_id,
        address: invoice.debtor.address,
      },
      attributes: (invoice as any).attributes || {},
    };

    return (
      <div>
        <div style={{ marginBottom: 32 }}>
          <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
            {t.upload.complete}
          </Title>
          <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {t.upload.subtitle}
          </Paragraph>
        </div>

        <Row gutter={[24, 24]}>
          {/* Document Data */}
          <Col span={24}>
            <DocumentDisplay data={documentData} />
          </Col>

          {/* Risk Score */}
          <Col xs={24} lg={12}>
            <RiskScoreCard data={riskScore} />
          </Col>

          {/* OSINT Results */}
          <Col xs={24} lg={12}>
            <OSINTResultCard data={osintData} />
          </Col>
        </Row>

        {/* Action Buttons */}
        <div
          style={{
            marginTop: 32,
            padding: 24,
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            {isApproved ? (
              <>
                <Text style={{ color: '#52c41a', fontSize: 18, fontWeight: 600 }}>
                  <CheckCircleOutlined style={{ marginRight: 8 }} />
                  {t.risk.approved} - {t.risk.tier} {riskScore.tier}
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {t.risk.ltv}: {riskScore.ltv}% | {t.risk.interest}: {riskScore.interest_rate}% APR
                </Text>
              </>
            ) : (
              <>
                <Text style={{ color: '#f5222d', fontSize: 18, fontWeight: 600 }}>
                  <CloseCircleOutlined style={{ marginRight: 8 }} />
                  {t.risk.rejected}
                </Text>
                <br />
                <Text style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {riskScore.recommendation}
                </Text>
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <Button onClick={handleReset} size="large">
              {t.upload.uploadAnother}
            </Button>
            {isApproved && (
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={handleGetLoan}
                style={{
                  height: 48,
                  padding: '0 32px',
                  fontWeight: 600,
                }}
              >
                {t.upload.getLoan}
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Steps */}
        <Steps
          current={currentStep === 'upload' ? 0 : currentStep === 'analyzing' ? 1 : 2}
          style={{ marginBottom: 48 }}
          items={[
            {
              title: <Text style={{ color: '#fff' }}>Upload</Text>,
              icon: <UploadOutlined />,
              status: getStepStatus(0),
            },
            {
              title: <Text style={{ color: '#fff' }}>AI Analysis</Text>,
              icon: loading ? <LoadingOutlined spin /> : <FileSearchOutlined />,
              status: getStepStatus(1),
            },
            {
              title: <Text style={{ color: '#fff' }}>Results</Text>,
              icon: <CheckCircleOutlined />,
              status: getStepStatus(2),
            },
          ]}
        />

        {/* Content */}
        {currentStep === 'upload' && (
          <div>
            <Title level={3} style={{ color: '#fff', marginBottom: 8 }}>
              {t.upload.title}
            </Title>
            <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: 32 }}>
              {t.upload.subtitle}
            </Paragraph>
            <FileUpload onUpload={handleFileUpload} loading={loading} />
          </div>
        )}

        {currentStep === 'analyzing' && renderAnalyzingContent()}

        {currentStep === 'results' && renderResultsContent()}
      </div>
    </DashboardLayout>
  );
};

export default Upload;
