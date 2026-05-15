import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  faWallet, faGlobe, faArrowUp, faRepeat, faPlus, faGear, faHandHoldingDollar
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAccount } from 'wagmi';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const { address, isConnected } = useAccount();

  const navItems = [
    { path: '/', icon: faWallet, label: 'Wallet' },
    { path: '/nft', icon: faGlobe, label: 'Browse' },
    { path: '/send', icon: faArrowUp, label: 'Send' },
    { path: '/swap', icon: faRepeat, label: 'Swap' },
    { path: '/buy', icon: faPlus, label: 'Buy' },
    { path: '/receive', icon: faHandHoldingDollar, label: 'Receive' },
    { path: '/settings', icon: faGear, label: 'Settings' },
  ];

  return (
    <nav className="bottom-nav-gold">

      {navItems.map((item) => (
        <div
          key={item.path}
          className={`nav-item-gold ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <div className="nav-icon-gold">
            <FontAwesomeIcon icon={item.icon} />
          </div>
          <span>{item.label}</span>
        </div>
      ))}

      <div style={{ marginLeft: 'auto', paddingRight: 10 }}>
        {isConnected ? (
          <div style={{ fontSize: 10, color: '#c9a84c' }}>
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#888' }}>
            Not Connected
          </div>
        )}
      </div>

    </nav>
  );
};

export default BottomNav;
