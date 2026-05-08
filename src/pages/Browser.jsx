import React, { useState, useEffect, useRef } from 'react';
import { Web3Context } from '../context/Web3Context';
import { ThemeContext } from '../context/ThemeContext';
import { NotificationContext } from '../context/NotificationContext';

const Browser = () => {
  const [url, setUrl] = useState('https://opensea.io');
  const [loading, setLoading] = useState(false);
  const iframeRef = useRef(null);

  const { web3Provider } = useContext(Web3Context);
  const { theme } = useContext(ThemeContext);
  const { notify } = useContext(NotificationContext);

  // Handle URL navigation
  const handleNavigate = (e) => {
    e.preventDefault();
    
    // Safety check: Ensure URL is valid before navigating
    if (!url || !url.startsWith('http') && !url.startsWith('https')) {
      notify('Invalid URL. Please start with http:// or https://');
      return;
    }

    setLoading(true);
    
    // Slight delay to allow user to see loading state before switching iframe
    setTimeout(() => {
      if (iframeRef.current) {
        iframeRef.current.src = url;
      }
    }, 100);
  };

  // Inject wallet provider into iframe for DApp interaction
  useEffect(() => {
    const injectProvider = () => {
      if (!iframeRef.current) return;
      
      // Security: Only inject if contentWindow is accessible
      try {
        const iframeWindow = iframeRef.current.contentWindow;
        if (!iframeWindow) return;

        // Expose a minimal wallet provider
        // Note: We use web3Provider from Context here to bridge the connection
        iframeWindow.ethereum = {
          isMetaMask: false, // Custom flag if needed
          request: async ({ method, params }) => {
            try {
              if (!web3Provider) throw new Error('Wallet not connected');
              
              console.log(`[Browser] Request: ${method}`, params);

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
                  console.warn(`[Browser] Unsupported method: ${method}`);
                  return null;
              }
            } catch (err) {
              console.error(`[Browser] Request Error: ${method}`, err);
              notify(err.message || 'Transaction failed');
              throw err;
            }
          },
        };
      } catch (err) {
        console.error('[Browser] Provider injection error:', err);
        // Fail silently or notify user via Toast
        if (notify) notify('Failed to initialize wallet provider in browser');
      }
    };

    // Attempt to inject immediately
    injectProvider();

    // Also attempt periodically in case iframe loads late
    const interval = setInterval(injectProvider, 1000); 

    return () => clearInterval(interval);
  }, [web3Provider, notify]); // Re-run if wallet connects/disconnects

  return (
    <div className={`browser-page ${theme}`}>
      <form className="browser-nav" onSubmit={handleNavigate}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter DApp URL (e.g., https://uniswap.org)"
          style={{ flex: 1 }}
        />
        <button type="submit">Go</button>
      </form>

      <div className="browser-container">
        {loading && <div className="loading-overlay">Loading DApp...</div>}
        <iframe
          ref={iframeRef}
          title="Web3 Browser"
          src={url || 'about:blank'} // Use about:blank as default to prevent crash on empty URL
          style={{ width: '100%', height: 'calc(100vh - 60px)', border: 'none', background: 'transparent' }}
          allow="accelerometer; camera; gyroscope; microphone" // Allow DApp permissions
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          onLoad={() => setLoading(false)}
        />
      </div>
    </div>
  );
};

export default Browser;
