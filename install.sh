#!/bin/bash

# --- Clean up previous src if it exists ---
rm -rf src

# --- Create Directory Structure ---
mkdir -p src/components/UI src/components/Auth src/components/Wallets src/components/Cards src/components/NFTs src/components/Transactions src/components/Dashboard src/context src/hooks src/utils src/pages src/assets

# --- FILE: package.json ---
cat > package.json << 'EOF'
{
  "name": "fintech-frontend-advanced",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.3.0",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.4.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.1",
    "react-scripts": "5.0.1",
    "recharts": "^2.7.2",
    "react-qr-code": "^2.0.11",
    "react-loading-skeleton": "^3.1.1",
    "react-hot-toast": "^2.4.1",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "proxy": "http://localhost:5000"
}
EOF

# --- FILE: public/index.html ---
cat > public/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Advanced Fintech App Frontend" />
    <title>Fintech App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <div id="modal-root"></div>
  </body>
</html>
EOF

# --- FILE: src/index.js ---
cat > src/index.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ApiProvider } from './context/ApiContext';
import { UIProvider } from './context/UIContext';
import ErrorBoundary from './components/ErrorBoundary';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ApiProvider>
          <UIProvider>
            <AuthProvider>
              <App />
              <Toaster position="top-right" />
            </AuthProvider>
          </UIProvider>
        </ApiProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
EOF

