// src/services/nftService.js
import { ethers } from 'ethers';
import { MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI } from '../utils/constants';
import { useApolloClient } from '@apollo/client'; // We'll add Apollo for The Graph

// Note: You'll need to set up Apollo Client in your app
// npm install @apollo/client graphql

export const nftService = {
  // List an NFT
  listItem: async (signer, nftAddress, tokenId, price, isERC1155 = false, quantity = 1) => {
    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
    const priceInWei = ethers.utils.parseUnits(price, 'ether');
    const tx = await marketplaceContract.listItem(nftAddress, tokenId, priceInWei, isERC1155, quantity);
    return tx.wait(); // Wait for the transaction to be mined
  },

  // Buy an NFT
  buyItem: async (signer, listingId, price) => {
    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
    const priceInWei = ethers.utils.parseUnits(price, 'ether');
    const tx = await marketplaceContract.buyItem(listingId, { value: priceInWei });
    return tx.wait();
  },

  // Cancel a listing
  cancelListing: async (signer, listingId) => {
    const marketplaceContract = new ethers.Contract(MARKETPLACE_CONTRACT_ADDRESS, MARKETPLACE_ABI, signer);
    const tx = await marketplaceContract.cancelListing(listingId);
    return tx.wait();
  },
  
  // Fetch listings from The Graph
  fetchListings: async (apolloClient) => {
    const GET_LISTINGS = `
      query GetActiveListings {
        listings(first: 100, orderBy: listingId, orderDirection: desc) {
          listingId
          seller
          nftAddress
          tokenId
          price
          isERC1155
          quantity
        }
      }
    `;
    const { data } = await apolloClient.query({ query: GET_LISTINGS });
    return data.listings;
  }
};
