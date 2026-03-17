// src/components/LockScreen.jsx
import React, { useState, useEffect } from 'react';
import './LockScreen.css';

const LockScreen = () => {
  const [pin, setPin] = useState('');
  const [storedPin, setStoredPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // Get the stored PIN from localStorage (or any secure storage)
    const savedPin = localStorage.getItem('cryptoBean_pin') || '';
    setStoredPin(savedPin);
  }, []);

  const handlePinChange = (e) => {
    setPin(e.target.value);
  };

  const unlockWallet = () => {
    if (!storedPin) {
      setError('No PIN set. Please set one in settings.');
      return;
    }

    if (pin === storedPin) {
      localStorage.setItem('cryptoBean_locked', 'false');
      setError('');
      window.location.reload(); // reload app to unlock
    } else {
      setError('Incorrect PIN. Try again.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') unlockWallet();
  };

  return (
    <div className="lockscreen-container">
      <h1>CryptoBean Locked</h1>
      <p>Enter your PIN to unlock your wallet</p>
      <input
        type="password"
        value={pin}
        onChange={handlePinChange}
        onKeyPress={handleKeyPress}
        placeholder="Enter PIN"
      />
      <button onClick={unlockWallet}>Unlock</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};

export default LockScreen;
