import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Box,
  Collapse,
  Popper,
  Paper,
  Grow,
  ClickAwayListener,
  Snackbar,
  Alert
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AssignmentIcon from '@mui/icons-material/Assignment';
import InventoryIcon from '@mui/icons-material/Inventory';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import { ArrowRight as ArrowRightIcon } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import FolderIcon from '@mui/icons-material/Folder';
import ChatIcon from '@mui/icons-material/Chat';
import PaymentIcon from '@mui/icons-material/Payment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';
import MoneyIcon from '@mui/icons-material/Money';
import { usePermission } from '../../contexts/PermissionContext';
import { menuItems } from '../../constants/menuItems';

const drawerWidth = 240;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarColor } = useTheme();
  const { hasPermission } = usePermission();
  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  const handleMenuClick = (event, item) => {
    if (item.path) {
      if (item.permission && !hasPermission(item.permission)) {
        setSnackbar({
          open: true,
          message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır.'
        });
        return;
      }
      navigate(item.path);
    } else if (item.children) {
      setOpenMenu(openMenu === item.title ? null : item.title);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleSubMenuClick = (child) => {
    if (child.permission && !hasPermission(child.permission)) {
      setSnackbar({
        open: true,
        message: 'Bu sayfaya erişim yetkiniz bulunmamaktadır.'
      });
      return;
    }
    navigate(child.path);
    handleClose();
  };

  const handleClose = () => {
    setOpenMenu(null);
    setAnchorEl(null);
  };

  const handleSnackbarClose = () => {
    setSnackbar({ open: false, message: '' });
  };

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            bgcolor: sidebarColor,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <Box sx={{ overflow: 'auto', mt: '64px', flex: 1 }}>
          <List>
            {menuItems.map((item) => (
                <React.Fragment key={item.title}>
                  <ListItem disablePadding>
                    <ListItemButton
                      onClick={(e) => handleMenuClick(e, item)}
                      selected={location.pathname === item.path || openMenu === item.title}
                      sx={{
                        '&.Mui-selected': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                          },
                        },
                        '&:hover': {
                          bgcolor: 'rgba(255, 255, 255, 0.1)',
                        },
                        opacity: item.permission && !hasPermission(item.permission) ? 0.6 : 1,
                      }}
                    >
                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.title} 
                      sx={{ 
                        '& .MuiTypography-root': { 
                          fontSize: '0.95rem',
                          fontWeight: 500
                        } 
                      }} 
                    />
                    {item.children && <ArrowRightIcon />}
                  </ListItemButton>
                </ListItem>

                {item.children && (
                  <Popper
                    open={openMenu === item.title}
                    anchorEl={anchorEl}
                    placement="right-start"
                    transition
                    sx={{ zIndex: 1300 }}
                  >
                    {({ TransitionProps }) => (
                      <Grow {...TransitionProps}>
                        <Paper 
                          sx={{ 
                            bgcolor: sidebarColor,
                            color: 'white',
                            borderRadius: 1,
                            boxShadow: 3,
                            mt: 1
                          }}
                        >
                          <ClickAwayListener onClickAway={handleClose}>
                            <List>
                              {item.children.map((child) => (
                                <ListItem key={child.title} disablePadding>
                                  <ListItemButton
                                    onClick={() => handleSubMenuClick(child)}
                                    selected={location.pathname === child.path}
                                    sx={{
                                      '&.Mui-selected': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                        '&:hover': {
                                          bgcolor: 'rgba(255, 255, 255, 0.2)',
                                        },
                                      },
                                      '&:hover': {
                                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                                      },
                                      opacity: child.permission && !hasPermission(child.permission) ? 0.6 : 1,
                                    }}
                                  >
                                    <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                      {child.icon}
                                    </ListItemIcon>
                                    <ListItemText 
                                      primary={child.title}
                                      sx={{ 
                                        '& .MuiTypography-root': { 
                                          fontSize: '0.9rem',
                                          fontWeight: 400
                                        } 
                                      }}
                                    />
                                  </ListItemButton>
                                </ListItem>
                              ))}
                            </List>
                          </ClickAwayListener>
                        </Paper>
                      </Grow>
                    )}
                  </Popper>
                )}
              </React.Fragment>
            ))}
          </List>
        </Box>

        {/* Logo/Başlık Alanı */}
        <Box
          sx={{
            p: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.12)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 1,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 100%)'
          }}
        >
          <Box
            sx={{
              fontSize: '1.2rem',
              fontWeight: 'bold',
              textAlign: 'center',
              letterSpacing: '1px',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              opacity: 0.9,
              transition: 'all 0.3s ease',
              '&:hover': {
                opacity: 1,
                transform: 'scale(1.02)'
              }
            }}
          >
            OĞUZATA
          </Box>
          <Box
            sx={{
              fontSize: '0.75rem',
              color: 'rgba(255,255,255,0.7)',
              textAlign: 'center'
            }}
          >
            Şantiye Takip Programı
            <br />
            2024
          </Box>
        </Box>
      </Drawer>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity="warning" 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default Sidebar;
