import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { getSessionWallet } from '../utils/session';
import { getProvider } from '../utils/provider';

const Home = () => {
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const wallet = getSessionWallet();
    if (!wallet) return;

    const provider = getProvider();

    await provider.getBlockNumber(); // ensures RPC works

    const balance = await provider.getBalance(wallet.address);

    setAssets([
      {
        symbol: 'ETH',
        balance: ethers.formatEther(balance)
      }
    ]);
  };

  return (
    <div>
      <h2>Dashboard</h2>

      {assets.map((a, i) => (
        <div key={i}>
          {a.symbol}: {a.balance}
        </div>
      ))}
    </div>
  );
};

export default Home;
