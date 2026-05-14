import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  faWallet, faGlobe, faArrowUp, faRepeat, faPlus, faGear
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

// 🆕 Web3
import { Web3Button } from '@web3modal/react';
import { useAccount } from 'wagmi';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // 🆕 wallet state
  const { address, isConnected } = useAccount();

  const navItems = [
    { path: '/', icon: faWallet, label: 'Wallet' },
    { path: '/nft', icon: faGlobe, label: 'Browse' },
    { path: '/send', icon: faArrowUp, label: 'Send' },
    { path: '/swap', icon: faRepeat, label: 'Swap' },
    { path: '/buy', icon: faPlus, label: 'Buy' },
    { path: '/settings', icon: faGear, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav-gold">

      {/* NAV ITEMS */}
      {navItems.map((item) => (
        <div
          key={item.path}
          className={`nav-item-gold ${
            location.pathname === item.path ? 'active' : ''
          }`}
          onClick={() => navigate(item.path)}
        >
          <div className="nav-icon-gold">
            <FontAwesomeIcon icon={item.icon} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}

      {/* 🆕 WALLET CONNECT AREA */}
      <div style={{ marginLeft: 'auto', paddingRight: 10 }}>
        {isConnected ? (
          <div style={{ fontSize: 10, color: '#c9a84c' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        ) : (
          <Web3Button />
        )}
      </div>

    </nav>
  );
};

export default BottomNav;
