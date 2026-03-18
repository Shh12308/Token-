// src/components/common/Sidebar.jsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import AccountSwitcher from './AccountSwitcher';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      {/* Header with account switcher */}
      <div className="sidebar-header">
        <AccountSwitcher />
      </div>

      {/* Navigation links */}
      <nav className="sidebar-nav">
        <NavLink to="/app/dashboard" className="nav-item">
          <span className="icon">🏠</span> Dashboard
        </NavLink>
        <NavLink to="/app/wallet" className="nav-item">
          <span className="icon">💰</span> Wallet
        </NavLink>
        <NavLink to="/app/settings" className="nav-item">
          <span className="icon">⚙️</span> Settings
        </NavLink>
      </nav>

      {/* Footer placeholder */}
      <footer className="sidebar-footer">
        {/* Optional footer content */}
      </footer>
    </aside>
  );
};

export default Sidebar; // default export
