/**
 * Language Switcher Component
 */

import React from 'react';
import { Button, Dropdown, Space } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useLanguage } from '../../i18n/LanguageContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const items: MenuProps['items'] = [
    {
      key: 'vi',
      label: (
        <Space>
          <span style={{ fontSize: 18 }}>🇻🇳</span>
          <span>Tiếng Việt</span>
        </Space>
      ),
      onClick: () => setLanguage('vi'),
    },
    {
      key: 'en',
      label: (
        <Space>
          <span style={{ fontSize: 18 }}>🇺🇸</span>
          <span>English</span>
        </Space>
      ),
      onClick: () => setLanguage('en'),
    },
  ];

  return (
    <Dropdown menu={{ items, selectedKeys: [language] }} placement="bottomRight">
      <Button
        type="text"
        icon={<GlobalOutlined />}
        style={{
          color: 'rgba(255, 255, 255, 0.85)',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
