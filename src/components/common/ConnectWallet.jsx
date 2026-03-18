import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveWallet, updateBalance } from '../../store/slices/walletSlice';
import { connectWallet, getBalance } from '../../utils/web3';

const ConnectWallet = () => {
  const dispatch = useDispatch();
  const wallet = useSelector(state => state.wallet.activeWallet);

  const handleConnect = async () => {
    try {
      const address = await connectWallet();
      const balance = await getBalance(address);

      dispatch(setActiveWallet(address));
      dispatch(updateBalance({ ETH: parseFloat(balance) }));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleConnect} className="btn-primary">
      {wallet
        ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}`
        : 'Connect Wallet'}
    </button>
  );
};

export default ConnectWallet;
