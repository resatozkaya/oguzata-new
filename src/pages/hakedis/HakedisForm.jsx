import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Box,
    Button,
    TextField,
    Typography,
    Paper,
    Grid,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import tr from 'date-fns/locale/tr';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';

const HakedisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        hakedisNo: '',
        donem: null,
        toplamTutar: 0,
        durum: 'taslak',
        taseronId: '',
        taseronAdi: '',
        santiyeId: '',
        santiyeAdi: '',
        aciklama: '',
        onaylayanId: '',
        onaylayanAdi: '',
        onayTarihi: null,
        redNedeni: ''
    });
    const [metrajlar, setMetrajlar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [taseronlar, setTaseronlar] = useState([]);
    const [santiyeler, setSantiyeler] = useState([]);
    const [birimFiyatlar, setBirimFiyatlar] = useState([]);
    const [filtrelenmisBirimFiyatlar, setFiltrelenmisBirimFiyatlar] = useState([]);
    const [metrajDialogOpen, setMetrajDialogOpen] = useState(false);
    const [yeniMetraj, setYeniMetraj] = useState({
        pozNo: '',
        birimFiyatId: '',
        miktar: '',
        birim: '',
        tutar: 0
    });
    const [userRole, setUserRole] = useState(null);

    useEffect(() => {
        loadInitialData();
        const checkUserRole = async () => {
            const currentUser = auth.currentUser;
            if (currentUser) {
                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                }
            }
        };
        checkUserRole();
    }, [id]);

    const loadInitialData = async () => {
        try {
            // Taşeronları yükle
            const taseronlarSnapshot = await getDocs(
                query(collection(db, 'personeller'), where('calismaSekli', '==', 'TAŞERON'))
            );
            const taseronlarData = taseronlarSnapshot.docs.map(doc => ({
                id: doc.id,
                firma: doc.data().firma || '',
                ...doc.data()
            }));
            setTaseronlar(taseronlarData);

            // Şantiyeleri yükle
            const santiyelerSnapshot = await getDocs(collection(db, 'santiyeler'));
            const santiyelerData = santiyelerSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSantiyeler(santiyelerData);

            // Birim fiyatları yükle
            const birimFiyatlarSnapshot = await getDocs(collection(db, 'birimFiyatlar'));
            const birimFiyatlarData = birimFiyatlarSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBirimFiyatlar(birimFiyatlarData);

            if (id) {
                // Mevcut hakediş verilerini yükle
                const hakedisDoc = await getDoc(doc(db, 'hakedisler', id));
                if (hakedisDoc.exists()) {
                    const data = hakedisDoc.data();
                    setFormData({
                        hakedisNo: data.hakedisNo || '',
                        donem: data.donem ? new Date(data.donem.seconds * 1000) : null,
                        toplamTutar: data.toplamTutar || 0,
                        durum: data.durum || 'taslak',
                        taseronId: data.taseronId || '',
                        taseronAdi: data.taseronAdi || '',
                        santiyeId: data.santiyeId || '',
                        santiyeAdi: data.santiyeAdi || '',
                        aciklama: data.aciklama || '',
                        onaylayanId: data.onaylayanId || '',
                        onaylayanAdi: data.onaylayanAdi || '',
                        onayTarihi: data.onayTarihi ? new Date(data.onayTarihi.seconds * 1000) : null,
                        redNedeni: data.redNedeni || ''
                    });
                    setMetrajlar(data.metrajlar || []);
                    
                    // Mevcut taşeronun birim fiyatlarını filtrele
                    if (data.taseronId) {
                        const taseronBirimFiyatlari = birimFiyatlarData.filter(bf => bf.taseronId === data.taseronId);
                        setFiltrelenmisBirimFiyatlar(taseronBirimFiyatlari);
                    }
                }
            }
        } catch (error) {
            console.error('Veri yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.hakedisNo || !formData.donem || !formData.taseronId || !formData.santiyeId) {
            alert('Lütfen zorunlu alanları doldurun');
            return;
        }

        try {
            const toplamTutar = metrajlar.reduce((total, metraj) => total + (metraj.tutar || 0), 0);
            const currentUser = auth.currentUser;
            
            let yeniDurum = formData.durum;
            let onaylayanId = formData.onaylayanId;
            let onaylayanAdi = formData.onaylayanAdi;
            let onayTarihi = formData.onayTarihi;

            // Eğer onaya gönderiliyorsa
            if (formData.durum === 'onayda') {
                yeniDurum = 'onayda';
                onaylayanId = '';
                onaylayanAdi = '';
                onayTarihi = null;
            }
            // Eğer onaylanıyorsa
            else if (formData.durum === 'onaylandi') {
                yeniDurum = 'onaylandi';
                onaylayanId = currentUser.uid;
                onaylayanAdi = currentUser.displayName || currentUser.email;
                onayTarihi = new Date();
            }
            // Eğer reddediliyorsa
            else if (formData.durum === 'reddedildi' && !formData.redNedeni) {
                alert('Lütfen red nedenini belirtiniz');
                return;
            }

            await updateDoc(doc(db, 'hakedisler', id), {
                ...formData,
                toplamTutar,
                metrajlar,
                durum: yeniDurum,
                onaylayanId,
                onaylayanAdi,
                onayTarihi,
                guncellemeTarihi: new Date()
            });
            navigate('/hakedis');
        } catch (error) {
            console.error('Hakediş güncellenirken hata:', error);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'taseronId') {
            const taseron = taseronlar.find(t => t.id === value);
            setFormData(prev => ({
                ...prev,
                taseronId: value,
                taseronAdi: taseron ? taseron.firma : ''
            }));
            // Taşerona ait birim fiyatları filtrele
            const taseronBirimFiyatlari = birimFiyatlar.filter(bf => bf.taseronId === value);
            setFiltrelenmisBirimFiyatlar(taseronBirimFiyatlari);
        } else if (name === 'santiyeId') {
            const santiye = santiyeler.find(s => s.id === value);
            setFormData(prev => ({
                ...prev,
                santiyeId: value,
                santiyeAdi: santiye ? santiye.ad : ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleMetrajEkle = () => {
        if (!formData.taseronId) {
            alert('Lütfen önce taşeron seçiniz');
            setMetrajDialogOpen(false);
            return;
        }

        if (!yeniMetraj.birimFiyatId || !yeniMetraj.miktar) {
            alert('Lütfen birim fiyat ve miktar giriniz');
            return;
        }

        const birimFiyat = birimFiyatlar.find(bf => bf.id === yeniMetraj.birimFiyatId);
        if (!birimFiyat) return;

        const tutar = parseFloat(yeniMetraj.miktar) * parseFloat(birimFiyat.birimFiyat);
        
        const yeniMetrajKaydi = {
            ...yeniMetraj,
            pozNo: birimFiyat.pozNo,
            birim: birimFiyat.birim,
            birimFiyat: birimFiyat.birimFiyat,
            tutar
        };

        setMetrajlar([...metrajlar, yeniMetrajKaydi]);
        setMetrajDialogOpen(false);
        setYeniMetraj({
            pozNo: '',
            birimFiyatId: '',
            miktar: '',
            birim: '',
            tutar: 0
        });
    };

    const handleMetrajSil = (index) => {
        const yeniMetrajlar = metrajlar.filter((_, i) => i !== index);
        setMetrajlar(yeniMetrajlar);
    };

    if (loading) {
        return <Typography>Yükleniyor...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Hakediş Düzenle
                </Typography>

                <form onSubmit={handleSubmit}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Hakediş No"
                                name="hakedisNo"
                                value={formData.hakedisNo}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                                <DatePicker
                                    label="Dönem"
                                    value={formData.donem}
                                    onChange={(newValue) => {
                                        setFormData(prev => ({
                                            ...prev,
                                            donem: newValue
                                        }));
                                    }}
                                    renderInput={(params) => <TextField {...params} fullWidth required />}
                                />
                            </LocalizationProvider>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Taşeron</InputLabel>
                                <Select
                                    name="taseronId"
                                    value={formData.taseronId}
                                    onChange={handleChange}
                                    label="Taşeron"
                                >
                                    {taseronlar.map(taseron => (
                                        <MenuItem key={taseron.id} value={taseron.id}>
                                            {taseron.firma}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <FormControl fullWidth required>
                                <InputLabel>Şantiye</InputLabel>
                                <Select
                                    name="santiyeId"
                                    value={formData.santiyeId}
                                    onChange={handleChange}
                                    label="Şantiye"
                                >
                                    {santiyeler.map(santiye => (
                                        <MenuItem key={santiye.id} value={santiye.id}>
                                            {santiye.ad}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Açıklama"
                                name="aciklama"
                                multiline
                                rows={4}
                                value={formData.aciklama}
                                onChange={handleChange}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6">Metrajlar</Typography>
                                <Button
                                    variant="contained"
                                    startIcon={<AddIcon />}
                                    onClick={() => setMetrajDialogOpen(true)}
                                >
                                    Metraj Ekle
                                </Button>
                            </Box>

                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Poz No</TableCell>
                                            <TableCell>İş Kalemi</TableCell>
                                            <TableCell>Birim</TableCell>
                                            <TableCell>Miktar</TableCell>
                                            <TableCell>Birim Fiyat</TableCell>
                                            <TableCell>Tutar</TableCell>
                                            <TableCell>İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {metrajlar.map((metraj, index) => {
                                            const birimFiyat = birimFiyatlar.find(bf => bf.id === metraj.birimFiyatId);
                                            return (
                                                <TableRow key={index}>
                                                    <TableCell>{metraj.pozNo}</TableCell>
                                                    <TableCell>{birimFiyat?.isKalemi}</TableCell>
                                                    <TableCell>{metraj.birim}</TableCell>
                                                    <TableCell>{metraj.miktar}</TableCell>
                                                    <TableCell>{metraj.birimFiyat} TL</TableCell>
                                                    <TableCell>{metraj.tutar} TL</TableCell>
                                                    <TableCell>
                                                        <IconButton
                                                            size="small"
                                                            color="error"
                                                            onClick={() => handleMetrajSil(index)}
                                                        >
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        <TableRow>
                                            <TableCell colSpan={5} align="right">
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    Toplam Tutar:
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="subtitle1" fontWeight="bold">
                                                    {metrajlar.reduce((total, metraj) => total + (metraj.tutar || 0), 0)} TL
                                                </Typography>
                                            </TableCell>
                                            <TableCell />
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Grid>

                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Durum</InputLabel>
                                <Select
                                    name="durum"
                                    value={formData.durum}
                                    onChange={handleChange}
                                    label="Durum"
                                >
                                    <MenuItem value="taslak">Taslak</MenuItem>
                                    {formData.durum === 'taslak' && (
                                        <MenuItem value="onayda">Onaya Gönder</MenuItem>
                                    )}
                                    {formData.durum === 'onayda' && userRole === 'yonetici' && (
                                        <>
                                            <MenuItem value="onaylandi">Onayla</MenuItem>
                                            <MenuItem value="reddedildi">Reddet</MenuItem>
                                        </>
                                    )}
                                    {formData.durum === 'reddedildi' && (
                                        <MenuItem value="taslak">Taslağa Çevir</MenuItem>
                                    )}
                                </Select>
                            </FormControl>
                        </Grid>

                        {formData.durum === 'reddedildi' && (
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Red Nedeni"
                                    name="redNedeni"
                                    value={formData.redNedeni}
                                    onChange={handleChange}
                                    required
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                        )}

                        {formData.onaylayanAdi && formData.durum === 'onaylandi' && (
                            <Grid item xs={12}>
                                <Typography variant="body2" color="textSecondary">
                                    Onaylayan: {formData.onaylayanAdi}
                                    <br />
                                    Onay Tarihi: {formData.onayTarihi ? new Date(formData.onayTarihi.seconds * 1000).toLocaleString() : '-'}
                                </Typography>
                            </Grid>
                        )}

                        <Grid item xs={12}>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                <Button
                                    variant="outlined"
                                    onClick={() => navigate('/hakedis')}
                                >
                                    İptal
                                </Button>
                                <Button
                                    type="submit"
                                    variant="contained"
                                    color="primary"
                                >
                                    Kaydet
                                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </form>
            </Paper>

            {/* Metraj Ekleme Dialog */}
            <Dialog
                open={metrajDialogOpen}
                onClose={() => setMetrajDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Metraj Ekle</DialogTitle>
                <DialogContent>
                    <Grid container spacing={3} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth required>
                                <InputLabel>Birim Fiyat</InputLabel>
                                <Select
                                    value={yeniMetraj.birimFiyatId}
                                    onChange={(e) => setYeniMetraj({
                                        ...yeniMetraj,
                                        birimFiyatId: e.target.value
                                    })}
                                    label="Birim Fiyat"
                                >
                                    {filtrelenmisBirimFiyatlar.map(bf => (
                                        <MenuItem key={bf.id} value={bf.id}>
                                            {bf.pozNo} - {bf.isKalemi} ({bf.birimFiyat} TL/{bf.birim})
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Miktar"
                                type="number"
                                value={yeniMetraj.miktar}
                                onChange={(e) => setYeniMetraj({
                                    ...yeniMetraj,
                                    miktar: e.target.value
                                })}
                                required
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setMetrajDialogOpen(false)}>İptal</Button>
                    <Button onClick={handleMetrajEkle} variant="contained" color="primary">
                        Ekle
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default HakedisForm;
