import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Wallet,
  Globe,
  Send,
  Repeat,
  Settings
} from 'lucide-react';

import { useAccount } from 'wagmi';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { address, isConnected } = useAccount();

  const navItems = [
    { path: '/', icon: Wallet, label: 'Wallet' },
    { path: '/nft', icon: Globe, label: 'Explore' },
    { path: '/send', icon: Send, label: 'Send' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav style={styles.nav}>

      {navItems.slice(0, 2).map((item) => (
        <NavItem key={item.path} item={item} location={location} navigate={navigate} />
      ))}

      {/* Center Action Button */}
      <div style={styles.centerButton} onClick={() => navigate('/swap')}>
        <Repeat size={22} />
      </div>

      {navItems.slice(2).map((item) => (
        <NavItem key={item.path} item={item} location={location} navigate={navigate} />
      ))}

      {/* Wallet Status */}
      <div style={styles.walletStatus}>
        {isConnected ? (
          <span style={styles.connected}>
            ● {address?.slice(0, 4)}...{address?.slice(-3)}
          </span>
        ) : (
          <span style={styles.disconnected}>Not Connected</span>
        )}
      </div>

    </nav>
  );
};

const NavItem = ({ item, location, navigate }) => {
  const Icon = item.icon;
  const active = location.pathname === item.path;

  return (
    <div
      onClick={() => navigate(item.path)}
      style={{
        ...styles.item,
        color: active ? '#f5c542' : '#888'
      }}
    >
      <Icon size={20} strokeWidth={2} />
      <span style={styles.label}>{item.label}</span>

      {active && <div style={styles.activeDot} />}
    </div>
  );
};

const styles = {
  nav: {
    position: 'fixed',
    bottom: 0,
    width: '100%',
    height: 70,
    background: '#0c0c0c',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTop: '1px solid #222',
    zIndex: 100
  },
  item: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: 18,
    cursor: 'pointer',
    position: 'relative'
  },
  label: {
    fontSize: 10,
    marginTop: 4
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: '50%',
    background: '#f5c542',
    position: 'absolute',
    bottom: -6
  },
  centerButton: {
    width: 55,
    height: 55,
    borderRadius: '50%',
    background: '#f5c542',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(245,197,66,0.5)'
  },
  walletStatus: {
    position: 'absolute',
    top: -18,
    right: 10,
    fontSize: 10
  },
  connected: {
    color: '#4caf50'
  },
  disconnected: {
    color: '#888'
  }
};

export default BottomNav;
