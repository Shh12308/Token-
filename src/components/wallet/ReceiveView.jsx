import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import QRCode from 'react-qr-code';

import api from '../../utils/api'; // backend connection

const ReceiveView = ({ goBack }) => {
  const [address, setAddress] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const res = await api.get('/wallet/address');

        if (res.data && res.data.address) {
          setAddress(res.data.address);
        } else {
          setError('Invalid response data');
        }
      } catch (err) {
        setError('Failed to fetch wallet address');
      } finally {
        setLoading(false);
      }
    };

    fetchAddress();
  }, []);

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
    }
  };

  if (loading) {
    return (
      <Box sx={{ mt: 5, textAlign: 'center', color: '#fff' }}>
        <Typography>Loading wallet...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ mt: 5, textAlign: 'center', color: '#fff' }}>
        <Typography>Error: {error}</Typography>
      </Box>
    );
  }

  if (!address) {
    return (
      <Box sx={{ mt: 5, textAlign: 'center', color: '#fff' }}>
        <Typography>Wallet not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 5, textAlign: 'center' }}>
      
      <button onClick={goBack} className="mb-4">
        ← Back
      </button>

      <div className="glass-card p-6">
        <Typography variant="h5" mb={2}>
          Receive Crypto
        </Typography>

        <Box sx={{ display: 'inline-block', p: 2 }}>
          <QRCode value={address} size={150} />
        </Box>

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            value={address}
            InputProps={{ readOnly: true }}
          />
          <IconButton sx={{ ml: 1 }} onClick={copyAddress}>
            <ContentCopyIcon />
          </IconButton>
        </Box>
      </div>

      <Snackbar
        open={copied}
        autoHideDuration={2000}
        onClose={() => setCopied(false)}
      >
        <Alert severity="success">Address copied!</Alert>
      </Snackbar>
    </Box>
  );
};

export default ReceiveView;
