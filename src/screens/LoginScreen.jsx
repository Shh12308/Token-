// src/screens/LoginScreen.jsx
import React, { useState } from 'react';
import { useNavigation } from '../context/NavigationContext';
import { useWallet } from '../context/WalletContext';
import { createWallet, unlockWallet } from '../services/authService';
import WalletScreen from './WalletScreen';

const LoginScreen = () => {
  const { pushScreen } = useNavigation();
  const { setWallet } = useWallet(); // We'll add a setWallet method to WalletContext
  const [isCreating, setIsCreating] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const handleCreateWallet = async () => {
    if (passcode.length < 6) {
      toast.error('Passcode must be at least 6 digits.');
      return;
    }
    setIsCreating(true);
    try {
      const { mnemonic: newMnemonic } = await createWallet(passcode);
      setMnemonic(newMnemonic);
      // Show user the mnemonic and make them confirm they've saved it
    } catch (error) {
      toast.error('Failed to create wallet.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleUnlockWallet = async () => {
    try {
      const wallet = await unlockWallet(passcode);
      setWallet(wallet); // Set the unlocked wallet in context
      pushScreen(<WalletScreen />, 'Wallet'); // Navigate to the main wallet screen
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (mnemonic) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold">Your Secret Recovery Phrase</h2>
        <p className="text-red-400 mt-4">Write this down in a safe place. You will not see it again.</p>
        <div className="bg-gray-800 p-4 rounded-lg mt-4 font-mono text-sm">
          {mnemonic}
        </div>
        <button 
          onClick={() => setMnemonic('')} 
          className="mt-6 w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          I've Saved It
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col justify-center h-full">
      <h1 className="text-4xl font-bold text-center mb-8">LUX Wallet</h1>
      <input
        type="password"
        placeholder="Enter 6-digit passcode"
        value={passcode}
        onChange={(e) => setPasscode(e.target.value)}
        className="p-3 bg-gray-800 rounded-lg text-center text-2xl"
      />
      <div className="flex gap-4 mt-6">
        <button onClick={handleUnlockWallet} className="flex-1 bg-blue-600 p-3 rounded-lg">Unlock</button>
        <button onClick={handleCreateWallet} className="flex-1 bg-green-600 p-3 rounded-lg">Create New</button>
      </div>
    </div>
  );
};

export default LoginScreen;
