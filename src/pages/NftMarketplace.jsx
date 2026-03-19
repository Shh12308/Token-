import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { getNFTs } from '../services/nftApi';
import NftCard from '../components/nft/NftCard';
import NftCardSkeleton from '../components/nft/NftCardSkeleton';
import FiltersSidebar from '../components/nft/FiltersSidebar';
import NftDetailsModal from '../components/nft/NftDetailsModal';
import PurchaseModal from '../components/nft/PurchaseModal';

const NftMarketplace = () => {
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: 'all',
    chain: 'all',
    category: 'all',
    priceMin: '',
    priceMax: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recently_listed');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getNFTs('YOUR_WALLET_ADDRESS');
        setNfts(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const processedNfts = useMemo(() => {
    let filtered = [...nfts];

    switch (sortBy) {
      case 'price_low_to_high':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high_to_low':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [nfts, sortBy]);

  const handleFilterChange = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const openNftDetails = (nft) => {
    setSelectedNft(nft);
    setIsDetailsModalOpen(true);
  };

  const closeNftDetails = () => {
    setIsDetailsModalOpen(false);
    setSelectedNft(null);
  };

  const openPurchaseFlow = () => {
    setIsDetailsModalOpen(false);
    setIsPurchaseModalOpen(true);
  };

  const closePurchaseFlow = () => {
    setIsPurchaseModalOpen(false);
  };

  return (
    <div className="nft-browse-page">
      <h1>Explore NFTs</h1>

      <div className="nfts-grid">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <NftCardSkeleton key={i} />
          ))}

        {error && <div>Failed to load NFTs</div>}

        {!isLoading &&
          !error &&
          processedNfts.map((nft) => (
            <NftCard
              key={nft.id}
              nft={nft}
              onClick={() => openNftDetails(nft)}
            />
          ))}
      </div>

      {isDetailsModalOpen && (
        <NftDetailsModal
          nft={selectedNft}
          onClose={closeNftDetails}
          onPurchaseClick={openPurchaseFlow}
        />
      )}

      {isPurchaseModalOpen && (
        <PurchaseModal nft={selectedNft} onClose={closePurchaseFlow} />
      )}
    </div>
  );
};

export default NftMarketplace;
