// src/context/TradingContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';

const TradingContext = createContext();

export const useTrading = () => useContext(TradingContext);

export const TradingProvider = ({ children }) => {
  const [balances, setBalances] = useState({});
  const [kycStatus, setKycStatus] = useState('pending'); // pending, verified, rejected
  const [isLoading, setIsLoading] = useState(true);

  const fetchAccountData = async () => {
    try {
      const { data } = await api.get('/account'); // Protected route
      setBalances(data.balances); // e.g., { ETH: '1.5', USDC: '2500' }
      setKycStatus(data.kycStatus);
    } catch (error) {
      console.error('Failed to fetch account data:', error);
      // Handle token expiry, redirect to login, etc.
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Assume we have an auth token from the login/signup flow
    const token = localStorage.getItem('authToken');
    if (token) {
      fetchAccountData();
    } else {
      setIsLoading(false);
    }
  }, []);

  const buyAsset = async (asset, amount, fiatCurrency) => {
    // This doesn't interact with the blockchain directly
    // It creates an order on your backend
    const { data } = await api.post('/orders/buy', { asset, amount, fiatCurrency });
    // Backend will handle payment via Stripe/Plaid and update the user's balance
    return data;
  };

  const sellAsset = async (asset, amount) => {
    const { data } = await api.post('/orders/sell', { asset, amount });
    // Backend will credit the user's bank account and deduct the balance
    return data;
  };

  const value = {
    balances,
    kycStatus,
    isLoading,
    buyAsset,
    sellAsset,
    refetch: fetchAccountData,
  };

  return <TradingContext.Provider value={value}>{children}</TradingContext.Provider>;
};
