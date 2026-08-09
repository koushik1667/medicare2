import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Stack,
} from '@mui/material';
import {
  Home,
  People,
  School,
  Computer,
  Article,
  Email,
  Menu as MenuIcon,
  Logout,
  Security,
  Settings,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import LanguageSelector from '../common/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';

const drawerWidth = 270;

const AdminLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const menuItems = [
    { path: '/admin', label: 'Admin Console', icon: <Home /> },
    { path: '/admin/fraud-detection', label: t('navFraudDetection'), icon: <Security /> },
    { path: '/admin/ai-models', label: 'AI Models & Tuning', icon: <Computer /> },
    { path: '/admin/knowledge-base', label: 'Knowledge Base', icon: <School /> },
    { path: '/admin/doctors', label: 'Doctor Approvals', icon: <People /> },
    { path: '/admin/messages', label: 'System Messages', icon: <Email /> },
    { path: '/admin/logs', label: 'Audit Logs', icon: <Article /> },
  ];

  const drawer = (
    <Box sx={{ p: 2 }}>
      <Toolbar sx={{ px: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box
            sx={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              bgcolor: '#4A5D4E', // Deep Forest
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(74, 93, 78, 0.25)',
            }}
          >
            <Settings fontSize="small" />
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#2C2C24' }}
          >
            Admin Suite
          </Typography>
        </Stack>
      </Toolbar>
      <Divider sx={{ my: 1, borderColor: 'rgba(222, 216, 207, 0.7)' }} />
      <List sx={{ mt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
            <ListItemButton
              component={NavLink}
              to={item.path}
              end={item.path === '/admin'}
              sx={{
                borderRadius: 9999,
                py: 1.2,
                px: 2,
                '&.active': {
                  bgcolor: '#4A5D4E',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(74, 93, 78, 0.25)',
                  '& .MuiListItemIcon-root': {
                    color: '#FFFFFF',
                  },
                },
                '&:hover:not(.active)': {
                  bgcolor: 'rgba(74, 93, 78, 0.08)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 38, color: '#4A5D4E' }}>{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{ fontWeight: 700, fontSize: '0.9rem' }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', bgcolor: '#FDFCF8', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'rgba(253, 252, 248, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(222, 216, 207, 0.6)',
          color: '#2C2C24',
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, flexGrow: 1, color: '#2C2C24' }}
          >
            Admin Suite - {t('appTitle')}
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <LanguageSelector />
            <IconButton
              onClick={handleMenuOpen}
              sx={{
                p: 0.5,
                border: '2px solid #4A5D4E',
                borderRadius: '50%',
              }}
            >
              <Avatar sx={{ bgcolor: '#4A5D4E', color: '#fff', width: 34, height: 34, fontSize: '0.9rem' }}>
                {user?.full_name?.charAt(0) || 'A'}
              </Avatar>
            </IconButton>
          </Stack>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 4,
              sx: {
                borderRadius: '1.5rem',
                mt: 1,
                border: '1px solid #DED8CF',
                bgcolor: '#FEFEFA',
              },
            }}
          >
            <MenuItem disabled sx={{ fontWeight: 600 }}>
              {user?.full_name || 'System Admin'} (Admin)
            </MenuItem>
            <MenuItem onClick={handleLogout} sx={{ color: '#A85448', fontWeight: 600 }}>
              <Logout fontSize="small" sx={{ mr: 1 }} />
              Log Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#FDFCF8' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, bgcolor: '#FDFCF8', borderRight: '1px solid rgba(222, 216, 207, 0.6)' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
