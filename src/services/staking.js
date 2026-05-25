import { ethers } from 'ethers';
import { getProvider } from './rpc'; // Assuming you have a provider setup

// Lido Staking Contract Address (Ethereum Mainnet)
const LIDO_CONTRACT_ADDRESS = "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84";

// The "ABI" - This is just the specific functions we need to call
const LIDO_ABI = [
  "function submit(address _referral) external payable returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)"
];

// 1. STAKE Function
export const stakeETH = async (privateKey, amountInEth) => {
  const provider = getProvider(); // Your Alchemy/Infura provider
  const wallet = new ethers.Wallet(privateKey, provider);
  
  // Connect to the Lido Contract
  const lidoContract = new ethers.Contract(LIDO_CONTRACT_ADDRESS, LIDO_ABI, wallet);
  
  // Convert amount to Wei
  const amountWei = ethers.parseEther(amountInEth);

  try {
    // Call the 'submit' function on the smart contract
    // We send the ETH value along with the transaction
    const tx = await lidoContract.submit(wallet.address, {
      value: amountWei
    });

    console.log("Staking Transaction Sent:", tx.hash);
    
    // Wait for confirmation
    await tx.wait();
    
    return { success: true, hash: tx.hash };
  } catch (error) {
    console.error("Staking Failed:", error);
    return { success: false, error: error.message };
  }
};

// 2. CHECK STAKED BALANCE Function
export const getStakedBalance = async (walletAddress) => {
  const provider = getProvider();
  
  // Connect to the stETH token contract (which is the same address as Lido)
  const lidoContract = new ethers.Contract(LIDO_CONTRACT_ADDRESS, LIDO_ABI, provider);
  
  // Check how many stETH tokens the user has
  const balance = await lidoContract.balanceOf(walletAddress);
  
  return ethers.formatEther(balance); // Returns the stETH amount
};
