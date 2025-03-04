import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tabs,
    Tab,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    TextField,
    Button,
    Tooltip
} from '@mui/material';
import {
    Check as CheckIcon,
    Close as CloseIcon,
    RemoveRedEye as ViewIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { format } from 'date-fns';
import tr from 'date-fns/locale/tr';

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box sx={{ p: 3 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function OnayMerkezi() {
    const navigate = useNavigate();
    const [tabValue, setTabValue] = useState(0);
    const [hakedisler, setHakedisler] = useState([]);
    const [odemeler, setOdemeler] = useState([]);
    const [diger, setDiger] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reddetDialogOpen, setReddetDialogOpen] = useState(false);
    const [reddetNedeni, setReddetNedeni] = useState('');
    const [secilenHakedis, setSecilenHakedis] = useState(null);

    useEffect(() => {
        loadOnayBekleyenler();
    }, []);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const loadOnayBekleyenler = async () => {
        try {
            // Kullanıcı rolünü kontrol et
            const currentUser = auth.currentUser;
            if (!currentUser) {
                navigate('/');
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            if (!userDoc.exists() || userDoc.data().role?.toUpperCase() !== 'YÖNETİM') {
                navigate('/');
                return;
            }

            // Onay bekleyen hakedişleri getir
            const hakedisQuery = query(
                collection(db, 'hakedisler'),
                where('durum', '==', 'onayda')
            );
            const hakedisSnapshot = await getDocs(hakedisQuery);
            const hakedisData = hakedisSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHakedisler(hakedisData);
            setLoading(false);
        } catch (error) {
            console.error('Onay bekleyenler yüklenirken hata:', error);
            setLoading(false);
        }
    };

    const handleOnayla = async (hakedis) => {
        try {
            const hakedisRef = doc(db, 'hakedisler', hakedis.id);
            await updateDoc(hakedisRef, {
                durum: 'onaylandı',
                onayTarihi: new Date(),
                onaylayan: auth.currentUser.email
            });
            loadOnayBekleyenler();
        } catch (error) {
            console.error('Hakediş onaylanırken hata:', error);
        }
    };

    const handleReddet = async () => {
        if (!secilenHakedis || !reddetNedeni) return;

        try {
            const hakedisRef = doc(db, 'hakedisler', secilenHakedis.id);
            await updateDoc(hakedisRef, {
                durum: 'reddedildi',
                reddetNedeni: reddetNedeni,
                reddetmeTarihi: new Date(),
                reddeden: auth.currentUser.email
            });

            setReddetDialogOpen(false);
            setReddetNedeni('');
            setSecilenHakedis(null);
            loadOnayBekleyenler();
        } catch (error) {
            console.error('Hakediş reddedilirken hata:', error);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <Typography>Yükleniyor...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
                Onay Merkezi
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={handleTabChange}>
                    <Tab label={`HAKEDİŞLER (${hakedisler.length})`} />
                    <Tab label={`ÖDEMELER (${odemeler.length})`} />
                    <Tab label={`DİĞER (${diger.length})`} />
                </Tabs>
            </Box>

            <TabPanel value={tabValue} index={0}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Hakediş No</TableCell>
                                <TableCell>Taşeron</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell>Tutar</TableCell>
                                <TableCell>İşlemler</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {hakedisler.map((hakedis) => (
                                <TableRow key={hakedis.id}>
                                    <TableCell>{hakedis.hakedisNo}</TableCell>
                                    <TableCell>{hakedis.taseronAdi}</TableCell>
                                    <TableCell>
                                        {format(hakedis.olusturmaTarihi.toDate(), 'dd.MM.yyyy', { locale: tr })}
                                    </TableCell>
                                    <TableCell>{hakedis.toplamTutar?.toLocaleString('tr-TR')} TL</TableCell>
                                    <TableCell>
                                        <Tooltip title="Detaylı Görüntüle">
                                            <IconButton 
                                                onClick={() => navigate(`/hakedis/${hakedis.id}`)}
                                                color="primary"
                                            >
                                                <ViewIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Onayla">
                                            <IconButton 
                                                onClick={() => handleOnayla(hakedis)}
                                                color="success"
                                            >
                                                <CheckIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Reddet">
                                            <IconButton 
                                                onClick={() => {
                                                    setSecilenHakedis(hakedis);
                                                    setReddetDialogOpen(true);
                                                }}
                                                color="error"
                                            >
                                                <CloseIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {hakedisler.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center">
                                        Onay bekleyen hakediş bulunmamaktadır.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography>Onay bekleyen ödeme bulunmamaktadır.</Typography>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
                <Typography>Onay bekleyen başka işlem bulunmamaktadır.</Typography>
            </TabPanel>

            {/* Reddetme Dialog */}
            <Dialog 
                open={reddetDialogOpen} 
                onClose={() => {
                    setReddetDialogOpen(false);
                    setReddetNedeni('');
                    setSecilenHakedis(null);
                }}
            >
                <DialogTitle>Hakediş Reddetme</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {secilenHakedis?.hakedisNo} nolu hakediş için ret nedenini belirtiniz:
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Ret Nedeni"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        value={reddetNedeni}
                        onChange={(e) => setReddetNedeni(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => {
                        setReddetDialogOpen(false);
                        setReddetNedeni('');
                        setSecilenHakedis(null);
                    }}>
                        İptal
                    </Button>
                    <Button 
                        onClick={handleReddet} 
                        color="error"
                        disabled={!reddetNedeni.trim()}
                    >
                        Reddet
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default OnayMerkezi;
