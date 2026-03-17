// src/components/SplashScreen.jsx
import React from 'react';
import { motion } from 'framer-motion';
import '../styles/SplashScreen.css'; // optional, for styling

const SplashScreen = () => {
  return (
    <motion.div
      className="splash-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="splash-logo">
        <span role="img" aria-label="bean">🫘</span>
      </div>
      <h1 className="splash-title">CryptoBean</h1>
      <p className="splash-subtitle">Your advanced crypto wallet</p>
    </motion.div>
  );
};

export default SplashScreen;
