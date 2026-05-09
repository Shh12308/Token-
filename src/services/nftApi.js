// services/nftApi.js
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "https://blockvault-backend-production.up.railway.app";

// ======================
// Helper: Auth headers
// ======================
const authHeaders = () => {
  const authToken = localStorage.getItem("authToken");

  return {
    headers: {
      Authorization: authToken ? `Bearer ${authToken}` : "",
    },
  };
};

// ======================
// NFT COLLECTIONS
// ======================

// Create NFT collection
export const createNFTCollection = async (formData) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/nft/collections`,
      formData,
      {
        ...authHeaders(),
        headers: {
          ...authHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("createNFTCollection error:", err.response?.data || err.message);
    throw err;
  }
};

// Get all collections (public)
export const getNFTCollections = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/nft/collections`);
    return res.data;
  } catch (err) {
    console.error("getNFTCollections error:", err.response?.data || err.message);
    throw err;
  }
};

// Get single collection
export const getNFTCollection = async (collectionId) => {
  try {
    const res = await axios.get(
      `${API_URL}/api/nft/collections/${collectionId}`
    );
    return res.data;
  } catch (err) {
    console.error("getNFTCollection error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// MINT NFT
// ======================
export const mintNFT = async (formData) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/nft/mint`,
      formData,
      {
        ...authHeaders(),
        headers: {
          ...authHeaders().headers,
          "Content-Type": "multipart/form-data",
        },
      }
    );

    return res.data;
  } catch (err) {
    console.error("mintNFT error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// LISTING
// ======================

// List NFT for sale
export const listNFT = async (data) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/nft/list`,
      data,
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("listNFT error:", err.response?.data || err.message);
    throw err;
  }
};

// Cancel listing
export const cancelListing = async (listingId) => {
  try {
    const res = await axios.put(
      `${API_URL}/api/nft/listings/${listingId}/cancel`,
      {},
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("cancelListing error:", err.response?.data || err.message);
    throw err;
  }
};

// Get all listings (marketplace)
export const getNFTListings = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/nft/listings`);
    return res.data;
  } catch (err) {
    console.error("getNFTListings error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// BIDS
// ======================

// Place bid
export const placeBid = async (data) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/nft/bid`,
      data,
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("placeBid error:", err.response?.data || err.message);
    throw err;
  }
};

// Accept bid
export const acceptBid = async (bidId) => {
  try {
    const res = await axios.put(
      `${API_URL}/api/nft/bids/${bidId}/accept`,
      {},
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("acceptBid error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// BUY NFT
// ======================
export const buyNFT = async (listingId) => {
  try {
    const res = await axios.post(
      `${API_URL}/api/nft/buy/${listingId}`,
      {},
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("buyNFT error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// USER NFTS
// ======================
export const getMyNFTs = async () => {
  try {
    const res = await axios.get(
      `${API_URL}/api/nft/my`,
      authHeaders()
    );

    return res.data;
  } catch (err) {
    console.error("getMyNFTs error:", err.response?.data || err.message);
    throw err;
  }
};

// ======================
// ACTIVITY FEED
// ======================
export const getNFTActivity = async () => {
  try {
    const res = await axios.get(`${API_URL}/api/nft/activity`);
    return res.data;
  } catch (err) {
    console.error("getNFTActivity error:", err.response?.data || err.message);
    throw err;
  }
};
