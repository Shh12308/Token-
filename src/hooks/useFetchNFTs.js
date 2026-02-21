// src/hooks/useFetchNFTs.js
import { useState, useEffect } from 'react';
import { nftService } from '../services/nftService'; // We'll define this service next

export const useFetchNFTs = (chainId, marketAddress) => {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      if (!chainId || !marketAddress) return;
      
      setIsLoading(true);
      try {
        const listings = await nftService.getMarketplaceListings(chainId, marketAddress);
        setNfts(listings);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [chainId, marketAddress]);

  return { nfts, isLoading, error };
};
