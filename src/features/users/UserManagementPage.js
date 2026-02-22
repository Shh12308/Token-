import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Avatar } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { Block as BlockIcon, Edit as EditIcon } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { adminApi } from '../../services/api'; // Path adjusted

const UserActions = ({ id }) => {
  const handleSuspend = () => {
    toast.promise(adminApi.suspendUser(id), {
      loading: 'Suspending user...',
      success: 'User suspended!',
      error: 'Failed to suspend user.',
    });
  };
  
  const handleAdjustBalance = () => {
    toast('Balance adjustment modal would open here.', { icon: '🔧' });
  };

  return (
    <>
      <GridActionsCellItem icon={<BlockIcon />} label="Suspend" onClick={handleSuspend} color="error" />
      <GridActionsCellItem icon={<EditIcon />} label="Adjust Balance" onClick={handleAdjustBalance} />
    </>
  );
};

const columns = [
  { field: 'id', headerName: 'User ID', width: 220 },
  {
    field: 'email',
    headerName: 'Email',
    width: 250,
    renderCell: (params) => (
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Avatar sx={{ mr: 1, width: 24, height: 24 }}>{params.row.email[0].toUpperCase()}</Avatar>
        {params.value}
      </Box>
    ),
  },
  { field: 'kycStatus', headerName: 'KYC Status', width: 150 },
  { field: 'balances', headerName: 'Balances', width: 200, valueGetter: (params) => Object.keys(params.value).join(', ') },
  { field: 'createdAt', headerName: 'Joined', width: 180, type: 'dateTime' },
  { field: 'actions', headerName: 'Actions', type: 'actions', width: 150, getActions: (params) => [<UserActions key={params.id} id={params.id} />] },
];

const generateMockUsers = () => {
  const statuses = ['pending', 'verified', 'rejected'];
  const users = [];
  for (let i = 1; i <= 100; i++) {
    users.push({
      id: `cb-user-${i.toString().padStart(4, '0')}`,
      email: `user${i}@cryptobean.com`,
      kycStatus: statuses[Math.floor(Math.random() * statuses.length)],
      balances: { BTC: Math.random() * 5, ETH: Math.random() * 20, USD: Math.random() * 10000 },
      createdAt: new Date(Date.now() - Math.random() * 31536000000),
    });
  }
  return users;
};

export default function UserManagementSection() { // Renamed for clarity
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setUsers(generateMockUsers());
      setLoading(false);
    }, 700);
  }, []);

  return (
    <Box sx={{ height: '60vh', width: '100%' }}> {/* Adjusted height for single page */}
      <Typography variant="h4" gutterBottom>User Management</Typography>
      <DataGrid
        rows={users}
        columns={columns}
        loading={loading}
        pageSize={25}
        rowsPerPageOptions={[10, 25, 50]}
        checkboxSelection
        disableSelectionOnClick
      />
    </Box>
  );
}
