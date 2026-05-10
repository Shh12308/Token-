// utils/contracts.js

// Minimal ERC721 ABI (The NFT Contract)
export const NFT_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function ownerOf(uint256 tokenId) view returns (address)",
];

// Minimal Marketplace ABI (Where NFTs are sold)
export const MARKETPLACE_ABI = [
  "function getListing(uint256 tokenId) view returns (address seller, uint256 price, bool isListed)",
  "function createListing(uint256 tokenId, uint256 price)",
  "function buyNFT(uint256 tokenId) payable",
  "event ItemListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event ItemSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
];

// REPLACE THESE WITH YOUR DEPLOYED CONTRACT ADDRESSES ON OXT CHAIN
export const NFT_ADDRESS = "0x123..."; // Your deployed NFT Contract
export const MARKETPLACE_ADDRESS = "0x456..."; // Your deployed Marketplace Contract

// Your RunPod RPC URL
export const RPC_URL = "http://<YOUR_RUNPOD_IP>:8545";
