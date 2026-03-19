import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import GlobalStyles from './styles/GlobalStyles';
import { AnimatePresence } from 'framer-motion';

// Components
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import LockScreen from './components/LockScreen';

// Pages
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import SettingsPage from './pages/SettingsPage';
import CryptoSticks from './pages/CryptoSticks';
import Search from './pages/Search';
import NftMarketplace from './pages/NftMarketplace';
import DeFi from './pages/DeFi';
import Activity from './pages/Activity';
import Security from './pages/Security';
import Browser from './pages/Browser';
import Profile from './pages/Profile';

// ✅ Auth pages (FIXED PATH)
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('cryptoBean_onboarded');
    const isLockedState = localStorage.getItem('cryptoBean_locked');
    const authState = localStorage.getItem('cryptoBean_auth');

    setTimeout(() => {
      setIsLoading(false);
      setIsOnboarded(hasOnboarded === 'true');
      setIsLocked(isLockedState === 'true');
      setIsAuthenticated(authState === 'true');
    }, 2000);
  }, []);

  // ✅ Route protection (MetaMask-style)
  const ProtectedRoute = ({ children }) => {
    if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
    if (isLocked) return <Navigate to="/lock" replace />;
    return children;
  };

  if (isLoading) return <SplashScreen />;

  return (
    <Provider store={store}>
      <Web3Provider>
        <ThemeProvider>
          <NotificationProvider>
            <GlobalStyles />
            <AnimatePresence mode="wait">
              <Routes>

                {/* ✅ Root logic */}
                <Route
                  path="/"
                  element={
                    !isOnboarded ? <Navigate to="/onboarding" replace /> :
                    !isAuthenticated ? <Navigate to="/auth/login" replace /> :
                    isLocked ? <Navigate to="/lock" replace /> :
                    <Navigate to="/home" replace />
                  }
                />

                {/* ✅ Auth */}
                <Route path="/auth/login" element={<LoginPage />} />
                <Route path="/auth/register" element={<RegisterPage />} />

                {/* ✅ Public */}
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/lock" element={<LockScreen />} />

                {/* ✅ Protected Pages */}
                <Route path="/home" element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                } />

                <Route path="/wallet" element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                } />

                <Route path="/crypto-sticks" element={
                  <ProtectedRoute>
                    <CryptoSticks />
                  </ProtectedRoute>
                } />

                <Route path="/search" element={
                  <ProtectedRoute>
                    <Search />
                  </ProtectedRoute>
                } />

                <Route path="/nft" element={
                  <ProtectedRoute>
                    <NftMarketplace />
                  </ProtectedRoute>
                } />

                <Route path="/defi" element={
                  <ProtectedRoute>
                    <DeFi />
                  </ProtectedRoute>
                } />

                <Route path="/activity" element={
                  <ProtectedRoute>
                    <Activity />
                  </ProtectedRoute>
                } />

                <Route path="/browser" element={
                  <ProtectedRoute>
                    <Browser />
                  </ProtectedRoute>
                } />

                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />

                <Route path="/security" element={
                  <ProtectedRoute>
                    <Security />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* ✅ Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

              </Routes>
            </AnimatePresence>
          </NotificationProvider>
        </ThemeProvider>
      </Web3Provider>
    </Provider>
  );
};

export default App;
