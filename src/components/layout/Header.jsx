import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Badge,
  Divider,
  Avatar
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageTitle from './PageTitle';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { sidebarColor } = useTheme();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata:', error);
    }
  };

  const handleEmailClick = () => {
    navigate('/mesajlar');
  };

  return (
    <AppBar 
      position="fixed" 
      sx={{ 
        zIndex: (theme) => theme.zIndex.drawer + 1,
        bgcolor: sidebarColor
      }}
    >
      <Toolbar>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          onClick={onMenuClick}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              color: 'rgba(255,255,255,0.7)',
              fontWeight: 'normal'
            }}
          >
            OĞUZATA
          </Typography>
          <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)', mx: 1 }} />
          <PageTitle />
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton color="inherit" onClick={handleEmailClick}>
            <Badge badgeContent={4} color="error">
              <EmailIcon />
            </Badge>
          </IconButton>

          <IconButton color="inherit">
            <Badge badgeContent={17} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography 
                variant="subtitle2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.9)',
                  fontWeight: 'normal',
                  fontSize: '0.75rem'
                }}
              >
                HOŞGELDİNİZ
              </Typography>
              <Typography 
                variant="body2"
                sx={{ 
                  color: 'white',
                  fontWeight: '500'
                }}
              >
                {currentUser?.name} {currentUser?.surname}
              </Typography>
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: 'white',
                bgcolor: 'primary.main',
                px: 1,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
              }}
            >
              {currentUser?.role === 'ADMIN' ? 'YÖNETİCİ' : 
               currentUser?.role === 'MANAGER' ? 'MÜDÜR' : 
               currentUser?.role === 'PERSONEL' ? 'PERSONEL' : 
               currentUser?.role === 'EMPLOYEE' ? 'EMPLOYEE' : 
               currentUser?.role || 'PERSONEL'}
            </Typography>

            <IconButton onClick={handleMenu} sx={{ p: 0 }}>
              <Avatar
                src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.name}+${currentUser?.surname}&background=1a237e&color=fff`}
                alt={currentUser?.name}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  border: '2px solid rgba(255,255,255,0.2)',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    border: '2px solid rgba(255,255,255,0.4)'
                  }
                }}
              />
            </IconButton>

            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                Profil
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                Ayarlar
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                Çıkış Yap
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
