import React from 'react';
import { Layout, Menu } from 'antd';
import {
  DashboardOutlined,
  UploadOutlined,
  FileTextOutlined,
  ShopOutlined,
  SettingOutlined,
  BankOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useLanguage } from '../../i18n/LanguageContext';

const { Sider } = Layout;

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const { t } = useLanguage();

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: t.nav.dashboard,
    },
    {
      key: '/upload',
      icon: <UploadOutlined />,
      label: t.nav.upload,
    },
    {
      key: '/loans',
      icon: <FileTextOutlined />,
      label: t.nav.loans,
    },
    {
      key: '/marketplace',
      icon: <ShopOutlined />,
      label: t.nav.marketplace,
    },
    {
      type: 'divider' as const,
    },
    {
      key: '/staking',
      icon: <BankOutlined />,
      label: 'Staking',
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: t.nav.settings,
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      onCollapse={setSidebarCollapsed}
      width={240}
      style={{
        background: '#080816',
        borderRight: '1px solid rgba(255, 255, 255, 0.1)',
        height: '100vh',
        position: 'fixed',
        left: 0,
        top: 72,
        zIndex: 100,
      }}
      theme="dark"
    >
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        style={{
          background: 'transparent',
          border: 'none',
          marginTop: 24,
        }}
        theme="dark"
      />
    </Sider>
  );
};

export default Sidebar;
