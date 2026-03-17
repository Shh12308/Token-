// src/pages/Security.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Security = () => {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const { lockWallet, unlockWallet } = React.useContext(Web3Context);
  const navigate = useNavigate();

  const handleChangePin = () => {
    if (newPin !== confirmPin) {
      setMessage('New PIN does not match confirmation!');
      return;
    }
    // call context or backend to change PIN
    lockWallet(newPin);
    setMessage('PIN updated successfully');
  };

  const handleBackup = () => {
    // Show mnemonic phrase securely
    const mnemonic = localStorage.getItem('cryptoBean_mnemonic');
    if (!mnemonic) return;
    alert(`Your backup phrase:\n\n${mnemonic}\n\nKeep it safe!`);
  };

  return (
    <div className="security-page">
      <h1>Security Settings</h1>

      <section>
        <h2>Change PIN</h2>
        <input
          type="password"
          placeholder="Current PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
        />
        <input
          type="password"
          placeholder="New PIN"
          value={newPin}
          onChange={(e) => setNewPin(e.target.value)}
        />
        <input
          type="password"
          placeholder="Confirm New PIN"
          value={confirmPin}
          onChange={(e) => setConfirmPin(e.target.value)}
        />
        <button onClick={handleChangePin}>Update PIN</button>
        {message && <p>{message}</p>}
      </section>

      <section>
        <h2>Backup Wallet</h2>
        <button onClick={handleBackup}>Show Backup Phrase</button>
      </section>

      <section>
        <h2>Lock Wallet</h2>
        <button onClick={() => { lockWallet(); navigate('/lock'); }}>
          Lock Now
        </button>
      </section>
    </div>
  );
};

export default Security;
