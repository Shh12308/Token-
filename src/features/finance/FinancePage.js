import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AccountBalanceWallet, Send } from '@mui/icons-material';

const walletBalances = {
  hot: { BTC: 1.5, ETH: 25.5, BEAN: 500000 },
  cold: { BTC: 95.2, ETH: 450.8, BEAN: 9500000 },
};

const recentTransactions = [
  { id: 'cb-tx1', type: 'DEPOSIT', user: 'cb-user-001', asset: 'BTC', amount: 0.15, status: 'Completed' },
  { id: 'cb-tx2', type: 'WITHDRAWAL', user: 'cb-user-002', asset: 'ETH', amount: 2.5, status: 'Pending' },
  { id: 'cb-tx3', type: 'COLD_TRANSFER', user: 'SYSTEM', asset: 'BEAN', amount: 100000, status: 'Completed' },
];

export default function FinanceSection() { // Renamed for clarity
  const [transferAmount, setTransferAmount] = useState('');
  const [transferAsset, setTransferAsset] = useState('BTC');

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Finance & Wallets</Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom><AccountBalanceWallet /> Hot Wallet Balances</Typography>
            {Object.entries(walletBalances.hot).map(([asset, amount]) => (
              <Typography key={asset}>{asset}: {amount.toLocaleString()}</Typography>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom><AccountBalanceWallet /> Cold Storage Balances</Typography>
            {Object.entries(walletBalances.cold).map(([asset, amount]) => (
              <Typography key={asset}>{asset}: {amount.toLocaleString()}</Typography>
            ))}
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, mt: 3 }}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          This is a highly restricted operation. Transferring funds from cold storage requires multi-signature approval.
        </Alert>
        <Typography variant="h6" gutterBottom><Send /> Cold to Hot Transfer</Typography>
        <Box component="form" sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField select label="Asset" value={transferAsset} onChange={(e) => setTransferAsset(e.target.value)} SelectProps={{ native: true }} sx={{ minWidth: 120 }}>
            {Object.keys(walletBalances.cold).map(asset => <option key={asset} value={asset}>{asset}</option>)}
          </TextField>
          <TextField label="Amount" type="number" value={transferAmount} onChange={(e) => setTransferAmount(e.target.value)} />
          <Button variant="contained" color="error">Initiate Transfer</Button>
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>Recent Transactions</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Asset</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentTransactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{tx.id}</TableCell>
                  <TableCell>{tx.type}</TableCell>
                  <TableCell>{tx.user}</TableCell>
                  <TableCell>{tx.asset}</TableCell>
                  <TableCell>{tx.amount.toLocaleString()}</TableCell>
                  <TableCell>{tx.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
