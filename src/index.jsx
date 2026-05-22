import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/GlobalStyles.css';

import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { wagmiConfig, modal } from './web3';

// Create React Query client (required by wagmi v2)
const queryClient = new QueryClient();

// Initialize modal once globally
modal;

// Create root
const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
