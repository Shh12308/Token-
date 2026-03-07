// src/screens/SettingsScreen.jsx
import React, { useState } from 'react';
import { Box, Typography, Switch, FormControlLabel, Button } from '@mui/material';

const SettingsScreen = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  return (
    <Box
      sx={{
        maxWidth: 500,
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
        Settings
      </Typography>

      <FormControlLabel
        control={
          <Switch
            checked={darkMode}
            onChange={(e) => setDarkMode(e.target.checked)}
            color="primary"
          />
        }
        label="Dark Mode"
      />

      <FormControlLabel
        control={
          <Switch
            checked={notifications}
            onChange={(e) => setNotifications(e.target.checked)}
            color="primary"
          />
        }
        label="Notifications"
      />

      <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
        Save Settings
      </Button>
    </Box>
  );
};

export default SettingsScreen;
