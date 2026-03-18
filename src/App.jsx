import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Web3Provider } from './context/Web3Context';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import GlobalStyles from './styles/GlobalStyles';
import { AnimatePresence } from 'framer-motion';

// Import Components
import SplashScreen from './components/SplashScreen';
import Onboarding from './components/Onboarding';
import Home from './pages/Home';
import Wallet from './pages/Wallet';
import SettingsPage from './pages/SettingsPage';
import CryptoSticks from './pages/CryptoSticks';
import Search from './pages/Search';
import NFTMarketplace from './pages/NFTMarketplace';
import DeFi from './pages/DeFi';
import Activity from './pages/Activity';
import Security from './pages/Security';
import Browser from './pages/Browser';
import Profile from './pages/Profile';
import LockScreen from './components/LockScreen';

const App = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem('cryptoBean_onboarded');
    const isLockedState = localStorage.getItem('cryptoBean_locked');

    setTimeout(() => {
      setIsLoading(false);
      setIsOnboarded(hasOnboarded === 'true');
      setIsLocked(isLockedState === 'true');
    }, 2000);
  }, []);

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <Provider store={store}>
      <Web3Provider>
        <ThemeProvider>
          <NotificationProvider>
            <GlobalStyles />
            <Router>
              <AnimatePresence mode="wait">
                <Routes>
                  {/* Default home route */}
                  <Route path="/" element={<Home />} />

                  {/* Conditional onboarding & lock routes */}
                  {!isOnboarded && <Route path="/onboarding" element={<Onboarding />} />}
                  {isLocked && <Route path="/lock" element={<LockScreen />} />}

                  {/* Other pages */}
                  <Route path="/wallet" element={<Wallet />} />
                  <Route path="/crypto-sticks" element={<CryptoSticks />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/nft" element={<NFTMarketplace />} />
                  <Route path="/defi" element={<DeFi />} />
                  <Route path="/activity" element={<Activity />} />
                  <Route path="/browser" element={<Browser />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/profile" element={<Profile />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </Router>
          </NotificationProvider>
        </ThemeProvider>
      </Web3Provider>
    </Provider>
  );
};

export default App;
