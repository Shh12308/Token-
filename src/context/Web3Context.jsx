import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { getLocalAccount } from '../utils/storage';
import { decryptData } from '../utils/crypto';

export const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [account, setAccount] = useState(null);
  const [seed, setSeed] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [provider, setProvider] = useState(null);
  const [network, setNetwork] = useState(null);

  useEffect(() => {
  try {
    const acc = getLocalAccount();
    if (acc) setAccount(acc);

    const infuraKey = import.meta.env.VITE_INFURA_KEY;

    const ethProvider = infuraKey
      ? new ethers.JsonRpcProvider(
          `https://mainnet.infura.io/v3/${infuraKey}`
        )
      : new ethers.JsonRpcProvider();

    setProvider(ethProvider);
  } catch (error) {
    console.error("Web3Provider init error:", error);
  }
}, []);

  const unlockWallet = async (passcodeOrKey) => {
    if (!account) throw new Error('No local account found.');
    if (!provider) throw new Error('Provider not initialized');

    const decryptedSeed = await decryptData(
      account.encryptedSeed,
      passcodeOrKey,
      account.iv,
      account.salt
    );

    setSeed(decryptedSeed);

    const walletInstance = ethers.Wallet.fromPhrase(decryptedSeed).connect(provider);
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
    <Web3Context.Provider
      value={{
        account,
        seed,
        wallet,
        provider,
        network,
        unlockWallet,
        logout,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
