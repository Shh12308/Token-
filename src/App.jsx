import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';

// Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { TradingProvider } from './context/TradingContext';
import { WalletProvider } from './context/WalletContext';
import { Web3Provider } from './context/Web3Context';

// Routes (externalized)
import AppRoutes from './routes/routes';

const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <NotificationProvider>
            <TradingProvider>
              <WalletProvider>
                <Web3Provider>
                  <AppRoutes />
                </Web3Provider>
              </WalletProvider>
            </TradingProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
