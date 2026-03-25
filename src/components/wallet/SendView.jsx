// src/components/wallet/SendView.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  IconButton,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { networks } from '../../utils/networks';
import { isAddress, parseEther } from 'ethers';
import toast from 'react-hot-toast';

const SendView = ({ walletProvider }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState(networks[0]);
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    const detectNetwork = async () => {
      if (walletProvider?.getNetwork) {
        try {
          const net = await walletProvider.getNetwork();
          const found = networks.find(
            (n) => parseInt(n.chainId, 16) === net.chainId
          );
          if (found) setNetwork(found);
        } catch (err) {
          console.error('Failed to detect network', err);
        }
      }
    };
    detectNetwork();
  }, [walletProvider]);

  const handleNetworkChange = async (event) => {
    const net = networks.find((n) => n.name === event.target.value);
    if (!net) return;

    try {
      await walletProvider.send('wallet_switchEthereumChain', [
        { chainId: net.chainId },
      ]);
      setNetwork(net);
      toast.success(`Switched to ${net.name}`);
    } catch (switchError) {
      console.error(switchError);
      toast.error('Failed to switch network. Add it to your wallet first.');
    }
  };

  const handleSend = async () => {
    if (!walletProvider) {
      toast.error('Wallet not connected');
      return;
    }

    // ethers v6 validation
    if (!recipient || !isAddress(recipient)) {
      toast.error('Invalid recipient address');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Invalid amount');
      return;
    }

    setSending(true);
    setStatus('Sending transaction...');
    setTxHash('');

    try {
      const signer = await walletProvider.getSigner();

      const tx = await signer.sendTransaction({
        to: recipient,
        value: parseEther(amount),
      });

      setTxHash(tx.hash);
      setStatus('Transaction sent! Waiting for confirmation...');
      toast.success('Transaction sent');

      await tx.wait();

      setStatus('Transaction confirmed!');
      toast.success('Transaction confirmed!');
    } catch (err) {
      console.error(err);
      setStatus(`Error: ${err.message}`);
      toast.error('Transaction failed');
    } finally {
      setSending(false);
    }
  };

  const copyHash = () => {
    if (txHash) {
      navigator.clipboard.writeText(txHash);
      toast.success('Transaction hash copied!');
    }
  };

  const shortHash = (hash) =>
    `${hash.slice(0, 6)}...${hash.slice(-4)}`;

  return (
    <Box
      sx={{
        maxWidth: 450,
        mx: 'auto',
        mt: 5,
        p: 3,
        border: '1px solid #444',
        borderRadius: 2,
        backgroundColor: '#1e1e1e',
        color: '#fff',
      }}
    >
      <Typography variant="h5" mb={2}>
        Send Crypto
      </Typography>

      <TextField
        fullWidth
        label="Recipient Address"
        variant="outlined"
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        label="Amount"
        type="number"
        variant="outlined"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        select
        fullWidth
        label="Network"
        value={network.name}
        onChange={handleNetworkChange}
        sx={{ mb: 2 }}
      >
        {networks.map((net) => (
          <MenuItem key={net.chainId} value={net.name}>
            {net.name}
          </MenuItem>
        ))}
      </TextField>

      <Button
        variant="contained"
        color="primary"
        fullWidth
        onClick={handleSend}
        disabled={sending}
        sx={{ mb: 2 }}
      >
        {sending ? 'Sending...' : 'Send'}
      </Button>

      {status && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="body2">{status}</Typography>

          {txHash && (
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
              <Typography
                variant="body2"
                sx={{ mr: 1, wordBreak: 'break-all' }}
              >
                {shortHash(txHash)}
              </Typography>

              <IconButton
                size="small"
                onClick={copyHash}
                sx={{ color: '#90caf9' }}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SendView;
