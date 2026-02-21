// src/screens/NFTMarketplaceScreen.jsx
import React, { useState, useEffect } from 'react';
import { useWallet } from '../context/WalletContext';
import { useApolloClient } from '@apollo/client';
import { nftService } from '../services/nftService';
import NFTCard from '../components/NFTCard'; // A component to display a single NFT
import ListNFTScreen from './ListNFTScreen';

const NFTMarketplaceScreen = () => {
  const { pushScreen } = useNavigation();
  const { signer, address } = useWallet();
  const apolloClient = useApolloClient();
  const [listings, setListings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadListings = async () => {
      try {
        const listingsData = await nftService.fetchListings(apolloClient);
        // You might need to fetch metadata for each NFT here
        setListings(listingsData);
      } catch (error) {
        console.error("Failed to fetch listings:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadListings();
  }, [apolloClient]);

  const handleBuy = async (listing) => {
    if (!signer) return toast.error("Please connect your wallet.");
    try {
      toast.loading('Processing purchase...');
      await nftService.buyItem(signer, listing.listingId, ethers.utils.formatEther(listing.price));
      toast.dismiss();
      toast.success('NFT purchased successfully!');
      // Refetch listings to update the UI
      // loadListings();
    } catch (error) {
      toast.dismiss();
      toast.error(error.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">NFT Marketplace</h1>
        <button 
          onClick={() => pushScreen(<ListNFTScreen />, 'List NFT')}
          className="bg-blue-600 p-2 rounded-lg"
        >
          List NFT
        </button>
      </div>

      {isLoading ? (
        <p>Loading listings...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <NFTCard
              key={listing.listingId}
              listing={listing}
              onBuy={() => handleBuy(listing)}
              isOwner={address === listing.seller}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NFTMarketplaceScreen;
