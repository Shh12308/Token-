import React, { createContext, useContext, useReducer, useEffect } from 'react';

const Web3Context = createContext();

const initialState = {
  isConnected: false,
  account: null,
  balance: '0',
  network: 'ethereum',
  provider: null,
  contracts: {},
  loading: false,
  error: null
};

const web3Reducer = (state, action) => {
  switch (action.type) {
    case 'CONNECT_WALLET':
      return {
        ...state,
        isConnected: true,
        account: action.payload.account,
        balance: action.payload.balance,
        provider: action.payload.provider,
        loading: false
      };
    case 'DISCONNECT_WALLET':
      return {
        ...state,
        isConnected: false,
        account: null,
        balance: '0',
        provider: null,
        contracts: {}
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_BALANCE':
      return { ...state, balance: action.payload };
    case 'SWITCH_NETWORK':
      return { ...state, network: action.payload };
    default:
      return state;
  }
};

export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  const connectWallet = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Simulate wallet connection
      setTimeout(() => {
        const mockAccount = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        const mockBalance = '10.5';
        
        dispatch({
          type: 'CONNECT_WALLET',
          payload: {
            account: mockAccount,
            balance: mockBalance,
            provider: { connected: true }
          }
        });
      }, 1500);
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: error.message });
    }
  };

  const disconnectWallet = () => {
    dispatch({ type: 'DISCONNECT_WALLET' });
  };

  const value = {
    ...state,
    connectWallet,
    disconnectWallet,
    dispatch
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};
