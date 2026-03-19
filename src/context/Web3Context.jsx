// src/contexts/Web3Context.jsx
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
    const acc = getLocalAccount();
    if (acc) setAccount(acc);

    // ✅ ethers v6 provider
    const ethProvider = process.env.REACT_APP_INFURA_KEY
      ? new ethers.InfuraProvider(
          'homestead',
          process.env.REACT_APP_INFURA_KEY
        )
      : ethers.getDefaultProvider();

    setProvider(ethProvider);
  }, []);

  const unlockWallet = async (passcodeOrKey) => {
    if (!account) throw new Error('No local account found.');

    const decryptedSeed = await decryptData(
      account.encryptedSeed,
      passcodeOrKey
    );

    setSeed(decryptedSeed);

    // ✅ ethers v6 uses HDNodeWallet instead of fromMnemonic
    const walletInstance = ethers.Wallet.fromPhrase(decryptedSeed).connect(
      provider
    );

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