# --- FILE: src/App.js ---
cat > src/App.js << 'EOF'
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import WalletsPage from './pages/WalletsPage';
import CardsPage from './pages/CardsPage';
import NFTsPage from './pages/NFTsPage';
import TransactionsPage from './pages/TransactionsPage';
import KYCPage from './pages/KYCPage';
import SettingsPage from './pages/SettingsPage';
import Spinner from './components/UI/Spinner';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
      <Route path="/" element={user ? <Layout /> : <Navigate to="/login" />}>
        <Route index element={<Navigate to="/dashboard" />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="cards" element={<CardsPage />} />
        <Route path="nfts" element={<NFTsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="kyc" element={<KYCPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Route>
    </Routes>
  );
}

export default App;
EOF

# --- FILE: src/index.css ---
cat > src/index.css << 'EOF'
:root {
  --color-bg-primary: #0d0d0d;
  --color-bg-secondary: #1a1a1a;
  --color-bg-tertiary: #262626;
  --color-bg-quaternary: #404040;
  --color-text-primary: #ffffff;
  --color-text-secondary: #a3a3a3;
  --color-text-tertiary: #737373;
  --color-brand-blue: #3b82f6;
  --color-brand-purple: #8b5cf6;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
  --border-radius: 12px;
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
}

body {
  margin: 0;
  font-family: var(--font-family);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

* {
  box-sizing: border-box;
}

button {
  font-family: inherit;
}

input, textarea, select {
  font-family: inherit;
}

a {
  color: var(--color-brand-blue);
  text-decoration: none;
}
a:hover {
  text-decoration: underline;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.error {
  color: var(--color-danger);
  margin-top: 0.5rem;
  font-size: 0.875rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  background-color: var(--color-bg-tertiary);
  border: 1px solid var(--color-bg-quaternary);
  border-radius: var(--border-radius);
  color: var(--color-text-primary);
  transition: border-color 0.2s;
}
.form-control:focus {
  outline: none;
  border-color: var(--color-brand-blue);
}
EOF

# --- CONTEXT FILES ---
# --- FILE: src/context/AuthContext.js ---
cat > src/context/AuthContext.js << 'EOF'
import React, { createContext, useState, useContext, useEffect } from 'react';
import { useApi } from './ApiContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { api } = useApi();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      api.get('/api/auth/me')
        .then(res => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [api]);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    toast.success('Logged out successfully.');
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
EOF

# --- FILE: src/context/ApiContext.js ---
cat > src/context/ApiContext.js << 'EOF'
import React, { createContext, useContext } from 'react';
import axios from 'axios';

const ApiContext = createContext();

export const useApi = () => useContext(ApiContext);

export const ApiProvider = ({ children }) => {
  const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || '',
  });

  return (
    <ApiContext.Provider value={{ api }}>
      {children}
    </ApiContext.Provider>
  );
};
EOF

# --- FILE: src/context/UIContext.js ---
cat > src/context/UIContext.js << 'EOF'
import React, { createContext, useState, useContext } from 'react';

const UIContext = createContext();

export const useUI = () => useContext(UIContext);

export const UIProvider = ({ children }) => {
  const [modal, setModal] = useState({ open: false, view: null, data: null });

  const openModal = (view, data = null) => setModal({ open: true, view, data });
  const closeModal = () => setModal({ open: false, view: null, data: null });

  return (
    <UIContext.Provider value={{ modal, openModal, closeModal }}>
      {children}
    </UIContext.Provider>
  );
};
EOF

# --- HOOKS ---
# --- FILE: src/hooks/useFetch.js ---
cat > src/hooks/useFetch.js << 'EOF'
import { useState, useEffect } from 'react';
import { useApi } from '../context/ApiContext';
import toast from 'react-hot-toast';

export const useFetch = (url, dependencies = []) => {
  const { api } = useApi();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    api.get(url)
      .then(res => {
        if (isMounted) setData(res.data);
      })
      .catch(err => {
        if (isMounted) {
          console.error(err);
          setError(err);
          toast.error(`Failed to load data from ${url}`);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  return { data, loading, error, refetch: () => {
    setLoading(true);
    api.get(url).then(res => setData(res.data)).catch(setError).finally(() => setLoading(false));
  } };
};
EOF

# --- UTILS ---
# --- FILE: src/utils/formatters.js ---
cat > src/utils/formatters.js << 'EOF'
export const formatCurrency = (amount, currency = 'USD') => {
  if (typeof amount !== 'number') return 'N/A';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleString();
};

export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
EOF

# --- COMPONENTS ---
# --- FILE: src/components/ErrorBoundary.js ---
cat > src/components/ErrorBoundary.js << 'EOF'
import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h1>Something went wrong.</h1>
          <p>We're sorry, but an unexpected error occurred.</p>
          <Link to="/dashboard"><button>Go to Dashboard</button></Link>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOF

# --- FILE: src/components/Layout.js ---
cat > src/components/Layout.js << 'EOF'
import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ModalManager from './UI/ModalManager';
import styles from './Layout.module.css';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Fintech Pro</h2>
        </div>
        <nav className={styles.nav}>
          <Link to="/dashboard" className={`${styles.link} ${isActive('/dashboard') ? styles.active : ''}`}>Dashboard</Link>
          <Link to="/wallets" className={`${styles.link} ${isActive('/wallets') ? styles.active : ''}`}>Wallets</Link>
          <Link to="/cards" className={`${styles.link} ${isActive('/cards') ? styles.active : ''}`}>Cards</Link>
          <Link to="/nfts" className={`${styles.link} ${isActive('/nfts') ? styles.active : ''}`}>NFTs</Link>
          <Link to="/transactions" className={`${styles.link} ${isActive('/transactions') ? styles.active : ''}`}>Transactions</Link>
        </nav>
        <div className={styles.navBottom}>
          <Link to="/kyc" className={`${styles.link} ${isActive('/kyc') ? styles.active : ''}`}>KYC</Link>
          <Link to="/settings" className={`${styles.link} ${isActive('/settings') ? styles.active : ''}`}>Settings</Link>
          <button onClick={logout} className={styles.logoutBtn}>Log Out</button>
        </div>
      </aside>
      <main className={styles.main}>
        <header className={styles.header}>
          <span>Welcome, {user?.name || 'User'}</span>
        </header>
        <div className={styles.content}>
          <Outlet />
        </div>
      </main>
      <ModalManager />
    </div>
  );
};

export default Layout;
EOF

# --- FILE: src/components/Layout.module.css ---
cat > src/components/Layout.module.css << 'EOF'
.layout { display: flex; min-height: 100vh; }
.sidebar { width: 260px; background-color: var(--color-bg-secondary); padding: 2rem 1rem; display: flex; flex-direction: column; border-right: 1px solid var(--color-bg-tertiary); }
.logo { margin-bottom: 3rem; text-align: center; }
.logo h2 { margin: 0; color: var(--color-brand-purple); font-weight: 700; }
.nav { flex-grow: 1; }
.link { display: block; padding: 0.75rem 1rem; color: var(--color-text-secondary); border-radius: var(--border-radius); margin-bottom: 0.5rem; text-decoration: none; transition: all 0.2s ease-in-out; }
.link:hover { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); text-decoration: none; transform: translateX(4px); }
.link.active { background-color: var(--color-brand-purple); color: white; }
.navBottom { border-top: 1px solid var(--color-bg-tertiary); padding-top: 1.5rem; }
.logoutBtn { width: 100%; padding: 0.75rem 1rem; background: none; border: none; color: var(--color-danger); text-align: left; cursor: pointer; border-radius: var(--border-radius); font-size: 1rem; font-weight: 500; }
.logoutBtn:hover { background-color: rgba(239, 68, 68, 0.1); }
.main { flex-grow: 1; display: flex; flex-direction: column; }
.header { padding: 1.5rem 2rem; background-color: var(--color-bg-secondary); border-bottom: 1px solid var(--color-bg-tertiary); font-size: 1.25rem; font-weight: 600; }
.content { padding: 2rem; flex-grow: 1; overflow-y: auto; }
EOF

# --- UI COMPONENTS ---
# --- FILE: src/components/UI/Spinner.js ---
cat > src/components/UI/Spinner.js << 'EOF'
import React from 'react';
import styles from './Spinner.module.css';

const Spinner = ({ size = 'medium' }) => <div className={`${styles.spinner} ${styles[size]}`}></div>;

export default Spinner;
EOF

# --- FILE: src/components/UI/Spinner.module.css ---
cat > src/components/UI/Spinner.module.css << 'EOF'
.spinner { border: 3px solid var(--color-bg-tertiary); border-top: 3px solid var(--color-brand-purple); border-radius: 50%; animation: spin 1s linear infinite; margin: 2rem auto; }
.small { width: 20px; height: 20px; border-width: 2px; }
.medium { width: 40px; height: 40px; }
.large { width: 60px; height: 60px; border-width: 4px; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
EOF

# --- FILE: src/components/UI/Button.js ---
cat > src/components/UI/Button.js << 'EOF'
import React from 'react';
import styles from './Button.module.css';

const Button = ({ children, variant = 'primary', size = 'medium', disabled, ...props }) => {
  const className = `${styles.button} ${styles[variant]} ${styles[size]}`;
  return (
    <button className={className} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export default Button;
EOF

# --- FILE: src/components/UI/Button.module.css ---
cat > src/components/UI/Button.module.css << 'EOF'
.button { font-weight: 600; border-radius: var(--border-radius); border: none; cursor: pointer; transition: all 0.2s ease-in-out; position: relative; overflow: hidden; }
.button:disabled { opacity: 0.5; cursor: not-allowed; }
.button:active:not(:disabled) { transform: scale(0.98); }
.primary { background-color: var(--color-brand-purple); color: white; }
.primary:hover:not(:disabled) { background-color: #7c3aed; box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); }
.secondary { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
.secondary:hover:not(:disabled) { background-color: var(--color-bg-quaternary); }
.danger { background-color: var(--color-danger); color: white; }
.danger:hover:not(:disabled) { background-color: #dc2626; }
.small { padding: 0.5rem 1rem; font-size: 0.875rem; }
.medium { padding: 0.75rem 1.5rem; font-size: 1rem; }
.large { padding: 1rem 2rem; font-size: 1.1rem; }
.fullWidth { width: 100%; }
EOF

# --- FILE: src/components/UI/Modal.js ---
cat > src/components/UI/Modal.js << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom';
import styles from './Modal.module.css';

const modalRoot = document.getElementById('modal-root');

const Modal = ({ children, onClose }) => {
  return ReactDOM.createPortal(
    <>
      <div className={styles.overlay} onClick={onClose}></div>
      <div className={styles.modal}>
        {children}
      </div>
    </>,
    modalRoot
  );
};

export default Modal;
EOF

# --- FILE: src/components/UI/Modal.module.css ---
cat > src/components/UI/Modal.module.css << 'EOF'
.overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.6); z-index: 1000; display: flex; justify-content: center; align-items: center; backdrop-filter: blur(4px); }
.modal { background-color: var(--color-bg-secondary); border-radius: var(--border-radius); width: 90%; max-width: 500px; max-height: 90vh; overflow-y: auto; z-index: 1001; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); animation: slideIn 0.3s ease-out; }
@keyframes slideIn { from { transform: translateY(-50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
.modalHeader { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--color-bg-tertiary); }
.modalHeader h2 { margin: 0; }
.closeBtn { background: none; border: none; font-size: 1.5rem; color: var(--color-text-secondary); cursor: pointer; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.closeBtn:hover { background-color: var(--color-bg-tertiary); color: var(--color-text-primary); }
.modalBody { padding: 1.5rem; }
.modalActions { display: flex; justify-content: flex-end; gap: 1rem; padding: 1.5rem; border-top: 1px solid var(--color-bg-tertiary); }
.formGroup { margin-bottom: 1.5rem; text-align: left; }
.formGroup label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: var(--color-text-secondary); }
.formGroup input, .formGroup select, .formGroup textarea { width: 100%; padding: 0.75rem; background-color: var(--color-bg-tertiary); border: 1px solid var(--color-bg-quaternary); border-radius: var(--border-radius); color: var(--color-text-primary); }
.formGroup .error { color: var(--color-danger); font-size: 0.875rem; margin-top: 0.25rem; }
.stepIndicator { display: flex; justify-content: center; margin-bottom: 2rem; }
.step { flex: 1; text-align: center; position: relative; }
.step:not(:last-child)::after { content: ''; position: absolute; top: 15px; left: 50%; width: 100%; height: 2px; background-color: var(--color-bg-quaternary); z-index: 0; }
.step.active:not(:last-child)::after { background-color: var(--color-brand-purple); }
.stepNumber { width: 30px; height: 30px; border-radius: 50%; background-color: var(--color-bg-quaternary); color: var(--color-text-tertiary); display: inline-flex; align-items: center; justify-content: center; font-weight: bold; margin-bottom: 0.5rem; position: relative; z-index: 1; }
.step.active .stepNumber { background-color: var(--color-brand-purple); color: white; }
.stepLabel { font-size: 0.875rem; color: var(--color-text-tertiary); }
.step.active .stepLabel { color: var(--color-text-primary); font-weight: 600; }
EOF

# --- FILE: src/components/UI/ModalManager.js ---
cat > src/components/UI/ModalManager.js << 'EOF'
import React from 'react';
import { useUI } from '../../context/UIContext';
import Modal from './Modal';
import CreateWalletModal from '../Wallets/CreateWalletModal';
import WalletDetailsModal from '../Wallets/WalletDetailsModal';
import SendFundsModal from '../Wallets/SendFundsModal';
import CreateCardModal from '../Cards/CreateCardModal';
import CardDetailsModal from '../Cards/CardDetailsModal';

const MODAL_COMPONENTS = {
  CREATE_WALLET: CreateWalletModal,
  WALLET_DETAILS: WalletDetailsModal,
  SEND_FUNDS: SendFundsModal,
  CREATE_CARD: CreateCardModal,
  CARD_DETAILS: CardDetailsModal,
};

const ModalManager = () => {
  const { modal, closeModal } = useUI();
  if (!modal.open) return null;

  const SpecificModal = MODAL_COMPONENTS[modal.view];

  return (
    <Modal onClose={closeModal}>
      <SpecificModal data={modal.data} onClose={closeModal} />
    </Modal>
  );
};

export default ModalManager;
EOF

# --- AUTH COMPONENTS ---
# --- FILE: src/components/Auth/LoginForm.js ---
cat > src/components/Auth/LoginForm.js << 'EOF'
import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../UI/Button';
import styles from './LoginForm.module.css';

const LoginForm = () => {
  const [email, setEmail] = useState('user@example.com');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1>Welcome Back</h1>
      <p className={styles.subtitle}>Login to your Fintech Pro account</p>
      <div className="formGroup">
        <label htmlFor="email">Email</label>
        <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="formGroup">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </div>
      {error && <p className="error">{error}</p>}
      <Button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Logging in...' : 'Login'}
      </Button>
    </form>
  );
};

export default LoginForm;
EOF

# --- FILE: src/components/Auth/LoginForm.module.css ---
cat > src/components/Auth/LoginForm.module.css << 'EOF'
.form { max-width: 420px; margin: 5rem auto; padding: 2.5rem; background-color: var(--color-bg-secondary); border-radius: var(--border-radius); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); text-align: center; }
.form h1 { margin-bottom: 0.5rem; color: var(--color-text-primary); }
.subtitle { color: var(--color-text-secondary); margin-bottom: 2rem; }
.button { width: 100%; margin-top: 1rem; }
EOF

# --- PAGES ---
# --- FILE: src/pages/LoginPage.js ---
cat > src/pages/LoginPage.js << 'EOF'
import React from 'react';
import LoginForm from '../components/Auth/LoginForm';

const LoginPage = () => {
  return (
    <div style={{ backgroundColor: 'var(--color-bg-primary)', minHeight: '100vh' }}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;
EOF

# --- FILE: src/pages/DashboardPage.js ---
cat > src/pages/DashboardPage.js << 'EOF'
import React from 'react';
import { useFetch } from '../hooks/useFetch';
import { formatCurrency } from '../utils/formatters';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import StatsCard from '../components/Dashboard/StatsCard';
import SpendingChart from '../components/Dashboard/SpendingChart';
import RecentTransactions from '../components/Dashboard/RecentTransactions';
import styles from './DashboardPage.module.css';

function DashboardPage() {
  const { data, loading } = useFetch('/api/dashboard');

  return (
    <div>
      <h1>Dashboard</h1>
      <div className={styles.grid}>
        {loading ? (
          <>
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
            <Skeleton height={120} borderRadius={12} />
          </>
        ) : (
          <>
            <StatsCard title="Total Balance" value={formatCurrency(data?.total_balance_usd || 0)} icon="💰" />
            <StatsCard title="Monthly Spending" value={formatCurrency(data?.monthly_spending || 0)} icon="📉" />
            <StatsCard title="Active Cards" value={data?.active_cards || 0} icon="💳" />
            <StatsCard title="KYC Status" value={data?.kyc_status || 'N/A'} icon="✅" />
          </>
        )}
      </div>
      <div className={styles.chartsSection}>
        <div className={styles.chartContainer}>
          <h2>Spending Overview</h2>
          <SpendingChart />
        </div>
        <div className={styles.transactionsContainer}>
          <h2>Recent Transactions</h2>
          <RecentTransactions />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
EOF

# --- FILE: src/pages/DashboardPage.module.css ---
cat > src/pages/DashboardPage.module.css << 'EOF'
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.5rem; margin-top: 2rem; }
.chartsSection { display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-top: 2rem; }
.chartContainer, .transactionsContainer { background-color: var(--color-bg-secondary); padding: 1.5rem; border-radius: var(--border-radius); border: 1px solid var(--color-bg-tertiary); }
.chartContainer h2, .transactionsContainer h2 { margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; color: var(--color-text-secondary); }
@media (max-width: 1024px) {
  .chartsSection { grid-template-columns: 1fr; }
}
EOF

# --- DASHBOARD COMPONENTS ---
# --- FILE: src/components/Dashboard/StatsCard.js ---
cat > src/components/Dashboard/StatsCard.js << 'EOF'
import React from 'react';
import styles from './StatsCard.module.css';

const StatsCard = ({ title, value, icon }) => {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3>{title}</h3>
        <span className={styles.icon}>{icon}</span>
      </div>
      <p className={styles.value}>{value}</p>
    </div>
  );
};

export default StatsCard;
EOF

# --- FILE: src/components/Dashboard/StatsCard.module.css ---
cat > src/components/Dashboard/StatsCard.module.css << 'EOF'
.card { background-color: var(--color-bg-secondary); padding: 1.5rem; border-radius: var(--border-radius); border: 1px solid var(--color-bg-tertiary); transition: transform 0.2s, box-shadow 0.2s; }
.card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
.header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
.card h3 { margin: 0; color: var(--color-text-secondary); font-size: 0.9rem; font-weight: 500; text-transform: uppercase; }
.icon { font-size: 1.5rem; }
.value { font-size: 2rem; font-weight: 700; margin: 0; color: var(--color-brand-purple); }
EOF

# --- FILE: src/components/Dashboard/SpendingChart.js ---
cat > src/components/Dashboard/SpendingChart.js << 'EOF'
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useFetch } from '../../hooks/useFetch';

const SpendingChart = () => {
  const { data, loading } = useFetch('/api/dashboard/spending-chart');

  if (loading) return <div style={{height: '250px'}}><Skeleton /></div>;

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg-tertiary)" />
        <XAxis dataKey="day" stroke="var(--color-text-secondary)" />
        <YAxis stroke="var(--color-text-secondary)" />
        <Tooltip contentStyle={{ backgroundColor: 'var(--color-bg-tertiary)', border: 'none', borderRadius: '8px' }} />
        <Bar dataKey="spending" fill="var(--color-brand-purple)" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SpendingChart;
EOF

# --- FILE: src/components/Dashboard/RecentTransactions.js ---
cat > src/components/Dashboard/RecentTransactions.js << 'EOF'
import React from 'react';
import { useFetch } from '../../hooks/useFetch';
import { formatDate, formatCurrency } from '../../utils/formatters';
import Skeleton from 'react-loading-skeleton';
import styles from './RecentTransactions.module.css';

const RecentTransactions = () => {
  const { data: transactions, loading } = useFetch('/api/transactions?limit=5');

  return (
    <div>
      {loading ? (
        <Skeleton count={5} height={60} style={{ marginBottom: '0.5rem' }} />
      ) : (
        transactions?.map(tx => (
          <div key={tx.id} className={styles.item}>
            <div>
              <p className={styles.message}>{tx.message}</p>
              <p className={styles.date}>{formatDate(tx.created_at)}</p>
            </div>
            <p className={`${styles.amount} ${tx.type === 'sent' ? styles.negative : styles.positive}`}>
              {tx.type === 'sent' ? '-' : '+'}{formatCurrency(tx.amount, tx.currency)}
            </p>
          </div>
        ))
      )}
    </div>
  );
};

export default RecentTransactions;
EOF

# --- FILE: src/components/Dashboard/RecentTransactions.module.css ---
cat > src/components/Dashboard/RecentTransactions.module.css << 'EOF'
.item { display: flex; justify-content: space-between; align-items: center; padding: 0.75rem 0; border-bottom: 1px solid var(--color-bg-tertiary); }
.item:last-child { border-bottom: none; }
.message { margin: 0; font-weight: 500; }
.date { margin: 0; font-size: 0.8rem; color: var(--color-text-tertiary); }
.amount { margin: 0; font-weight: 600; }
.positive { color: var(--color-success); }
.negative { color: var(--color-danger); }
EOF

# --- Due to the length, I will provide the remaining files in the next response. ---
echo "Part 1 of the advanced script has finished. Please run the next part of the script."
