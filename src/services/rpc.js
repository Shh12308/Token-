import { ethers } from 'ethers';

// Replace with your Alchemy/Infura URL
const ALCHEMY_URL = "https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY";

const provider = new ethers.JsonRpcProvider(ALCHEMY_URL);

// Get Balance
export const getBalance = async (address) => {
  const balance = await provider.getBalance(address);
  return ethers.formatEther(balance); // Returns ETH amount
};

// Send Transaction
export const sendTransaction = async (privateKey, toAddress, amountEth) => {
  const wallet = new ethers.Wallet(privateKey, provider);
  
  const tx = await wallet.sendTransaction({
    to: toAddress,
    value: ethers.parseEther(amountEth),
  });

  // Wait for confirmation
  await tx.wait();
  return tx.hash;
};
