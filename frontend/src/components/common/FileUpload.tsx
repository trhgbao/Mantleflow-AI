import React from 'react';
import { Upload, Typography, message } from 'antd';
import { InboxOutlined, FileOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { SUPPORTED_FILE_TYPES, MAX_FILE_SIZE } from '../../config/constants';
import { useLanguage } from '../../i18n/LanguageContext';

const { Dragger } = Upload;
const { Text, Title } = Typography;

interface FileUploadProps {
  onUpload: (file: File) => void;
  loading?: boolean;
  accept?: string[];
  maxSize?: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUpload,
  loading = false,
  accept = SUPPORTED_FILE_TYPES,
  maxSize = MAX_FILE_SIZE,
}) => {
  const { t } = useLanguage();

  const props: UploadProps = {
    name: 'file',
    multiple: false,
    accept: accept.join(','),
    showUploadList: false,
    disabled: loading,
    beforeUpload: (file) => {
      // Check file size
      if (file.size > maxSize) {
        message.error(`File must be smaller than ${maxSize / 1024 / 1024}MB`);
        return false;
      }

      // Check file type
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!accept.includes(extension)) {
        message.error(`Unsupported file type. Supported: ${accept.join(', ')}`);
        return false;
      }

      onUpload(file);
      return false; // Prevent default upload
    },
  };

  return (
    <Dragger
      {...props}
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '2px dashed rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: '48px 24px',
        transition: 'all 0.3s ease',
      }}
      className="custom-upload-dragger"
    >
      <div style={{ padding: '40px 0' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
          }}
        >
          <InboxOutlined style={{ fontSize: 36, color: '#fff' }} />
        </div>

        <Title level={4} style={{ color: '#fff', marginBottom: 8 }}>
          {loading ? t.common.loading : t.upload.dragDrop}
        </Title>

        <Text style={{ color: 'rgba(255, 255, 255, 0.6)', display: 'block', marginBottom: 16 }}>
          {t.upload.supportedFormats}
        </Text>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          {accept.map((type) => (
            <div
              key={type}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 12px',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 20,
              }}
            >
              <FileOutlined style={{ color: '#667eea', fontSize: 12 }} />
              <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 12 }}>
                {type.toUpperCase().replace('.', '')}
              </Text>
            </div>
          ))}
        </div>

        <Text
          style={{
            color: 'rgba(255, 255, 255, 0.4)',
            fontSize: 12,
            display: 'block',
            marginTop: 16,
          }}
        >
          {t.upload.maxSize}
        </Text>
      </div>
    </Dragger>
  );
};

export default FileUpload;
