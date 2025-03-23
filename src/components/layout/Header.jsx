import React, { useState, useEffect } from 'react';
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
  Avatar,
  ListItemIcon
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Email as EmailIcon,
  Settings,
  Logout
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageTitle from './PageTitle';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';

const Header = ({ onMenuClick }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const { sidebarColor } = useTheme();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!currentUser?.uid) return;

    // Kullanıcının okunmamış mesajlarını dinle
    const messagesRef = collection(db, 'messages');
    const q = query(
      messagesRef,
      where('receiverId', '==', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadMessageCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

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
          <IconButton 
            color="inherit" 
            onClick={handleEmailClick}
            sx={{
              position: 'relative',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.1)'
              }
            }}
          >
            <Badge 
              badgeContent={unreadMessageCount} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  backgroundColor: '#f44336',
                  color: 'white',
                  fontWeight: 'bold'
                }
              }}
            >
              <EmailIcon />
            </Badge>
          </IconButton>

          {/* <IconButton color="inherit">
            <Badge badgeContent={17} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton> */}

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
                bgcolor: 'rgba(255,255,255,0.15)',
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: '0.75rem',
                fontWeight: '500',
                letterSpacing: '0.5px',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(8px)',
                transition: 'all 0.2s ease',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.2)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }
              }}
            >
              {currentUser?.role === 'ADMIN' ? 'YÖNETİCİ' : 
               currentUser?.role === 'MANAGER' ? 'MÜDÜR' : 
               currentUser?.role === 'PERSONEL' ? 'PERSONEL' : 
               currentUser?.role === 'EMPLOYEE' ? 'EMPLOYEE' : 
               currentUser?.role || 'PERSONEL'}
            </Typography>

            <IconButton
              onClick={handleMenu}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
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
              id="account-menu"
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
              onClick={handleClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
                  mt: 1.5,
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&:before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    bgcolor: 'background.paper',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/profile'); }}>
                <Avatar /> Profil
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <Settings fontSize="small" />
                </ListItemIcon>
                Ayarlar
              </MenuItem>
              <Divider />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
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
