import { ethers } from "ethers";
import { NFT_ABI, MARKETPLACE_ABI, NFT_ADDRESS, MARKETPLACE_ADDRESS, RPC_URL } from "../utils/contracts";

// 1. Setup Provider (Connection to OXT Chain)
const provider = new ethers.JsonRpcProvider(RPC_URL);

// 2. Setup Contracts
const nftContract = new ethers.Contract(NFT_ADDRESS, NFT_ABI, provider);
const marketContract = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

// ======================
// FETCH USER'S NFTs
// ======================
export const getMyNFTs = async () => {
  // Connect to MetaMask to get user address
  if (!window.ethereum) return [];
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  const userAddress = accounts[0];

  const balanceBN = await nftContract.balanceOf(userAddress);
  const balance = parseInt(balanceBN);

  const nfts = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
    const tokenURI = await nftContract.tokenURI(tokenId);
    
    // Convert BigNumber to string
    nfts.push({
      id: tokenId.toString(),
      tokenId: tokenId.toString(),
      tokenURI: tokenURI,
      owner: userAddress,
      // You would fetch metadata from IPFS here using tokenURI
      name: "My NFT #" + tokenId,
      image: "https://via.placeholder.com/300",
    });
  }
  return nfts;
};

// ======================
// FETCH MARKETPLACE LISTINGS
// ======================
export const getNFTListings = async () => {
  // Since solidity doesn't allow "Get All Listings" easily, 
  // we usually use an event listener or an indexer.
  // For this simple example, we will assume you track IDs in state
  // or call a specific view function if you wrote one.
  
  // Let's simulate fetching a known listing ID 1
  try {
    const listing = await marketContract.getListing(1);
    if (listing.isListed) {
      return [{
        id: "1",
        tokenId: "1",
        price: ethers.formatEther(listing.price), // Convert Wei to ETH/OXT
        seller: listing.seller,
        image: "https://via.placeholder.com/300",
      }];
    }
  } catch (err) {
    console.log("No active listings or function not implemented");
  }
  return [];
};

// ======================
// LIST NFT FOR SALE
// ======================
export const listNFT = async (tokenId, price) => {
  // This requires a Signer (Wallet)
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  
  const marketWithSigner = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);
  
  // 1. Approve Marketplace to spend the NFT
  const nftWithSigner = new ethers.Contract(NFT_ADDRESS, NFT_ABI, signer);
  const approveTx = await nftWithSigner.approve(MARKETPLACE_ADDRESS, tokenId);
  await approveTx.wait();

  // 2. Create Listing
  const priceInWei = ethers.parseEther(price.toString());
  const listTx = await marketWithSigner.createListing(tokenId, priceInWei);
  await listTx.wait();
  
  return listTx.hash;
};

// ======================
// BUY NFT
// ======================
export const buyNFT = async (listingId) => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const marketWithSigner = new ethers.Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, signer);

  // We need to find the price of this listing first
  const listing = await marketWithSigner.getListing(listingId);
  const priceInWei = listing.price;

  const buyTx = await marketWithSigner.buyNFT(listingId, { value: priceInWei });
  await buyTx.wait();

  return buyTx.hash;
};
