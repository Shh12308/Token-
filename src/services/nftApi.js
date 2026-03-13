// src/services/nftApi.js

const ALCHEMY_API_KEY = process.env.VITE_ALCHEMY_API_KEY; 
// set this in your .env file
// Example: VITE_ALCHEMY_API_KEY="your-alchemy-key"

const BASE_URL = `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}`;

export async function getNFTs(ownerAddress) {
  try {
    const url = `${BASE_URL}/getNFTs/?owner=${ownerAddress}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("Failed to fetch NFTs");
    }

    const data = await res.json();

    // Simplify & return the list
    return data.ownedNfts.map((nft) => ({
      id: nft.id.tokenId,
      name: nft.title || nft.contract.address,
      image:
        nft.media[0]?.gateway ||
        "https://via.placeholder.com/200", // fallback
      contract: nft.contract.address,
    }));
  } catch (err) {
    console.error("getNFTs error:", err);
    return [];
  }
}
