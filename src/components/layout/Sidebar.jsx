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
  ClickAwayListener
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
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import { useTheme } from '../../contexts/ThemeContext';
import FolderIcon from '@mui/icons-material/Folder';
import ChatIcon from '@mui/icons-material/Chat';
import PaymentIcon from '@mui/icons-material/Payment';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import TimelineIcon from '@mui/icons-material/Timeline';
import AddIcon from '@mui/icons-material/Add';

const drawerWidth = 240;

const menuItems = [
  { text: 'Anasayfa', icon: <DashboardIcon />, path: '/' },
  { text: 'Şantiye Yönetimi', icon: <BusinessIcon />, path: '/santiye' },
  { text: 'Personel Yönetimi', icon: <PersonIcon />, path: '/personel' },
  { text: 'Puantaj', icon: <AccessTimeIcon />, path: '/puantaj' },
  { text: 'İş Programı', icon: <AssignmentIcon />, path: '/is-programi' },
  { text: 'Depo Yönetimi', icon: <InventoryIcon />, path: '/depo' },
  { text: 'Günlük Rapor', icon: <DescriptionIcon />, path: '/gunluk-rapor' },
  { text: 'Sözleşme', icon: <DescriptionIcon />, path: '/sozlesme' },
  {
    text: 'Hakediş',
    icon: <AccountBalanceIcon />,
    path: '/hakedis'
  },
  {
    text: 'Teslimat Ekip',
    icon: <AccessTimeIcon />,
    path: '/teslimat-ekip'
  },
  {
    text: 'Mesajlaşma',
    icon: <ChatIcon />,
    path: '/mesajlar'
  },
  {
    text: 'Ayarlar',
    icon: <SettingsIcon />,
    path: '/settings'
  }
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarColor } = useTheme();
  const [openMenu, setOpenMenu] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenuClick = (event, item) => {
    if (item.path) {
      navigate(item.path);
    } else if (item.children) {
      setOpenMenu(openMenu === item.text ? null : item.text);
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setOpenMenu(null);
    setAnchorEl(null);
  };

  const handleSubMenuClick = (path) => {
    navigate(path);
    handleClose();
  };

  return (
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
            <React.Fragment key={item.text}>
              <ListItem disablePadding>
                <ListItemButton
                  onClick={(e) => handleMenuClick(e, item)}
                  selected={location.pathname === item.path || openMenu === item.text}
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
                  }}
                >
                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
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
                  open={openMenu === item.text}
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
                              <ListItem key={child.text} disablePadding>
                                <ListItemButton
                                  onClick={() => handleSubMenuClick(child.path)}
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
                                  }}
                                >
                                  <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                    {child.icon}
                                  </ListItemIcon>
                                  <ListItemText 
                                    primary={child.text}
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
            opacity: 0.7,
            textAlign: 'center',
            fontStyle: 'italic',
            letterSpacing: '0.5px'
          }}
        >
          Şantiye Takip Programı
          <br />
          2024
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
