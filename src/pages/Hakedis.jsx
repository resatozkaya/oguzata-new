import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Grid,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Info as InfoIcon } from '@mui/icons-material';
import { collection, query, getDocs, doc, deleteDoc, addDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { format } from 'date-fns';
import tr from 'date-fns/locale/tr';

const Hakedis = () => {
    const { projeId } = useParams();
    const navigate = useNavigate();
    const [hakedisler, setHakedisler] = useState([]);
    const [silmeDialog, setSilmeDialog] = useState({ open: false, id: null });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchHakedisler();
    }, [projeId]);

    const fetchHakedisler = async () => {
        try {
            let q;
            if (projeId) {
                q = query(
                    collection(db, 'hakedisler'),
                    where('projeId', '==', projeId),
                    orderBy('olusturmaTarihi', 'desc')
                );
            } else {
                q = query(collection(db, 'hakedisler'), orderBy('olusturmaTarihi', 'desc'));
            }
            const querySnapshot = await getDocs(q);
            const hakedislerData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setHakedisler(hakedislerData);
        } catch (error) {
            console.error('Hakedişler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleYeniHakedis = async () => {
        try {
            const yeniHakedis = {
                hakedisNo: '',
                donem: new Date(),
                toplamTutar: 0,
                durum: 'taslak',
                projeId: projeId || null,
                olusturmaTarihi: new Date()
            };

            const docRef = await addDoc(collection(db, 'hakedisler'), yeniHakedis);
            navigate(`/hakedis/duzenle/${docRef.id}`);
        } catch (error) {
            console.error('Hakediş oluşturulurken hata:', error);
        }
    };

    const handleDuzenle = (id) => {
        navigate(`/hakedis/duzenle/${id}`);
    };

    const handleSil = async () => {
        if (!silmeDialog.id) return;

        try {
            await deleteDoc(doc(db, 'hakedisler', silmeDialog.id));
            setSilmeDialog({ open: false, id: null });
            fetchHakedisler();
        } catch (error) {
            console.error('Hakediş silinirken hata:', error);
        }
    };

    if (loading) {
        return <Typography>Yükleniyor...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                    Hakediş Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    onClick={handleYeniHakedis}
                >
                    Yeni Hakediş
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Hakediş No</TableCell>
                            <TableCell>Taşeron</TableCell>
                            <TableCell>Tarih</TableCell>
                            <TableCell>Toplam Tutar</TableCell>
                            <TableCell>Durum</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {hakedisler.map((hakedis) => (
                            <TableRow key={hakedis.id}>
                                <TableCell>{hakedis.hakedisNo || '-'}</TableCell>
                                <TableCell>{hakedis.taseronAdi || '-'}</TableCell>
                                <TableCell>
                                    {hakedis.donem ? format(hakedis.donem.toDate(), 'dd.MM.yyyy', { locale: tr }) : '-'}
                                </TableCell>
                                <TableCell>{hakedis.toplamTutar?.toLocaleString('tr-TR') || '0'} TL</TableCell>
                                <TableCell>
                                    <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        color: hakedis.durum === 'onaylandi' ? 'success.main' : 
                                               hakedis.durum === 'reddedildi' ? 'error.main' : 
                                               hakedis.durum === 'onayda' ? 'info.main' : 'text.primary'
                                    }}>
                                        {hakedis.durum === 'onaylandi' ? 'Onaylandı' :
                                         hakedis.durum === 'reddedildi' ? 'Reddedildi' :
                                         hakedis.durum === 'onayda' ? 'Onayda' : 'Taslak'}
                                        {hakedis.durum === 'reddedildi' && hakedis.redNedeni && (
                                            <Tooltip title={`Red Nedeni: ${hakedis.redNedeni}`}>
                                                <IconButton size="small">
                                                    <InfoIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </Box>
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        color="primary"
                                        onClick={() => handleDuzenle(hakedis.id)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        color="error"
                                        onClick={() => setSilmeDialog({ open: true, id: hakedis.id })}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog
                open={silmeDialog.open}
                onClose={() => setSilmeDialog({ open: false, id: null })}
            >
                <DialogTitle>Hakediş Sil</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bu hakedişi silmek istediğinizden emin misiniz?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setSilmeDialog({ open: false, id: null })}>İptal</Button>
                    <Button onClick={handleSil} color="error" variant="contained">
                        Sil
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Hakedis;
