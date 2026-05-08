import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux'; // ✅ ADD THIS
import { store } from './store';        // ✅ ADD THIS

// Providers
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { TradingProvider } from './context/TradingContext';
import { WalletProvider } from './context/WalletContext';
import { Web3Provider } from './context/Web3Context';

// Routes
import AppRoutes from './routes/routes';

const App = () => {
  return (
    <Provider store={store}> {/* ✅ REQUIRED */}
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
    </Provider>
  );
};

export default App;
