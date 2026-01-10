import React from 'react';
import { Layout } from 'antd';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAppStore } from '../../store/useAppStore';

const { Content } = Layout;

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <Layout style={{ minHeight: '100vh', background: '#0f0f23' }}>
      <Header />
      <Layout style={{ marginTop: 72 }}>
        <Sidebar />
        <Content
          style={{
            marginLeft: sidebarCollapsed ? 80 : 240,
            padding: '32px 48px',
            minHeight: 'calc(100vh - 72px)',
            background: '#0f0f23',
            transition: 'margin-left 0.2s',
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
