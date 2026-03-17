// src/contexts/Web3Context.jsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getLocalAccount } from '../utils/storage'; // get encryptedSeed from localStorage
import { decryptData } from '../utils/crypto';
import { ethers } from 'ethers'; // web3 provider

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null); // { email, encryptedSeed }
  const [seed, setSeed] = useState(null);       // decrypted seed in memory
  const [wallet, setWallet] = useState(null);   // ethers.js Wallet instance
  const [provider, setProvider] = useState(null); // ethers provider
  const [network, setNetwork] = useState(null);

  useEffect(() => {
    const localAcc = getLocalAccount();
    if (localAcc) setAccount(localAcc);

    // optionally setup default provider
    const ethProvider = new ethers.providers.InfuraProvider('homestead', process.env.REACT_APP_INFURA_KEY);
    setProvider(ethProvider);
  }, []);

  // decrypt seed with passcode or biometric key
  const unlockWallet = async (passcodeOrKey) => {
    if (!account) throw new Error('No local account found.');
    const decryptedSeed = await decryptData(account.encryptedSeed, passcodeOrKey);
    setSeed(decryptedSeed);

    const walletInstance = ethers.Wallet.fromMnemonic(decryptedSeed).connect(provider);
    setWallet(walletInstance);

    const net = await walletInstance.provider.getNetwork();
    setNetwork(net);
    return walletInstance;
  };

  const logout = () => {
    setSeed(null);
    setWallet(null);
    setNetwork(null);
  };

  return (
    <Web3Context.Provider value={{
      account,
      seed,
      wallet,
      provider,
      network,
      unlockWallet,
      logout,
    }}>
      {children}
    </Web3Context.Provider>
  );
};

// Hook to use in components
export const useWeb3 = () => useContext(Web3Context);
