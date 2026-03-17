// src/pages/Activity.jsx
import React, { useContext, useEffect, useState } from 'react';
import { Web3Context } from '../context/Web3Context';
import { Box, Typography, Card, CardContent, CircularProgress } from '@mui/material';
import { ethers } from 'ethers';

const Activity = () => {
  const { account, provider } = useContext(Web3Context);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!account || !provider) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Get last 10 transactions (simplified)
        const history = await provider.getHistory(account); // Ethers v6: provider.getTransactionHistory(account)
        setTransactions(history.slice(-10).reverse()); // latest first
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [account, provider]);

  if (!account) {
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <Typography variant="h6">Connect your wallet to view activity</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ textAlign: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Recent Activity
      </Typography>

      {transactions.length === 0 ? (
        <Typography>No recent transactions.</Typography>
      ) : (
        transactions.map(tx => (
          <Card key={tx.hash} sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="body1">
                <strong>Tx Hash:</strong> {tx.hash.slice(0, 10)}...
              </Typography>
              <Typography variant="body2">
                <strong>From:</strong> {tx.from.slice(0, 6)}...{tx.from.slice(-4)}
              </Typography>
              <Typography variant="body2">
                <strong>To:</strong> {tx.to ? `${tx.to.slice(0, 6)}...${tx.to.slice(-4)}` : 'Contract/Unknown'}
              </Typography>
              <Typography variant="body2">
                <strong>Value:</strong> {ethers.utils.formatEther(tx.value)} ETH
              </Typography>
              <Typography variant="body2">
                <strong>Status:</strong> {tx.confirmations > 0 ? 'Confirmed' : 'Pending'}
              </Typography>
            </CardContent>
          </Card>
        ))
      )}
    </Box>
  );
};

export default Activity;
