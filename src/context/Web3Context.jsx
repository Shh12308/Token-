import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLocalAccount } from '../utils/storage';
import { decryptData } from '../utils/crypto';

export const Web3Context = createContext({
  account: null,
  seed: null,
  wallet: null,
  provider: null,
  network: null,
  error: null,
  unlockWallet: async () => {},
  logout: () => {},
});

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [seed, setSeed] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const acc = getLocalAccount();
      if (acc) setAccount(acc);

      const infuraKey = import.meta.env.VITE_INFURA_KEY;

      if (!infuraKey) {
        console.warn("⚠️ Missing VITE_INFURA_KEY");
        setError("Missing blockchain configuration");
        return;
      }

      const ethProvider = new ethers.JsonRpcProvider(
        `https://mainnet.infura.io/v3/${infuraKey}`
      );

      setProvider(ethProvider);
    } catch (err) {
      console.error("Web3Provider init error:", err);
      setError("Failed to initialize provider");
    }
  }, []);

  const unlockWallet = async (passcodeOrKey) => {
    try {
      if (!account) throw new Error('No local account found.');
      if (!provider) throw new Error('Provider not initialized');

      const decryptedSeed = await decryptData(
        account.encryptedSeed,
        passcodeOrKey,
        account.iv,
        account.salt
      );

      if (!decryptedSeed) {
        throw new Error("Decryption failed");
      }

      let walletInstance;

      try {
        walletInstance = ethers.Wallet.fromPhrase(decryptedSeed).connect(provider);
      } catch (err) {
        console.error("Wallet creation failed:", err);
        throw new Error("Invalid seed phrase");
      }

      setSeed(decryptedSeed);
      setWallet(walletInstance);

      const net = await provider.getNetwork();
      setNetwork(net);

      return walletInstance;

    } catch (err) {
      console.error("Unlock wallet error:", err);
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    setSeed(null);
    setWallet(null);
    setNetwork(null);
    setError(null);
  };

  return (
    <Web3Context.Provider
      value={{
        account,
        seed,
        wallet,
        provider,
        network,
        error,
        unlockWallet,
        logout,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
