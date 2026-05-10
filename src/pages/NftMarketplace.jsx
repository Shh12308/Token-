import React, { useState, useEffect } from "react";
import {
  getMyNFTs,
  getNFTListings,
  listNFT,
  buyNFT,
} from "../services/nftWeb3"; // Changed this line

const NftMarketplace = () => {
  const [nfts, setNfts] = useState([]);
  const [listings, setListings] = useState([]);
  const [account, setAccount] = useState(null);

  // Connect Wallet
  const connectWallet = async () => {
    if (window.ethereum) {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);
    }
  };

  useEffect(() => {
    // 1. Connect Wallet on load
    connectWallet();
  }, []);

  // 2. Fetch data when account changes
  useEffect(() => {
    if (account) {
      const loadData = async () => {
        const myNfts = await getMyNFTs();
        const marketListings = await getNFTListings();
        setNfts(myNfts);
        setListings(marketListings);
      };
      loadData();
    }
  }, [account]);

  // Handle Buy Click
  const handleBuy = async (listingId) => {
    try {
      await buyNFT(listingId);
      alert("Purchase Successful!");
      // Refresh data
      window.location.reload(); 
    } catch (error) {
      console.error(error);
      alert("Purchase failed");
    }
  };

  // Handle Sell Click
  const handleSell = async (tokenId, price) => {
    try {
      await listNFT(tokenId, price);
      alert("Listed successfully!");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Listing failed");
    }
  };

  return (
    <div>
      <h1>OXT NFT Marketplace</h1>
      <p>Connected: {account}</p>
      
      <h2>My NFTs</h2>
      <div className="grid">
        {nfts.map(nft => (
          <div key={nft.id} className="card">
            <p>Token ID: {nft.tokenId}</p>
            <button onClick={() => handleSell(nft.tokenId, 1)}>Sell for 1 OXT</button>
          </div>
        ))}
      </div>

      <h2>Marketplace</h2>
      <div className="grid">
        {listings.map(list => (
          <div key={list.id} className="card">
            <p>Price: {list.price} OXT</p>
            <button onClick={() => handleBuy(list.tokenId)}>Buy Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NftMarketplace;
