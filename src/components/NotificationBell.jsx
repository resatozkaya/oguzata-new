import React, { useState, useEffect } from 'react';
import {
    Badge,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Box,
    Divider
} from '@mui/material';
import { 
    Notifications as NotificationsIcon,
    Assignment as AssignmentIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [notifications, setNotifications] = useState({
        hakedis: 0,
        odeme: 0
    });
    const [userRole, setUserRole] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Kullanıcı rolünü kontrol et
        const unsubscribeAuth = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userRole = userDocSnap.data().role?.toUpperCase();
                    setUserRole(userRole);
                }
            }
        });

        // Cleanup function
        return () => {
            unsubscribeAuth();
        };
    }, []);

    useEffect(() => {
        // Sadece yönetici için bildirimleri dinle
        let unsubscribeHakedis = () => {};

        if (userRole === 'YÖNETİM') {
            const hakedisQuery = query(
                collection(db, 'hakedisler'),
                where('durum', '==', 'onayda')
            );

            unsubscribeHakedis = onSnapshot(hakedisQuery, (snapshot) => {
                setNotifications(prev => ({
                    ...prev,
                    hakedis: snapshot.size
                }));
            });
        }

        // Cleanup function
        return () => {
            unsubscribeHakedis();
        };
    }, [userRole]);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleNavigate = (path) => {
        navigate(path);
        handleClose();
    };

    const totalNotifications = notifications.hakedis + notifications.odeme;

    if (userRole !== 'YÖNETİM') return null;

    return (
        <>
            <IconButton
                color="inherit"
                onClick={handleClick}
                sx={{ ml: 1 }}
            >
                <Badge badgeContent={totalNotifications} color="error">
                    <NotificationsIcon />
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                PaperProps={{
                    sx: { width: 320, maxHeight: 400 }
                }}
            >
                <Box sx={{ p: 2 }}>
                    <Typography variant="h6">
                        Onay Bekleyen İşlemler
                    </Typography>
                </Box>
                <Divider />

                {notifications.hakedis > 0 && (
                    <MenuItem onClick={() => handleNavigate('/onay-merkezi')}>
                        <AssignmentIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body1">
                                Hakediş Onayı
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {notifications.hakedis} hakediş onay bekliyor
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {notifications.odeme > 0 && (
                    <MenuItem onClick={() => handleNavigate('/onay-merkezi')}>
                        <PaymentIcon sx={{ mr: 2, color: 'primary.main' }} />
                        <Box>
                            <Typography variant="body1">
                                Ödeme Onayı
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {notifications.odeme} ödeme onay bekliyor
                            </Typography>
                        </Box>
                    </MenuItem>
                )}

                {totalNotifications === 0 && (
                    <MenuItem disabled>
                        <Typography variant="body2" color="text.secondary" sx={{ p: 1 }}>
                            Onay bekleyen işlem bulunmamaktadır
                        </Typography>
                    </MenuItem>
                )}
            </Menu>
        </>
    );
};

export default NotificationBell;
