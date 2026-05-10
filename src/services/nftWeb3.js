import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  formatEther,
  parseEther
} from "ethers";

import {
  NFT_ABI,
  MARKETPLACE_ABI,
  NFT_ADDRESS,
  MARKETPLACE_ADDRESS,
  RPC_URL
} from "../utils/contracts";

// ======================
// 1. Provider (Read-only)
// ======================
const provider = new JsonRpcProvider(RPC_URL);

// ======================
// 2. Contracts (Read-only)
// ======================
const nftContract = new Contract(NFT_ADDRESS, NFT_ABI, provider);
const marketContract = new Contract(MARKETPLACE_ADDRESS, MARKETPLACE_ABI, provider);

// ======================
// FETCH USER'S NFTs
// ======================
export const getMyNFTs = async () => {
  if (!window.ethereum) return [];

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts"
  });

  const userAddress = accounts[0];

  const balanceBN = await nftContract.balanceOf(userAddress);
  const balance = Number(balanceBN);

  const nfts = [];

  for (let i = 0; i < balance; i++) {
    const tokenId = await nftContract.tokenOfOwnerByIndex(userAddress, i);
    const tokenURI = await nftContract.tokenURI(tokenId);

    nfts.push({
      id: tokenId.toString(),
      tokenId: tokenId.toString(),
      tokenURI,
      owner: userAddress,
      name: `My NFT #${tokenId}`,
      image: "https://via.placeholder.com/300"
    });
  }

  return nfts;
};

// ======================
// FETCH MARKETPLACE LISTINGS
// ======================
export const getNFTListings = async () => {
  try {
    const listing = await marketContract.getListing(1);

    if (listing.isListed) {
      return [
        {
          id: "1",
          tokenId: "1",
          price: formatEther(listing.price),
          seller: listing.seller,
          image: "https://via.placeholder.com/300"
        }
      ];
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
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const marketWithSigner = new Contract(
    MARKETPLACE_ADDRESS,
    MARKETPLACE_ABI,
    signer
  );

  const nftWithSigner = new Contract(NFT_ADDRESS, NFT_ABI, signer);

  // Approve NFT
  const approveTx = await nftWithSigner.approve(
    MARKETPLACE_ADDRESS,
    tokenId
  );
  await approveTx.wait();

  // Create Listing
  const priceInWei = parseEther(price.toString());

  const listTx = await marketWithSigner.createListing(
    tokenId,
    priceInWei
  );

  await listTx.wait();

  return listTx.hash;
};

// ======================
// BUY NFT
// ======================
export const buyNFT = async (listingId) => {
  if (!window.ethereum) throw new Error("MetaMask not found");

  const provider = new BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  const marketWithSigner = new Contract(
    MARKETPLACE_ADDRESS,
    MARKETPLACE_ABI,
    signer
  );

  const listing = await marketWithSigner.getListing(listingId);

  const buyTx = await marketWithSigner.buyNFT(listingId, {
    value: listing.price
  });

  await buyTx.wait();

  return buyTx.hash;
};
