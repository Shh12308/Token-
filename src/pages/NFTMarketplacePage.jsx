// src/pages/nft/NftBrowsePage.jsx
import React, { useState, useMemo, useCallback } from 'react';
import { getNfts } from '../services/nftApi';
import NftCard from '../../components/nft/NftCard';                 // src/components/nft/NftCard.jsx
import NftCardSkeleton from '../../components/nft/NftCardSkeleton'; // src/components/nft/NftCardSkeleton.jsx
import FiltersSidebar from '../../components/nft/FiltersSidebar';   // src/components/nft/FiltersSidebar.jsx
import NftDetailsModal from '../../components/nft/NftDetailsModal'; // src/components/nft/NftDetailsModal.jsx
import PurchaseModal from '../../components/nft/PurchaseModal'; 

const NftBrowsePage = () => {
  // --- State ---
  const [filters, setFilters] = useState({
    status: 'all', // 'all', 'buy_now', 'auction'
    chain: 'all',  // 'all', 'ethereum', 'polygon', 'solana'
    category: 'all', // 'all', 'art', 'gaming', 'music'
    priceMin: '',
    priceMax: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recently_listed');
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState(null);

  // --- Data Fetching ---
  // The query will automatically refetch when its arguments change
  const { data: nfts = [], isLoading, error } = useGetNftsQuery({
    search: searchQuery,
    ...filters,
  });

  // --- Derived State (Memoized for performance) ---
  const processedNfts = useMemo(() => {
    let filtered = [...nfts];
    
    // Client-side sorting (can also be done on the backend)
    switch (sortBy) {
      case 'price_low_to_high':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high_to_low':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'most_favorited':
        filtered.sort((a, b) => b.favoriteCount - a.favoriteCount);
        break;
      default: // 'recently_listed'
        filtered.sort((a, b) => new Date(b.listedAt) - new Date(a.listedAt));
    }
    return filtered;
  }, [nfts, sortBy]);

  // --- Event Handlers ---
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
    // Optionally reset selectedNft if needed
  };

  return (
    <div className="nft-browse-page">
      {/* Header */}
      <header className="page-header">
        <div className="header-content">
          <h1>Explore NFTs</h1>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search collections, items, or users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="search-icon">🔍</button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="page-layout">
        {/* Filters Sidebar */}
        <aside className="filters-sidebar">
          <FiltersSidebar filters={filters} onChange={handleFilterChange} />
        </aside>

        {/* NFTs Grid */}
        <main className="nfts-main">
          {/* Toolbar */}
          <div className="nfts-toolbar">
            <span className="results-count">{processedNfts.length} results</span>
            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recently_listed">Recently Listed</option>
              <option value="price_low_to_high">Price: Low to High</option>
              <option value="price_high_to_low">Price: High to Low</option>
              <option value="most_favorited">Most Favorited</option>
            </select>
          </div>

          {/* Grid */}
          <div className="nfts-grid">
            {isLoading && (
              // Show skeleton loaders while fetching
              Array.from({ length: 12 }).map((_, i) => <NftCardSkeleton key={i} />)
            )}
            {error && <div className="error-message">Failed to load NFTs. Please try again.</div>}
            {!isLoading && !error && processedNfts.map((nft) => (
              <NftCard
                key={nft.id}
                nft={nft}
                onClick={() => openNftDetails(nft)}
                onBuyClick={() => openNftDetails(nft)} // Both actions open details first
              />
            ))}
          </div>
        </main>
      </div>

      {/* Modals */}
      {isDetailsModalOpen && (
        <NftDetailsModal
          nft={selectedNft}
          onClose={closeNftDetails}
          onPurchaseClick={openPurchaseFlow}
        />
      )}
      {isPurchaseModalOpen && (
        <PurchaseModal
          nft={selectedNft}
          onClose={closePurchaseFlow}
        />
      )}
    </div>
  );
};

export default NftBrowsePage;
