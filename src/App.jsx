import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'

// Pages
import Home from './pages/Home'
import Wallet from './pages/Wallet'
import SettingsPage from './pages/SettingsPage'
import CryptoSticks from './pages/CryptoSticks'
import Search from './pages/Search'
import NftMarketplace from './pages/NftMarketplace'
import Activity from './pages/Activity'
import Security from './pages/Security'
import Browser from './pages/Browser'
import Profile from './pages/Profile'

// Auth pages (optional, still accessible)
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

const App = () => {
  return (
    <AnimatePresence mode="wait">
      <Routes>

        <Route path="/" element={<Home />} />
    
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/crypto-sticks" element={<CryptoSticks />} />
        <Route path="/search" element={<Search />} />
        <Route path="/nft" element={<NftMarketplace />} />
        <Route path="/activity" element={<Activity />} />
        <Route path="/browser" element={<Browser />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/security" element={<Security />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/auth/login" element={<LoginPage />} />
        <Route path="/auth/register" element={<RegisterPage />} />

      </Routes>
    </AnimatePresence>
  )
}

export default App
