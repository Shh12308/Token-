import { createSlice, createEntityAdapter, createSelector } from '@reduxjs/toolkit';

// Use createEntityAdapter for managing a collection of wallets
const walletsAdapter = createEntityAdapter({
  selectId: (wallet) => wallet.id,
  sortComparer: (a, b) => a.createdAt.localeCompare(b.createdAt),
});

const initialState = walletsAdapter.getInitialState({
  activeWalletId: 'wallet-1', // Default to the first wallet
  selectedNetwork: 'ethereum',
  // Pre-populate with a default wallet
  entities: {
    'wallet-1': {
      id: 'wallet-1',
      name: 'Main Wallet',
      address: '0x5aAeb6053f3E94C9b9A09f33669435E7Ef1BeAed',
      createdAt: new Date().toISOString(),
      balances: {
        ethereum: { 'ETH': 1.5, 'USDC': 1000, 'SHIB': 1000000 },
        polygon: { 'MATIC': 5000, 'USDC': 500 },
        bsc: { 'BNB': 2.0, 'BUSD': 800 },
      },
    },
  },
  ids: ['wallet-1'],
});

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    // Action to set the currently active wallet
    setActiveWallet: (state, action) => {
      state.activeWalletId = action.payload;
    },
    // Action to add a newly created wallet
    addWallet: (state, action) => {
      walletsAdapter.addOne(state, action.payload);
      // Automatically switch to the new wallet
      state.activeWalletId = action.payload.id;
    },
    // Action to update wallet settings (e.g., name)
    updateWallet: (state, action) => {
      const { id, ...changes } = action.payload;
      walletsAdapter.updateOne(state, { id, changes });
    },
    // Action to change the selected network
    setSelectedNetwork: (state, action) => {
      state.selectedNetwork = action.payload;
    },
  },
});

export const { setActiveWallet, addWallet, updateWallet, setSelectedNetwork } = walletSlice.actions;

// Export the selectors
export const {
  selectAll: selectAllWallets,
  selectById: selectWalletById,
  selectIds: selectWalletIds,
} = walletsAdapter.getSelectors((state) => state.wallet);

// Memoized selector to get the currently active wallet object
export const selectActiveWallet = createSelector(
  (state) => state.wallet.activeWalletId,
  selectWalletById,
  (activeWalletId, walletById) => walletById(activeWalletId)
);

// Memoized selector to get the balances of the active wallet
export const selectActiveWalletBalances = createSelector(
  selectActiveWallet,
  (state) => state.wallet.selectedNetwork,
  (activeWallet, selectedNetwork by) => activeWallet?.balances[selectedNetwork] || {}
);


export default walletSlice.reducer;
