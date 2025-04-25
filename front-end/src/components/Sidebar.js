import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Divider,
  Switch,
  Typography,
  Box
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as CartIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Menu as MenuIcon,
  Close as CloseIcon
} from '@mui/icons-material';

const Sidebar = ({ open, onClose }) => {
  const theme = useTheme();
  const { isDarkMode, toggleTheme, colors } = theme;

  const menuItems = [
    { text: 'Inicio', icon: <HomeIcon />, path: '/' },
    { text: 'Productos', icon: <CartIcon />, path: '/products' },
    { text: 'Perfil', icon: <PersonIcon />, path: '/profile' },
    { text: 'Configuración', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: colors.background,
          color: colors.text,
        }
      }}
    >
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '16px',
        backgroundColor: colors.surface
      }}>
        <Typography variant="h6" sx={{ color: colors.text }}>
          Ohana Tienda
        </Typography>
        <IconButton onClick={onClose} sx={{ color: colors.text }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Divider sx={{ backgroundColor: colors.text }} />

      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text}
            sx={{ 
              '&:hover': {
                backgroundColor: colors.surface,
              }
            }}
          >
            <ListItemIcon sx={{ color: colors.text }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText primary={item.text} sx={{ color: colors.text }} />
          </ListItem>
        ))}

        <Divider sx={{ backgroundColor: colors.text, margin: '16px 0' }} />

        <ListItem>
          <ListItemIcon sx={{ color: colors.text }}>
            {isDarkMode ? <DarkModeIcon /> : <LightModeIcon />}
          </ListItemIcon>
          <ListItemText 
            primary={isDarkMode ? 'Modo Oscuro' : 'Modo Claro'} 
            sx={{ color: colors.text }} 
          />
          <Switch
            checked={isDarkMode}
            onChange={toggleTheme}
            color="primary"
          />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default Sidebar; 