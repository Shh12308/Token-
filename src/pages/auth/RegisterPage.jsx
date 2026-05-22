import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';

import {
  generateSeedPhrase,
  encryptData,
  deriveKeyFromPasscode,
  isBiometricAvailable
} from '../../utils/wallet';

import { setSessionWallet } from '../../utils/session';

const STORAGE_KEY = 'wallet_encrypted';

const getDeviceSalt = () => {
  let salt = localStorage.getItem('device_salt');
  if (!salt) {
    salt = crypto.randomUUID();
    localStorage.setItem('device_salt', salt);
  }
  return salt;
};

const RegisterPage = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [seed, setSeed] = useState([]);
  const [passcode, setPasscode] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (step === 3 && seed.length === 0) {
      setSeed(generateSeedPhrase());
    }
  }, [step]);

  const handleCreate = async () => {
    const phrase = seed.join(' ');
    const wallet = ethers.Wallet.fromPhrase(phrase);

    const salt = getDeviceSalt();
    const key = await deriveKeyFromPasscode(passcode + salt);

    const encrypted = await encryptData(phrase, key);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        address: wallet.address,
        encryptedSeed: encrypted.data,
        iv: encrypted.iv
      })
    );

    setSessionWallet(wallet);
    navigate('/app/dashboard');
  };

  return (
    <div>
      <h2>Create Wallet</h2>

      {step === 1 && (
        <button onClick={() => setStep(2)}>Start</button>
      )}

      {step === 2 && (
        <>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
          />
          <button onClick={() => setStep(3)}>Continue</button>
        </>
      )}

      {step === 3 && (
        <>
          {seed.map((w, i) => (
            <div key={i}>{i + 1}. {w}</div>
          ))}

          <label>
            <input
              type="checkbox"
              checked={saved}
              onChange={(e) => setSaved(e.target.checked)}
            />
            I saved seed
          </label>

          <button disabled={!saved} onClick={handleCreate}>
            Create Wallet
          </button>
        </>
      )}
    </div>
  );
};

export default RegisterPage;
