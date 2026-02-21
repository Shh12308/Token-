// src/pages/NFTMarketplace.jsx
import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useFetchNFTs } from '../hooks/useFetchNFTs';
import Loader from '../components/Loader';
import { MARKETPLACE_CONTRACT_ADDRESS_POLYGON } from '../utils/constants'; // Define your contract addresses

const NFTMarketplace = () => {
  const { chainId, account } = useWallet();
  const { nfts, isLoading, error } = useFetchNFTs(chainId, MARKETPLACE_CONTRACT_ADDRESS_POLYGON);

  if (!account) {
    return <div>Please connect your wallet to view the marketplace.</div>;
  }

  if (isLoading) return <Loader />;
  if (error) return <div>Error loading NFTs: {error.message}</div>;

  return (
    <div>
      <h1 className="text-3xl font-bold">NFT Marketplace</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
        {nfts.map((nft) => (
          <div key={nft.tokenId} className="border rounded-lg p-4 shadow-lg">
            <img src={nft.image} alt={nft.name} className="w-full h-48 object-cover rounded" />
            <h3 className="mt-2 font-semibold">{nft.name}</h3>
            <p className="text-sm text-gray-600">{nft.price} ETH</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NFTMarketplace;
