// src/context/NavigationContext.jsx
import React, { createContext, useState, useContext } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => useContext(NavigationContext);

// Each screen will be an object: { component: <Component />, title: 'Screen Title' }
export const NavigationProvider = ({ children }) => {
  const [screenStack, setScreenStack] = useState([{ component: null, title: 'LUX' }]); // Start with a blank screen or login

  const pushScreen = (component, title) => {
    setScreenStack(prev => [...prev, { component, title }]);
  };

  const popScreen = () => {
    if (screenStack.length > 1) {
      setScreenStack(prev => prev.slice(0, -1));
    }
  };
  
  const resetToScreen = (component, title) => {
    setScreenStack([{ component, title }]);
  };

  const currentScreen = screenStack[screenStack.length - 1];

  return (
    <NavigationContext.Provider value={{ pushScreen, popScreen, currentScreen, stackLength: screenStack.length }}>
      {children}
    </NavigationContext.Provider>
  );
};
