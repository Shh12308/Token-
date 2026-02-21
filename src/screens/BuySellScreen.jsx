// src/screens/BuySellScreen.jsx
import React, { useState } from 'react';
import { useTrading } from '../context/TradingContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigation } from '../context/NavigationContext';

const BuySellScreen = () => {
  const { popScreen } = useNavigation();
  const { balances, kycStatus, buyAsset } = useTrading();
  const [amount, setAmount] = useState('');
  const [fiatAmount, setFiatAmount] = useState('');
  const [asset, setAsset] = useState('ETH'); // Or USDC, etc.

  if (kycStatus !== 'verified') {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold">KYC Required</h1>
        <p className="mt-4">You must complete identity verification to trade.</p>
        <button className="mt-6 bg-blue-600 p-3 rounded-lg">Start Verification</button>
      </div>
    );
  }

  const handleBuy = async () => {
    try {
      await buyAsset(asset, amount, 'USD');
      toast.success('Purchase successful!');
      // Refetch balances to update the UI
      // useTrading().refetch();
    } catch (error) {
      toast.error(error.response.data.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center mb-6">
        <button onClick={popScreen}><ArrowLeftIcon className="w-6 h-6 mr-4" /></button>
        <h1 className="text-2xl font-bold">Buy {asset}</h1>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">You Pay</p>
        <input
          type="number"
          value={fiatAmount}
          onChange={(e) => setFiatAmount(e.target.value)}
          className="w-full bg-transparent text-3xl font-bold outline-none"
          placeholder="0.00"
        />
        <span className="text-xl">USD</span>
      </div>

      <div className="flex justify-center my-4">
        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <ArrowDownTrayIcon className="w-5 h-5 text-white" />
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <p className="text-sm text-gray-400">You Receive</p>
        <p className="text-3xl font-bold">{amount || '0.00'}</p>
        <span className="text-xl">{asset}</span>
      </div>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>Price: $1,850.25 / ETH</p>
        <p>Fee (2.5%): $4.63</p>
      </div>

      <button onClick={handleBuy} className="w-full bg-blue-600 p-4 rounded-lg mt-6">
        Buy {asset}
      </button>
    </div>
  );
};
