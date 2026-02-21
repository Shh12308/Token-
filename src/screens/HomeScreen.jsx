// src/screens/HomeScreen.jsx
import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';

const HomeScreen = () => {
  const { pushScreen } = useNavigation();
  const { account } = useWallet();
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h1 className="text-4xl font-bold mb-4">Welcome to CryptoExchange</h1>
      <p className="text-gray-600 mb-8">Your gateway to Web3 NFTs and Fungible Tokens.</p>
      
      <div className="space-y-4 w-full max-w-xs">
        {account ? (
          <>
            <button
              onClick={() => pushScreen(<div>NFT Marketplace</div>, 'NFT Marketplace')}
              className="w-full bg-purple-600 text-white p-3 rounded-lg hover:bg-purple-700"
            >
              Explore NFT Marketplace
            </button>
            <button
              onClick={() => pushScreen(<div>Trading Dashboard</div>, 'Trading Dashboard')}
              className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
            >
              Go to Trading Dashboard
            </button>
          </>
        ) : (
          <p className="text-red-500 font-semibold">Please connect your wallet to continue.</p>
        )}
      </div>
    </div>
  );
};

export default HomeScreen;
