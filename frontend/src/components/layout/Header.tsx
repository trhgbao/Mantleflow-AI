import React from 'react';
import { Layout, Button, Space, Typography, Dropdown, Avatar } from 'antd';
import {
  WalletOutlined,
  DisconnectOutlined,
  UserOutlined,
  DownOutlined,
} from '@ant-design/icons';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Link, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { useLanguage } from '../../i18n/LanguageContext';
import LanguageSwitcher from '../common/LanguageSwitcher';

const { Header: AntHeader } = Layout;
const { Text } = Typography;

const Header: React.FC = () => {
  const location = useLocation();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { setWallet, setConnected } = useAppStore();
  const { t } = useLanguage();

  React.useEffect(() => {
    if (isConnected && address) {
      setWallet(address, 5003);
      setConnected(true);
    } else {
      setWallet(null, null);
      setConnected(false);
    }
  }, [isConnected, address, setWallet, setConnected]);

  const handleConnect = () => {
    const connector = connectors[0];
    if (connector) {
      connect({ connector });
    }
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const menuItems = [
    {
      key: 'disconnect',
      icon: <DisconnectOutlined />,
      label: 'Disconnect',
      onClick: () => disconnect(),
    },
  ];

  return (
    <AntHeader
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        height: 72,
        background: 'rgba(15, 15, 35, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Logo */}
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            fontWeight: 700,
            color: '#fff',
          }}
        >
          M
        </div>
        <Text
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.5px',
          }}
        >
          MantleFlow
        </Text>
      </Link>

      {/* Navigation */}
      <Space size={32}>
        {['/', '/dashboard', '/upload', '/marketplace'].map((path) => {
          const labels: Record<string, string> = {
            '/': t.nav.home,
            '/dashboard': t.nav.dashboard,
            '/upload': t.nav.upload,
            '/marketplace': t.nav.marketplace,
          };
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              style={{
                color: isActive ? '#667eea' : 'rgba(255, 255, 255, 0.7)',
                fontWeight: isActive ? 600 : 400,
                fontSize: 15,
                transition: 'color 0.2s',
              }}
            >
              {labels[path]}
            </Link>
          );
        })}
      </Space>

      {/* Language Switcher */}
      <LanguageSwitcher />

      {/* Wallet */}
      {isConnected && address ? (
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button
            type="default"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 12,
              height: 44,
              padding: '0 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Avatar
              size={28}
              icon={<UserOutlined />}
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            />
            <Text style={{ color: '#fff', fontWeight: 500 }}>
              {formatAddress(address)}
            </Text>
            <DownOutlined style={{ color: 'rgba(255, 255, 255, 0.5)', fontSize: 12 }} />
          </Button>
        </Dropdown>
      ) : (
        <Button
          type="primary"
          icon={<WalletOutlined />}
          onClick={handleConnect}
          style={{
            height: 44,
            borderRadius: 12,
            fontWeight: 600,
            fontSize: 15,
            padding: '0 24px',
          }}
        >
          Connect Wallet
        </Button>
      )}
    </AntHeader>
  );
};

export default Header;
