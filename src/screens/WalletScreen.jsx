// src/screens/WalletScreen.jsx
import React from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useWallet } from '../context/WalletContext';
import { formatAddress, formatBalance } from '../utils/formatters';
import { ArrowLeftIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, CurrencyDollarIcon, PhotoIcon } from '@heroicons/react/24/outline';

// Import other screen components
import BuyCryptoScreen from './BuyCryptoScreen';
import NFTMarketplaceScreen from './NFTMarketplaceScreen';
import SettingsScreen from './SettingsScreen';

const WalletScreen = () => {
  const { pushScreen, popScreen, stackLength } = useNavigation();
  const { wallet, provider } = useWallet();
  const [balance, setBalance] = React.useState('0');

  React.useEffect(() => {
    if (wallet && provider) {
      provider.getBalance(wallet.address).then(bal => setBalance(bal.toString()));
    }
  }, [wallet, provider]);

  return (
    <div className="flex flex-col h-full">
      {/* Header with Back Button */}
      <div className="flex items-center p-4 border-b border-gray-700">
        {stackLength > 1 && <button onClick={popScreen}><ArrowLeftIcon className="w-6 h-6 mr-4" /></button>}
        <h1 className="text-xl font-semibold">{wallet.address ? formatAddress(wallet.address) : 'Wallet'}</h1>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-6 overflow-y-auto">
        <h2 className="text-3xl font-bold">{formatBalance(balance)} ETH</h2>
        <p className="text-gray-400 mt-2">$12,345.67 USD</p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 mt-8">
          <button onClick={() => pushScreen(<BuyCryptoScreen />, 'Buy Crypto')} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <ArrowDownTrayIcon className="w-8 h-8 mb-2" />
            <span>Buy</span>
          </button>
          <button className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <ArrowUpTrayIcon className="w-8 h-8 mb-2" />
            <span>Send</span>
          </button>
          <button onClick={() => pushScreen(<NFTMarketplaceScreen />, 'NFTs')} className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <PhotoIcon className="w-8 h-8 mb-2" />
            <span>NFTs</span>
          </button>
          <button className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
            <CurrencyDollarIcon className="w-8 h-8 mb-2" />
            <span>Swap</span>
          </button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex justify-around p-4 border-t border-gray-700">
        <button className="text-blue-500">Wallet</button>
        <button>Activity</button>
        <button onClick={() => pushScreen(<SettingsScreen />, 'Settings')}>Settings</button>
      </div>
    </div>
  );
};

export default WalletScreen;
