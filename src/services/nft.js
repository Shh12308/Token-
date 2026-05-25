import axios from 'axios';
import { API_URL } from '../config/api';

export const getNFTs = async (walletAddress) => {
  try {
    // Call your backend endpoint
    const response = await axios.get(`${API_URL}/api/nfts`, {
      params: { owner: walletAddress }
    });
    return response.data.ownedNfts;
  } catch (error) {
    console.error("Error fetching NFTs", error);
    return [];
  }
};
