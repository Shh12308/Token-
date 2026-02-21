// src/App.jsx
import React from 'react';
import { NavigationProvider, useNavigation } from './context/NavigationContext';
import { WalletProvider } from './context/WalletContext'; // WalletContext now gets its key from authService
import { Toaster } from 'react-hot-toast';
import LoginScreen from './screens/LoginScreen'; // New screen
import WalletScreen from './screens/WalletScreen'; // The main hub
import './index.css';

// This component renders the top of the navigation stack
const ScreenRenderer = () => {
  const { currentScreen } = useNavigation();
  
  // If no component is set, show a loader or splash screen
  if (!currentScreen.component) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return currentScreen.component;
};

// The main App component now just sets up providers and the renderer
function App() {
  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      <NavigationProvider>
        <WalletProvider>
          <ScreenRenderer />
          <Toaster position="top-center" />
        </WalletProvider>
      </NavigationProvider>
    </div>
  );
}

export default App;
