import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  getMyNFTs,
  getNFTListings,
} from "../services/nftApi";

import NftCard from "../components/nft/NftCard";
import NftCardSkeleton from "../components/nft/NftCardSkeleton";
import FiltersSidebar from "../components/nft/FiltersSidebar";
import NftDetailsModal from "../components/nft/NftDetailsModal";
import PurchaseModal from "../components/nft/PurchaseModal";

const NftMarketplace = () => {
  const [nfts, setNfts] = useState([]);
  const [listings, setListings] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    status: "all",
    chain: "all",
    category: "all",
    priceMin: "",
    priceMax: "",
  });

  const [sortBy, setSortBy] = useState("recently_listed");

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const [selectedNft, setSelectedNft] = useState(null);

  // ======================
  // FETCH DATA
  // ======================
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Run both endpoints in parallel
        const [myNFTs, marketplaceListings] = await Promise.all([
          getMyNFTs().catch(() => []),
          getNFTListings().catch(() => []),
        ]);

        setNfts(myNFTs || []);
        setListings(marketplaceListings || []);
      } catch (err) {
        console.error("NFT fetch error:", err);
        setError(err?.message || "Failed to load NFTs");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // ======================
  // MERGE DATA (MY NFTs + LISTINGS)
  // ======================
  const processedNfts = useMemo(() => {
    let combined = [
      ...nfts.map(n => ({ ...n, source: "owned" })),
      ...listings.map(n => ({ ...n, source: "marketplace" })),
    ];

    // Sorting
    switch (sortBy) {
      case "price_low_to_high":
        combined.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;

      case "price_high_to_low":
        combined.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;

      case "recently_listed":
      default:
        combined.sort(
          (a, b) =>
            new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
    }

    return combined;
  }, [nfts, listings, sortBy]);

  // ======================
  // FILTERS
  // ======================
  const handleFilterChange = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  // ======================
  // MODALS
  // ======================
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

  // ======================
  // UI
  // ======================
  return (
    <div className="nft-browse-page">
      <h1>NFT Marketplace</h1>

      <FiltersSidebar
        filters={filters}
        onChange={handleFilterChange}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* ERROR */}
      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          Error: {error}
        </div>
      )}

      {/* GRID */}
      <div className="nfts-grid">
        {isLoading &&
          Array.from({ length: 8 }).map((_, i) => (
            <NftCardSkeleton key={i} />
          ))}

        {!isLoading &&
          !error &&
          processedNfts.map((nft) => (
            <NftCard
              key={nft._id || nft.id}
              nft={nft}
              onClick={() => openNftDetails(nft)}
            />
          ))}
      </div>

      {/* DETAILS MODAL */}
      {isDetailsModalOpen && (
        <NftDetailsModal
          nft={selectedNft}
          onClose={closeNftDetails}
          onPurchaseClick={openPurchaseFlow}
        />
      )}

      {/* PURCHASE MODAL */}
      {isPurchaseModalOpen && (
        <PurchaseModal
          nft={selectedNft}
          onClose={closePurchaseFlow}
        />
      )}
    </div>
  );
};

export default NftMarketplace;
