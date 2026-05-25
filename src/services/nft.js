import axios from 'axios';

const ALCHEMY_KEY = 'YOUR_ALCHEMY_KEY';
const BASE_URL = `https://eth-mainnet.g.alchemy.com/nft/v2/${ALCHEMY_KEY}`;

export const getNFTs = async (walletAddress) => {
  try {
    const response = await axios.get(`${BASE_URL}/getNFTs`, {
      params: {
        owner: walletAddress,
        withMetadata: 'true', // Gets image URLs
      },
    });
    
    // Filter out spam/scam NFTs
    return response.data.ownedNfts.filter(nft => nft.media && nft.media[0].gateway);
  } catch (error) {
    console.error("Error fetching NFTs", error);
    return [];
  }
};
