// context/Web3Context.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';

const Web3Context = createContext();

export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);
  return <Web3Context.Provider value={{ state, dispatch }}>{children}</Web3Context.Provider>;
};

export const useWeb3 = () => useContext(Web3Context);
