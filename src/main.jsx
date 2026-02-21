// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './context/WalletContext.jsx';
import { UserProvider } from './context/UserContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import './index.css'; // Your Tailwind CSS imports

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <WalletProvider>
          <UserProvider>
            <App />
            <Toaster position="top-right" />
          </UserProvider>
        </WalletProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
