import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';

// Pages
import Home from '../pages/Home';
import KYCPage from '../pages/KYCPage';
import Wallet from '../pages/Wallet';
import SettingsPage from '../pages/SettingsPage';
import CryptoSticks from '../pages/CryptoSticks';
import Search from '../pages/Search';
import NftMarketplace from '../pages/NftMarketplace';
import Activity from '../pages/Activity';
import Security from '../pages/Security';
import CoinPricePage from '../pages/CoinPricePage';

import Profile from '../pages/Profile';

// Auth
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

// 404 page
import NotFound from '../pages/NotFound';

const AppRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/kyc" element={<KYCPage />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/crypto-sticks" element={<CryptoSticks />} />
        <Route path="/search" element={<Search />} />
        <Route path="/nft" element={<NftMarketplace />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/coinprice" element={<CoinPricePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/security" element={<Security />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

        {/* ✅ 404 CATCH-ALL ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

export default AppRoutes;
