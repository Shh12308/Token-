import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

const ProtectedRoute = ({ children, isAuthenticated, isLocked }) => {
  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
  if (isLocked) return <Navigate to="/lock" replace />;
  return children;
};

const App = () => {
  const location = useLocation();

  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    try {
      const hasOnboarded = localStorage.getItem('cryptoBean_onboarded');
      const isLockedState = localStorage.getItem('cryptoBean_locked');
      const authState = localStorage.getItem('cryptoBean_auth');

      setTimeout(() => {
        setIsLoading(false);
        setIsOnboarded(hasOnboarded === 'true');
        setIsLocked(isLockedState === 'true');
        setIsAuthenticated(authState === 'true');
      }, 1000);
    } catch (err) {
      console.error("App init error:", err);
      setIsLoading(false);
    }
  }, []);

  if (isLoading) return <SplashScreen />;

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>

        <Route
          path="/"
          element={
            !isOnboarded ? <Navigate to="/onboarding" replace /> :
            !isAuthenticated ? <Navigate to="/auth/login" replace /> :
            isLocked ? <Navigate to="/lock" replace /> :
            <Navigate to="/home" replace />
          }
        />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/lock" element={<LockScreen />} />

        <Route path="/home" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Home />
          </ProtectedRoute>
        } />

        <Route path="/wallet" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Wallet />
          </ProtectedRoute>
        } />

        <Route path="/crypto-sticks" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <CryptoSticks />
          </ProtectedRoute>
        } />

        <Route path="/search" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Search />
          </ProtectedRoute>
        } />

        <Route path="/nft" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <NftMarketplace />
          </ProtectedRoute>
        } />

        <Route path="/defi" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <DeFi />
          </ProtectedRoute>
        } />

        <Route path="/activity" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Activity />
          </ProtectedRoute>
        } />

        <Route path="/browser" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Browser />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <SettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/security" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Security />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated} isLocked={isLocked}>
            <Profile />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
};

export default App;
