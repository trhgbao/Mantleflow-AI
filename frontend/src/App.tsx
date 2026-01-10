import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { config } from './config/wagmi';
import { LanguageProvider } from './i18n/LanguageContext';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import LoanDetail from './pages/LoanDetail';
import Marketplace from './pages/Marketplace';

import './styles/global.css';

const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <ConfigProvider
            theme={{
              algorithm: theme.darkAlgorithm,
              token: {
                colorPrimary: '#667eea',
                colorBgContainer: 'rgba(255, 255, 255, 0.03)',
                colorBgElevated: '#1a1a2e',
                colorBorder: 'rgba(255, 255, 255, 0.1)',
                colorText: '#ffffff',
                colorTextSecondary: 'rgba(255, 255, 255, 0.7)',
                borderRadius: 12,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
              },
              components: {
                Button: {
                  primaryShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                },
                Card: {
                  colorBgContainer: 'rgba(255, 255, 255, 0.03)',
                },
                Table: {
                  colorBgContainer: 'transparent',
                  headerBg: 'rgba(255, 255, 255, 0.05)',
                },
                Menu: {
                  darkItemBg: 'transparent',
                  darkSubMenuItemBg: 'transparent',
                },
                Modal: {
                  contentBg: '#0f0f23',
                  headerBg: '#0f0f23',
                },
              },
            }}
          >
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/upload" element={<Upload />} />
                <Route path="/loans/:id" element={<LoanDetail />} />
                <Route path="/marketplace" element={<Marketplace />} />
              </Routes>
            </BrowserRouter>
          </ConfigProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
