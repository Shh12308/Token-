import React from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
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

// Auth pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'

// We separate the inner content to access useLocation (which requires the Router context)
const AnimatedRoutes = () => {
  const location = useLocation()

  return (
    <AnimatePresence mode="wait">
      {/* Passing location and key ensures AnimatePresence triggers animations on route change */}
      <Routes location={location} key={location.pathname}>
        
        <Route path="/" element={<Home />} />
        
        <Route path="/home" element={<Home />} />
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

const App = () => {
  return (
    // The Router provides the context for useNavigate, useLocation, and Routes to work
    <Router>
      <AnimatedRoutes />
    </Router>
  )
}

export default App
