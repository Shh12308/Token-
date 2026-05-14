import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// --- PAGES ---
import Home from '../pages/Home';
import Staking from '../pages/Staking';
import KYCPage from '../pages/KYCPage';
import BuyPage from '../pages/BuyPage';
import ReceivePage from '../pages/ReceivePage';
import SendPage from '../pages/SendPage';
import Search from '../pages/Search';
import NFTBrowsePage from '../pages/NFTBrowsePage';
import SwapPage from '../pages/SwapPage';
import SettingsPage from '../pages/SettingsPage';
import Security from '../pages/Security';

import Profile from '../pages/Profile';

// --- AUTH ---
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// --- 404 PAGE ---
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/stake" element={<Staking />} />
        <Route path="/kyc" element={<KYCPage />} />
        <Route path="/buy" element={<BuyPage />} />
        <Route path="/send" element={<SendPage />} />
        <Route path="/receive" element={<ReceivePage />} />
        <Route path="/nft" element={<NFTBrowsePage />} />
        <Route path="/swap" element={<SwapPage />} />
        <Route path="/security" element={<Security />} />
        <Route path="/settings" element={<SettingsPage />} />
        
        <Route path="/profile" element={<Profile />} />
        
        {/* --- AUTH PAGES --- */}
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* ✅ 404 CATCH-ALL ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
