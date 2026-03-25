import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

const App = () => {
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
      }, 1000); // 🔥 shorter delay (less chance of blank screen feeling)
    } catch (error) {
      console.error("LocalStorage error:", error);
      setIsLoading(false);
    }
  }, []);

  // ✅ safer ProtectedRoute (prevents silent crashes)
  const ProtectedRoute = ({ children }) => {
    try {
      if (!isAuthenticated) return <Navigate to="/auth/login" replace />;
      if (isLocked) return <Navigate to="/lock" replace />;
      return children;
    } catch (error) {
      console.error("ProtectedRoute error:", error);
      return <Navigate to="/auth/login" replace />;
    }
  };

  // ✅ fallback if SplashScreen crashes
  if (isLoading) {
    try {
      return <SplashScreen />;
    } catch (e) {
      console.error("SplashScreen crash:", e);
      return <div style={{ color: "white" }}>Loading...</div>;
    }
  }

  return (
    <AnimatePresence mode="wait">
      <Routes>

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

        <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
        <Route path="/crypto-sticks" element={<ProtectedRoute><CryptoSticks /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/nft" element={<ProtectedRoute><NftMarketplace /></ProtectedRoute>} />
        <Route path="/defi" element={<ProtectedRoute><DeFi /></ProtectedRoute>} />
        <Route path="/activity" element={<ProtectedRoute><Activity /></ProtectedRoute>} />
        <Route path="/browser" element={<ProtectedRoute><Browser /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        {/* ✅ fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AnimatePresence>
  );
};

export default App;
