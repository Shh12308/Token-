import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import {
  Box, Drawer, AppBar, Toolbar, List, Typography, ListItem, ListItemIcon, ListItemText,
  IconButton, Tooltip, Avatar
} from '@mui/material';
import {
  MenuOpen as MenuOpenIcon, Dashboard, People, ShoppingCart, Assignment,
  AccountBalance, Security, Settings, Notifications
} from '@mui/icons-material';

const drawerWidth = 260;

const menuItems = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
  { text: 'User Management', icon: <People />, path: '/admin/users' },
  { text: 'KYC/AML', icon: <Assignment />, path: '/admin/kyc' },
  { text: 'Order Management', icon: <ShoppingCart />, path: '/admin/orders' },
  { text: 'Finance & Wallets', icon: <AccountBalance />, path: '/admin/finance' },
  { text: 'Security', icon: <Security />, path: '/admin/security' },
  { text: 'Platform Settings', icon: <Settings />, path: '/admin/settings' },
];

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <div>
      <Toolbar><Typography variant="h6" noWrap component="div">Admin Panel</Typography></Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem button key={item.text} onClick={() => navigate(item.path)} selected={location.pathname === item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" aria-label="open drawer" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2, display: { sm: 'none' } }}>
            <MenuOpenIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {menuItems.find(item => item.path === location.pathname)?.text || 'Admin Panel'}
          </Typography>
          <Tooltip title="Real-time Notifications">
            <IconButton color="inherit"><Notifications /></IconButton>
          </Tooltip>
          <Tooltip title="Admin Profile">
             <Avatar sx={{ ml: 1, width: 32, height: 32 }}>A</Avatar>
          </Tooltip>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }} open>
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${drawerWidth}px)` } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;
