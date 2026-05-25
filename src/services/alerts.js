import axios from 'axios';
import { API_URL } from '../config/api';

// 1. Register User (saves their wallet address + notification ID)
export const registerUser = async (walletAddress, playerId) => {
  try {
    const response = await axios.post(`${API_URL}/api/users/register`, {
      walletAddress: walletAddress,
      playerId: playerId // From OneSignal
    });
    return response.data;
  } catch (error) {
    console.error("Registration failed", error);
  }
};

// 2. Create Price Alert
export const createPriceAlert = async (walletAddress, symbol, targetPrice) => {
  try {
    const response = await axios.post(`${API_URL}/api/alerts/create`, {
      walletAddress: walletAddress,
      symbol: symbol, // e.g., "ETH"
      targetPrice: targetPrice
    });
    return response.data;
  } catch (error) {
    console.error("Alert creation failed", error);
  }
};

// 3. Get User's Active Alerts
export const getAlerts = async (walletAddress) => {
  try {
    const response = await axios.get(`${API_URL}/api/alerts/${walletAddress}`);
    return response.data;
  } catch (error) {
    console.error("Failed to fetch alerts", error);
    return [];
  }
};
