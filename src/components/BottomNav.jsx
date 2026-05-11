import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  faWallet, faGlobe, faArrowUp, faRepeat, faPlus, faGear 
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { path: '/app', icon: faWallet, label: 'Wallet' },
    { path: '/app/nft-market', icon: faGlobe, label: 'Browse' },
    { path: '/app/send', icon: faArrowUp, label: 'Send' },
    { path: '/app/swap', icon: faRepeat, label: 'Swap' },
    { path: '/app/buy', icon: faPlus, label: 'Buy' },
    { path: '/app/settings', icon: faGear, label: 'Settings' },
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
    </nav>
  );
};

export default BottomNav;
