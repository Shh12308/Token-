import React, { useState, useEffect } from 'react';
import { Box, Grid, Card, CardActions, CardContent, CardMedia, Button, Typography, Chip } from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api'; // Path adjusted

const generateMockKycQueue = () => {
  const queue = [];
  for (let i = 1; i <= 6; i++) {
    queue.push({
      id: `cb-user-${i}`,
      email: `kyc.user${i}@cryptobean.com`,
      kycStatus: 'pending',
      kycDocuments: {
        idUrl: `https://picsum.photos/seed/cb-id${i}/400/250`,
        selfieUrl: `https://picsum.photos/seed/cb-selfie${i}/300/400`,
      },
    });
  }
  return queue;
};

export default function KycSection() { // Renamed for clarity
  const [kycQueue, setKycQueue] = useState([]);

  useEffect(() => {
    setTimeout(() => setKycQueue(generateMockKycQueue()), 500);
  }, []);

  const handleKycDecision = (userId, status) => {
    const promise = new Promise((resolve, reject) => {
      setTimeout(() => {
        setKycQueue(prev => prev.filter(user => user.id !== userId));
        resolve({ message: `KYC ${status}` });
      }, 1000);
    });

    toast.promise(promise, {
      loading: 'Updating status...',
      success: `KYC ${status}!`,
      error: 'Failed to update KYC.',
    });
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>KYC Review Queue</Typography>
      <Grid container spacing={3}>
        {kycQueue.map((user) => (
          <Grid item xs={12} sm={6} md={4} key={user.id}>
            <Card>
              <CardMedia component="img" height="200" image={user.kycDocuments?.selfieUrl} alt="KYC Document" />
              <CardContent>
                <Typography gutterBottom variant="h6">{user.email}</Typography>
                <Chip label={`Status: ${user.kycStatus}`} color="primary" size="small" />
              </CardContent>
              <CardActions>
                <Button size="small" color="success" startIcon={<CheckCircle />} onClick={() => handleKycDecision(user.id, 'verified')}>Approve</Button>
                <Button size="small" color="error" startIcon={<Cancel />} onClick={() => handleKycDecision(user.id, 'rejected')}>Reject</Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
