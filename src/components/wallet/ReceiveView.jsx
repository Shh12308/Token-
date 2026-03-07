// src/components/wallet/ReceiveView.jsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QRCode from 'qrcode.react';

const ReceiveView = ({ walletProvider }) => {
  const [address, setAddress] = useState('');

  useEffect(() => {
    const fetchAddress = async () => {
      if (!walletProvider) return;
      try {
        const accounts = await walletProvider.listAccounts?.();
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (err) {
        console.error('Failed to fetch wallet address:', err);
      }
    };
    fetchAddress();
  }, [walletProvider]);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      alert('Address copied!');
    }
  };

  if (!address) {
    return (
      <Box sx={{ mt: 5, textAlign: 'center', color: '#fff' }}>
        <Typography>Connect your wallet to receive crypto</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: 'auto',
        mt: 5,
        p: 3,
        border: '1px solid #444',
        borderRadius: 2,
        backgroundColor: '#1e1e1e',
        color: '#fff',
        textAlign: 'center',
      }}
    >
      <Typography variant="h5" mb={2}>
        Receive Crypto
      </Typography>

      <QRCode value={address} size={150} bgColor="#1e1e1e" fgColor="#fff" />

      <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
        <TextField
          fullWidth
          value={address}
          InputProps={{
            readOnly: true,
          }}
        />
        <IconButton sx={{ ml: 1 }} onClick={copyAddress} color="primary">
          <ContentCopyIcon />
        </IconButton>
      </Box>
    </Box>
  );
};

export default ReceiveView;
