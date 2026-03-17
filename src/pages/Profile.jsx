// src/pages/Profile.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../context/Web3Context';
import { NotificationContext } from '../context/NotificationContext';
import './Profile.css';

const Profile = () => {
  const { account, currentChain, getBalances, getNFTs } = useContext(Web3Context);
  const { notify } = useContext(NotificationContext);
  const [balances, setBalances] = useState([]);
  const [nfts, setNFTs] = useState([]);
  const [username, setUsername] = useState('');

  // Fetch balances and NFTs on mount or chain change
  useEffect(() => {
    if (!account) return;

    const fetchData = async () => {
      try {
        const tokenBalances = await getBalances(account, currentChain);
        setBalances(tokenBalances);

        const nftList = await getNFTs(account, currentChain);
        setNFTs(nftList);
      } catch (err) {
        notify(`Failed to fetch data: ${err.message}`);
      }
    };

    fetchData();
  }, [account, currentChain, getBalances, getNFTs, notify]);

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const saveProfile = () => {
    localStorage.setItem('cryptoBean_username', username);
    notify('Profile updated successfully!');
  };

  return (
    <div className="profile-page">
      <h1>Profile</h1>

      <section className="profile-info">
        <p><strong>Wallet Address:</strong> {account || 'Not connected'}</p>
        <p><strong>Current Chain:</strong> {currentChain?.name || 'N/A'}</p>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={handleUsernameChange}
            placeholder="Enter your display name"
          />
        </label>
        <button onClick={saveProfile}>Save Profile</button>
      </section>

      <section className="balances">
        <h2>Token Balances</h2>
        {balances.length ? (
          <ul>
            {balances.map((token) => (
              <li key={token.symbol}>
                {token.symbol}: {token.amount}
              </li>
            ))}
          </ul>
        ) : (
          <p>No balances found</p>
        )}
      </section>

      <section className="nfts">
        <h2>NFTs</h2>
        {nfts.length ? (
          <div className="nft-grid">
            {nfts.map((nft) => (
              <div key={nft.tokenId} className="nft-card">
                <img src={nft.image} alt={nft.name} />
                <p>{nft.name}</p>
              </div>
            ))}
          </div>
        ) : (
          <p>No NFTs found</p>
        )}
      </section>
    </div>
  );
};

export default Profile;
