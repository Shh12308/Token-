// src/pages/Browser.jsx
import React, { useState, useEffect, useRef, useContext } from 'react';
import { Web3Context } from '../context/Web3Context';
import { ThemeContext } from '../context/ThemeContext';
import { NotificationContext } from '../context/NotificationContext';


const Browser = () => {
  const [url, setUrl] = useState('https://opensea.io');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  const { web3Provider, currentChain } = useContext(Web3Context);
  const { theme } = useContext(ThemeContext);
  const { notify } = useContext(NotificationContext);

  // Handle URL navigation
  const handleNavigate = (e) => {
    e.preventDefault();
    if (!url.startsWith('http')) {
      notify('Invalid URL. Make sure it starts with http or https.');
      return;
    }
    setLoading(true);
    iframeRef.current.src = url;
  };

  // Inject wallet provider into iframe for DApp interaction
  useEffect(() => {
    const injectProvider = () => {
      if (!iframeRef.current) return;

      const iframeWindow = iframeRef.current.contentWindow;
      if (!iframeWindow) return;

      // Expose a minimal wallet provider
      iframeWindow.ethereum = {
        request: async ({ method, params }) => {
          try {
            if (!web3Provider) throw new Error('Wallet not connected');
            switch (method) {
              case 'eth_requestAccounts':
                return await web3Provider.request({ method, params });
              case 'eth_chainId':
                return await web3Provider.request({ method, params });
              case 'eth_sendTransaction':
                return await web3Provider.request({ method, params });
              case 'personal_sign':
                return await web3Provider.request({ method, params });
              default:
                throw new Error(`Method ${method} not supported`);
            }
          } catch (err) {
            notify(err.message);
          }
        },
      };
    };

    const interval = setInterval(injectProvider, 1000); // Keep injecting provider
    return () => clearInterval(interval);
  }, [web3Provider, notify]);

  return (
    <div className={`browser-page ${theme}`}>
      <form className="browser-nav" onSubmit={handleNavigate}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter DApp URL"
        />
        <button type="submit">Go</button>
      </form>

      <div className="browser-container">
        {loading && <div className="loading-overlay">Loading...</div>}
        <iframe
          ref={iframeRef}
          title="Web3 Browser"
          src={url}
          style={{ width: '100%', height: '80vh', border: 'none' }}
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default Browser;
