import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Paper,
    CircularProgress,
    Alert,
    Grid
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { formatMoney } from '../../utils/format';
import SozlesmeSecici from '../../components/SozlesmeSecici';

const YesilDefterList = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [yesilDefterList, setYesilDefterList] = useState([]);
    const [selectedSozlesme, setSelectedSozlesme] = useState('');
    const [toplamSozlesmeBedeli, setToplamSozlesmeBedeli] = useState(0);
    const [toplamGerceklesme, setToplamGerceklesme] = useState(0);
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (selectedSozlesme) {
            loadYesilDefterList();
        } else {
            setLoading(false);
        }
    }, [selectedSozlesme]);

    const loadYesilDefterList = async () => {
        if (!selectedSozlesme) return;
        
        try {
            setLoading(true);
            setError(null);
            console.log('Yeşil defter listesi yükleniyor...', selectedSozlesme);
            
            const yesilDefterRef = collection(db, 'yesilDefter');
            const q = query(
                yesilDefterRef,
                where('sozlesmeId', '==', selectedSozlesme),
                where('kullaniciId', '==', currentUser.uid),
                orderBy('createdAt', 'desc')
            );
            
            console.log('Query oluşturuldu:', q);
            const querySnapshot = await getDocs(q);
            console.log('Query sonucu:', querySnapshot.size);
            
            const yesilDefterData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Toplam değerleri hesapla
            let toplamBedel = 0;
            let toplamGerceklesen = 0;

            yesilDefterData.forEach(item => {
                const birimFiyat = Number(item.birimFiyat) || 0;
                const miktar = Number(item.miktar) || 0;
                const yapilan = Number(item.oncekiAylarToplami || 0) + 
                              Number(item.gecenAy || 0) + 
                              Number(item.buAy || 0);

                toplamBedel += birimFiyat * miktar;
                toplamGerceklesen += birimFiyat * yapilan;
            });

            setToplamSozlesmeBedeli(toplamBedel);
            setToplamGerceklesme(toplamGerceklesen);
            setYesilDefterList(yesilDefterData);
        } catch (error) {
            console.error('Yeşil defter listesi yüklenirken hata:', error);
            setError('Yeşil defter listesi yüklenemedi');
            enqueueSnackbar('Veriler yüklenirken bir hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Bu kaydı silmek istediğinizden emin misiniz?')) {
            return;
        }

        try {
            await deleteDoc(doc(db, 'yesilDefter', id));
            enqueueSnackbar('Kayıt başarıyla silindi', { variant: 'success' });
            loadYesilDefterList();
        } catch (error) {
            console.error('Kayıt silinirken hata:', error);
            enqueueSnackbar('Kayıt silinirken bir hata oluştu', { variant: 'error' });
        }
    };

    const handleSozlesmeChange = (event, newValue) => {
        setSelectedSozlesme(newValue?.id || '');
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Yeşil Defter
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => navigate('/yesilDefter/yeni')}
                >
                    Yeni Kayıt
                </Button>
            </Box>

            <Box sx={{ mb: 4 }}>
                <SozlesmeSecici
                    value={selectedSozlesme}
                    onChange={handleSozlesmeChange}
                />
            </Box>

            {selectedSozlesme && (
                <>
                    {/* Özet Kartları */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Toplam Sözleşme Bedeli
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatMoney(toplamSozlesmeBedeli)}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom>
                                        Toplam Gerçekleşme
                                    </Typography>
                                    <Typography variant="h4">
                                        {formatMoney(toplamGerceklesme)}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        ({((toplamGerceklesme / toplamSozlesmeBedeli) * 100).toFixed(2)}%)
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    </Grid>

                    <Card>
                        <CardContent>
                            {error && (
                                <Alert severity="error" sx={{ mb: 3 }}>
                                    {error}
                                </Alert>
                            )}

                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Poz No</TableCell>
                                            <TableCell>İş Kalemi</TableCell>
                                            <TableCell>Birim</TableCell>
                                            <TableCell align="right">Birim Fiyat</TableCell>
                                            <TableCell align="right">Önceki Aylar</TableCell>
                                            <TableCell align="right">Geçen Ay</TableCell>
                                            <TableCell align="right">Bu Ay</TableCell>
                                            <TableCell align="right">Toplam</TableCell>
                                            <TableCell align="right">Gerçekleşme</TableCell>
                                            <TableCell>İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {yesilDefterList.map((item) => {
                                            const oncekiAylar = Number(item.oncekiAylarToplami) || 0;
                                            const gecenAy = Number(item.gecenAy) || 0;
                                            const buAy = Number(item.buAy) || 0;
                                            const toplam = oncekiAylar + gecenAy + buAy;
                                            const miktar = Number(item.miktar) || 0;
                                            const gerceklesme = miktar > 0 ? (toplam / miktar) * 100 : 0;

                                            return (
                                                <TableRow key={item.id}>
                                                    <TableCell>{item.pozNo}</TableCell>
                                                    <TableCell>{item.isKalemiAdi}</TableCell>
                                                    <TableCell>{item.birim}</TableCell>
                                                    <TableCell align="right">
                                                        {formatMoney(item.birimFiyat)}
                                                    </TableCell>
                                                    <TableCell align="right">{oncekiAylar.toFixed(2)}</TableCell>
                                                    <TableCell align="right">{gecenAy.toFixed(2)}</TableCell>
                                                    <TableCell align="right">{buAy.toFixed(2)}</TableCell>
                                                    <TableCell align="right">{toplam.toFixed(2)}</TableCell>
                                                    <TableCell align="right">%{gerceklesme.toFixed(2)}</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            onClick={() => navigate(`/yesilDefter/duzenle/${item.id}`)}
                                                            size="small"
                                                        >
                                                            <EditIcon />
                                                        </IconButton>
                                                        <IconButton
                                                            onClick={() => handleDelete(item.id)}
                                                            size="small"
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {yesilDefterList.length === 0 && (
                                            <TableRow>
                                                <TableCell colSpan={10} align="center">
                                                    <Typography variant="body2" sx={{ py: 2 }}>
                                                        Bu sözleşmeye ait kayıt bulunamadı
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </>
            )}
        </Box>
    );
};

export default YesilDefterList; 