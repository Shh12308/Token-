// src/pages/Security.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Web3Context } from '../context/Web3Context';

const Security = () => {
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [message, setMessage] = useState('');
  const [mnemonic, setMnemonic] = useState('');

  const context = useContext(Web3Context);
  const navigate = useNavigate();

  // 🛑 Prevent crash if context is broken
  if (!context) {
    return <p>Web3 context not available</p>;
  }

  const {
    lockWallet,
    unlockWallet,
    verifyPin,
    changePin,
    getMnemonic,
  } = context;

  // 🔐 CHANGE PIN
  const handleChangePin = async () => {
    setMessage('');

    if (!pin) {
      setMessage('Enter current PIN');
      return;
    }

    if (!newPin || !confirmPin) {
      setMessage('Enter new PIN');
      return;
    }

    if (newPin !== confirmPin) {
      setMessage('New PIN does not match');
      return;
    }

    if (!verifyPin || !changePin) {
      setMessage('Security service unavailable');
      return;
    }

    try {
      const valid = await verifyPin(pin);

      if (!valid) {
        setMessage('Incorrect current PIN');
        return;
      }

      await changePin(newPin);
      setMessage('PIN updated successfully');

      setPin('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      console.error(err);
      setMessage('Error updating PIN');
    }
  };

  // 🧾 BACKUP
  const handleBackup = async () => {
    setMessage('');

    if (!pin) {
      setMessage('Enter PIN to view backup');
      return;
    }

    if (!getMnemonic) {
      setMessage('Backup service unavailable');
      return;
    }

    try {
      const phrase = await getMnemonic(pin);

      if (!phrase) {
        setMessage('Incorrect PIN or no wallet found');
        return;
      }

      setMnemonic(phrase);
    } catch (err) {
      console.error(err);
      setMessage('Failed to retrieve mnemonic');
    }
  };

  return (
    <div className="security-page">
      <h1>Security Settings</h1>

      {/* CHANGE PIN */}
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

        <button onClick={handleChangePin}>
          Update PIN
        </button>

        {message && <p>{message}</p>}
      </section>

      {/* BACKUP */}
      <section>
        <h2>Backup Wallet</h2>

        <button onClick={handleBackup}>
          Show Backup Phrase
        </button>

        {mnemonic && (
          <div className="mnemonic-box">
            <p><strong>⚠️ Never share this phrase</strong></p>
            <p>{mnemonic}</p>
          </div>
        )}
      </section>

      {/* LOCK */}
      <section>
        <h2>Lock Wallet</h2>

        <button
          onClick={() => {
            if (!lockWallet) {
              setMessage('Lock service unavailable');
              return;
            }

            lockWallet();
            navigate('/lock');
          }}
        >
          Lock Now
        </button>
      </section>
    </div>
  );
};

export default Security;
