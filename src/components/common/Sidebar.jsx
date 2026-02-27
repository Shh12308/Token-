// ... imports
import AccountSwitcher from './AccountSwitcher';

const Sidebar = () => {
  // ...
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <AccountSwitcher /> {/* Add the switcher here */}
      </div>
      <nav className="sidebar-nav">
        {/* ... nav items */}
        <NavLink to="/app/settings" className="nav-item">
          <span className="icon">⚙️</span> Settings
        </NavLink>
      </nav>
      {/* ... footer */}
    </aside>
  );
};
