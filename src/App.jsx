// src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";

// Pages (update paths to match YOUR project)
import Home from "./pages/Home";
import Wallet from "./pages/Wallet";
import SettingsPage from "./pages/SettingsPage";
import CryptoSticks from "./pages/CryptoSticks";
import Search from "./pages/Search";
import NftMarketplace from "./pages/NftMarketplace";
import DeFi from "./pages/DeFi";
import Activity from "./pages/Activity";
import Security from "./pages/Security";
import Browser from "./pages/Browser";
import Profile from "./pages/Profile";

// Auth
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";

// Other screens
import Onboarding from "./components/Onboarding";
import LockScreen from "./components/LockScreen";

// Optional fallback (create if you don’t have one)
const NotFound = () => (
  <div style={{ color: "white" }}>404 - Page Not Found</div>
);

function App() {
  return (
    <Routes>

      {/* Root */}
      <Route path="/" element={<Home />} />

      {/* Auth */}
      <Route path="/auth/login" element={<LoginPage />} />
      <Route path="/auth/register" element={<RegisterPage />} />

      {/* Setup */}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/lock" element={<LockScreen />} />

      {/* Main App */}
      <Route path="/home" element={<Home />} />
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/crypto-sticks" element={<CryptoSticks />} />
      <Route path="/search" element={<Search />} />
      <Route path="/nft" element={<NftMarketplace />} />
      <Route path="/defi" element={<DeFi />} />
      <Route path="/activity" element={<Activity />} />
      <Route path="/browser" element={<Browser />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/security" element={<Security />} />
      <Route path="/profile" element={<Profile />} />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}

export default App;
