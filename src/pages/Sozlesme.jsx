import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Grid, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Typography, Divider, Switch, FormControlLabel,
    Box, InputAdornment
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { tr } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import sozlesmeService from '../services/sozlesmeService';
import SozlesmeSantiyeSecici from '../components/SozlesmeSantiyeSecici';
import TaseronSecici from '../components/TaseronSecici';
import { formatDate } from '../utils/dateUtils';

const sozlesmeTurleri = [
    { id: 'goturu', label: 'Götüre Bedel (Anahtar Teslim)' },
    { id: 'birimFiyat', label: 'Birim Fiyat' },
    { id: 'maliyetKar', label: 'Maliyet + Kâr' },
    { id: 'karma', label: 'Karma Sistem' },
    { id: 'tavanFiyat', label: 'Tavan Fiyatlı' }
];

const malzemeTeminiSecenekleri = [
    { value: 'taseron', label: 'Taşeron Temin' },
    { value: 'isveren', label: 'İşveren Temin' },
    { value: 'karma', label: 'Karma (Listede Belirtilecek)' }
];

const hakedisDuzenlemePeriyotlari = [
    { value: 'haftalik', label: 'Haftalık' },
    { value: '15_gunluk', label: '15 Günlük' },
    { value: 'aylik', label: 'Aylık' },
    { value: 'iki_aylik', label: 'İki Aylık' },
    { value: 'uc_aylik', label: 'Üç Aylık' },
    { value: 'is_bitiminde', label: 'İş Bitiminde' },
    { value: 'ozel', label: 'Özel Periyot' }
];

const odemeTipleri = [
    { value: 'götüre_bedel', label: 'Götüre Bedel (Anahtar Teslim)' },
    { value: 'birim_fiyat', label: 'Birim Fiyat' },
    { value: 'maliyet_arti_kar', label: 'Maliyet + Kâr' },
    { value: 'karma', label: 'Karma Sistem' }
];

const paraBirimleri = [
    { value: 'TRY', label: 'Türk Lirası (₺)' },
    { value: 'USD', label: 'Amerikan Doları ($)' },
    { value: 'EUR', label: 'Euro (€)' }
];

const initialFormData = {
    sozlesmeNo: '',
    isinAdi: '',
    santiye: {
        id: '',
        ad: '',
        kod: ''
    },
    taseronId: '',
    taseronAdi: '',
    sozlesmeTarihi: null,
    isBitisTarihi: null,
    odemeTipi: '',
    sozlesmeBedeli: '',
    birimFiyat: '',
    hakedisDuzenlemePeriyodu: '',
    ozelHakedisPeriyodu: '',
    teminatOrani: '',
    teminatTutari: '',
    stopajKesintisi: '',
    sigortaKesintisi: '',
    digerKesintiler: '',
    vergiNo: '',
    yetkili: '',
    adres: '',
    telefon: '',
    eposta: '',
    sigortaYukumlulukleri: '',
    ozelSartlar: '',
    paraBirimi: '',
    kdvDahil: false,
    avansTutari: '',
    malzemeTemini: '',
    malzemeListesi: '',
    teknikSartname: '',
    gecikmeCezasiOrani: '',
    cezaiSartlar: '',
    isgYukumlulukleri: '',
    karOrani: '',
    aktif: true,
    durum: ''
};

const Sozlesme = () => {
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(false);
    const [sozlesmeler, setSozlesmeler] = useState([]);
    const [modalOpen, setModalOpen] = useState(false);
    const [formData, setFormData] = useState(initialFormData);
    const [selectedSozlesme, setSelectedSozlesme] = useState(null);
    const [selectedSantiye, setSelectedSantiye] = useState(null);
    const [selectedTaseron, setSelectedTaseron] = useState(null);

    // Tarih değişikliği işleyicisi
    const handleDateChange = (date, field) => {
        if (!date) {
            setFormData(prev => ({
                ...prev,
                [field]: null
            }));
            return;
        }

        // Tarihi UTC'ye çevir (saat farkı sorunlarını önlemek için)
        const utcDate = new Date(Date.UTC(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            0, 0, 0, 0
        ));

        setFormData(prev => ({
            ...prev,
            [field]: utcDate
        }));
    };

    // Sayısal input değişikliği
    const handleNumberChange = (e) => {
        const { name, value } = e.target;
        // Boş değer veya negatif sayıları engelle
        const numberValue = value === '' ? '' : Math.max(0, parseFloat(value));
        setFormData(prev => ({
            ...prev,
            [name]: numberValue
        }));
    };

    // Yüzde input değişikliği
    const handlePercentageChange = (e) => {
        const { name, value } = e.target;
        // Boş değer veya 0-100 aralığı dışındaki değerleri engelle
        const percentValue = value === '' ? '' : Math.min(100, Math.max(0, parseFloat(value)));
        setFormData(prev => ({
            ...prev,
            [name]: percentValue
        }));
    };

    // Tarih formatlama fonksiyonu
    const formatTableDate = (date) => {
        if (!date) return '-';
        try {
            if (date instanceof Date) {
                return formatDate(date);
            }
            if (date.seconds) {
                return formatDate(new Date(date.seconds * 1000));
            }
            return '-';
        } catch (error) {
            console.error('Tarih formatlanırken hata:', error);
            return '-';
        }
    };

    // Form gönderme
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Şantiye ve taşeron bilgilerini kontrol et
            if (!selectedSantiye?.id || !selectedTaseron?.id) {
                enqueueSnackbar('Lütfen şantiye ve taşeron seçiniz', { variant: 'error' });
                setLoading(false);
                return;
            }

            // Şantiye ve taşeron bilgilerini ekle
            const sozlesmeData = {
                ...formData,
                santiye: {
                    id: selectedSantiye.id,
                    ad: selectedSantiye.santiyeAdi || '',
                    kod: selectedSantiye.kod || ''
                },
                taseronId: selectedTaseron.id,
                taseronAdi: selectedTaseron.unvan || ''
            };

            // Tarihleri UTC'ye çevir
            if (sozlesmeData.sozlesmeTarihi) {
                sozlesmeData.sozlesmeTarihi = new Date(Date.UTC(
                    sozlesmeData.sozlesmeTarihi.getFullYear(),
                    sozlesmeData.sozlesmeTarihi.getMonth(),
                    sozlesmeData.sozlesmeTarihi.getDate(),
                    0, 0, 0, 0
                ));
            }

            if (sozlesmeData.isBitisTarihi) {
                sozlesmeData.isBitisTarihi = new Date(Date.UTC(
                    sozlesmeData.isBitisTarihi.getFullYear(),
                    sozlesmeData.isBitisTarihi.getMonth(),
                    sozlesmeData.isBitisTarihi.getDate(),
                    0, 0, 0, 0
                ));
            }

            if (selectedSozlesme) {
                // Mevcut sözleşmeyi güncelle
                await sozlesmeService.updateSozlesme(selectedSozlesme.id, sozlesmeData);
                enqueueSnackbar('Sözleşme başarıyla güncellendi', { variant: 'success' });
            } else {
                // Yeni sözleşme oluştur
                await sozlesmeService.createSozlesme(sozlesmeData);
                enqueueSnackbar('Sözleşme başarıyla oluşturuldu', { variant: 'success' });
            }

            // Formu sıfırla ve modalı kapat
            setFormData(initialFormData);
            setSelectedSantiye(null);
            setSelectedTaseron(null);
            setModalOpen(false);
            loadSozlesmeler(); // Listeyi yenile
        } catch (error) {
            console.error('Sözleşme kaydedilirken hata:', error);
            enqueueSnackbar('Sözleşme kaydedilirken bir hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Form sıfırlama
    const resetForm = () => {
        setFormData(initialFormData);
        setSelectedSantiye(null);
        setSelectedTaseron(null);
        setSelectedSozlesme(null);
    };

    // Düzenleme işlemi
    const handleEdit = (sozlesme) => {
        setSelectedSozlesme(sozlesme);
        setFormData({
            sozlesmeNo: sozlesme.sozlesmeNo || '',
            isinAdi: sozlesme.isinAdi || '',
            santiye: {
                id: sozlesme.santiyeId,
                ad: sozlesme.santiyeAdi || '',
                kod: sozlesme.santiyeKod || ''
            },
            taseronId: sozlesme.taseronId || '',
            taseronAdi: sozlesme.taseronAdi || '',
            sozlesmeTarihi: sozlesme.sozlesmeTarihi ? new Date(sozlesme.sozlesmeTarihi.seconds * 1000) : null,
            isBitisTarihi: sozlesme.isBitisTarihi ? new Date(sozlesme.isBitisTarihi.seconds * 1000) : null,
            odemeTipi: sozlesme.odemeTipi || '',
            sozlesmeBedeli: sozlesme.sozlesmeBedeli || '',
            birimFiyat: sozlesme.birimFiyat || '',
            hakedisDuzenlemePeriyodu: sozlesme.hakedisDuzenlemePeriyodu || '',
            ozelHakedisPeriyodu: sozlesme.ozelHakedisPeriyodu || '',
            teminatOrani: sozlesme.teminatOrani || '',
            teminatTutari: sozlesme.teminatTutari || '',
            stopajKesintisi: sozlesme.stopajKesintisi || '',
            sigortaKesintisi: sozlesme.sigortaKesintisi || '',
            digerKesintiler: sozlesme.digerKesintiler || '',
            vergiNo: sozlesme.vergiNo || '',
            yetkili: sozlesme.yetkili || '',
            adres: sozlesme.adres || '',
            telefon: sozlesme.telefon || '',
            eposta: sozlesme.eposta || '',
            sigortaYukumlulukleri: sozlesme.sigortaYukumlulukleri || '',
            ozelSartlar: sozlesme.ozelSartlar || '',
            paraBirimi: sozlesme.paraBirimi || '',
            kdvDahil: sozlesme.kdvDahil || false,
            avansTutari: sozlesme.avansTutari || '',
            malzemeTemini: sozlesme.malzemeTemini || '',
            malzemeListesi: sozlesme.malzemeListesi || '',
            teknikSartname: sozlesme.teknikSartname || '',
            gecikmeCezasiOrani: sozlesme.gecikmeCezasiOrani || '',
            cezaiSartlar: sozlesme.cezaiSartlar || '',
            isgYukumlulukleri: sozlesme.isgYukumlulukleri || '',
            karOrani: sozlesme.karOrani || '',
            aktif: sozlesme.aktif || true,
            durum: sozlesme.durum || ''
        });
        if (sozlesme.santiyeId) {
            setSelectedSantiye({
                id: sozlesme.santiyeId,
                santiyeAdi: sozlesme.santiyeAdi,
                kod: sozlesme.santiyeKod
            });
        }
        if (sozlesme.taseronId) {
            setSelectedTaseron({
                id: sozlesme.taseronId,
                unvan: sozlesme.taseronAdi
            });
        }
        setModalOpen(true);
    };

    // Silme işlemi
    const handleDelete = async (id) => {
        if (window.confirm('Bu sözleşmeyi silmek istediğinizden emin misiniz?')) {
            setLoading(true);
            try {
                await sozlesmeService.deleteSozlesme(id);
                enqueueSnackbar('Sözleşme başarıyla silindi', { variant: 'success' });
                await fetchSozlesmeler();
            } catch (error) {
                console.error('Sözleşme silinirken hata:', error);
                enqueueSnackbar('Sözleşme silinirken bir hata oluştu', { variant: 'error' });
            } finally {
                setLoading(false);
            }
        }
    };

    // Yeni sözleşme ekleme işlemi
    const handleAddNew = () => {
        setSelectedSozlesme(null);
        setSelectedSantiye(null);
        setSelectedTaseron(null);
        setFormData(initialFormData);
        setModalOpen(true);
    };

    // Modal kapatma işlemi
    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedSozlesme(null);
        setSelectedSantiye(null);
        setSelectedTaseron(null);
        setFormData(initialFormData);
    };

    // Sözleşmeleri yükle
    const fetchSozlesmeler = async () => {
        try {
            setLoading(true);
            // Sözleşmeleri getir
            const data = await sozlesmeService.getSozlesmeler();
            
            // Şantiye ve taşeron bilgilerini düzenle
            const formattedData = data.map(sozlesme => ({
                ...sozlesme,
                santiyeAdi: sozlesme.santiyeAdi || 'Bilinmiyor',
                taseronAdi: sozlesme.taseronAdi || 'Bilinmiyor',
                // Tarihleri doğru formatta göster
                sozlesmeTarihi: sozlesme.sozlesmeTarihi?.toDate?.() || null,
                isBitisTarihi: sozlesme.isBitisTarihi?.toDate?.() || null,
                // Sayısal değerleri formatla
                sozlesmeBedeli: parseFloat(sozlesme.sozlesmeBedeli) || 0,
                birimFiyat: parseFloat(sozlesme.birimFiyat) || 0,
                teminatOrani: parseFloat(sozlesme.teminatOrani) || 0,
                stopajKesintisi: parseFloat(sozlesme.stopajKesintisi) || 0,
                sigortaKesintisi: parseFloat(sozlesme.sigortaKesintisi) || 0,
                karOrani: parseFloat(sozlesme.karOrani) || 0,
                gecikmeCezasiOrani: parseFloat(sozlesme.gecikmeCezasiOrani) || 0
            }));
            
            setSozlesmeler(formattedData);
        } catch (error) {
            console.error('Sözleşmeler yüklenirken hata:', error);
            enqueueSnackbar('Sözleşmeler yüklenirken bir hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSozlesmeler();
    }, []);

    // Input değişiklik handler'ı
    const handleInputChange = (field, value) => {
        // Sayısal alanlar için kontrol
        if (['sozlesmeBedeli', 'birimFiyat', 'teminatOrani', 'teminatTutari', 'stopajKesintisi', 'sigortaKesintisi', 'digerKesintiler', 'avansTutari', 'gecikmeCezasiOrani', 'karOrani'].includes(field)) {
            // Sadece sayı ve nokta karakterine izin ver
            if (value && !/^\d*\.?\d*$/.test(value)) {
                return;
            }
        }

        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Teminat tutarını otomatik hesapla
        if (field === 'sozlesmeBedeli' || field === 'teminatOrani') {
            const bedel = parseFloat(field === 'sozlesmeBedeli' ? value : formData.sozlesmeBedeli) || 0;
            const oran = parseFloat(field === 'teminatOrani' ? value : formData.teminatOrani) || 0;
            const teminatTutari = (bedel * oran / 100).toFixed(2);
            
            setFormData(prev => ({
                ...prev,
                teminatTutari: teminatTutari
            }));
        }
    };

    // Sözleşme durumunu değiştir
    const handleToggleAktif = async (id, event) => {
        event.stopPropagation(); // Tıklamanın yayılmasını engelle
        try {
            setLoading(true);
            const yeniDurum = await sozlesmeService.toggleSozlesmeAktif(id);
            setSozlesmeler(prev => prev.map(sozlesme => 
                sozlesme.id === id ? { ...sozlesme, aktif: yeniDurum } : sozlesme
            ));
            enqueueSnackbar(`Sözleşme ${yeniDurum ? 'aktif' : 'pasif'} duruma getirildi`, { variant: 'success' });
        } catch (error) {
            console.error('Sözleşme durumu değiştirilirken hata:', error);
            enqueueSnackbar('Sözleşme durumu değiştirilemedi', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <Typography>Yükleniyor...</Typography>;
    }

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5">Sözleşmeler</Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddNew}
                    disabled={loading}
                >
                    Yeni Sözleşme
                </Button>
            </Box>

            <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Sözleşme No</TableCell>
                            <TableCell>İşin Adı</TableCell>
                            <TableCell>Şantiye</TableCell>
                            <TableCell>Taşeron</TableCell>
                            <TableCell>Sözleşme Tarihi</TableCell>
                            <TableCell>İş Bitiş Tarihi</TableCell>
                            <TableCell>Ödeme Tipi</TableCell>
                            <TableCell>Sözleşme Bedeli</TableCell>
                            <TableCell>Teminat</TableCell>
                            <TableCell>Stopaj</TableCell>
                            <TableCell>Sigorta</TableCell>
                            <TableCell>Diğer Kesintiler</TableCell>
                            <TableCell>Durum</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sozlesmeler.map((sozlesme) => (
                            <TableRow 
                                key={sozlesme.id}
                                sx={{
                                    cursor: 'pointer',
                                    opacity: sozlesme.aktif ? 1 : 0.6,
                                    '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' }
                                }}
                            >
                                <TableCell>{sozlesme.sozlesmeNo}</TableCell>
                                <TableCell>{sozlesme.isinAdi}</TableCell>
                                <TableCell>{sozlesme.santiyeAdi}</TableCell>
                                <TableCell>{sozlesme.taseronAdi}</TableCell>
                                <TableCell>{formatTableDate(sozlesme.sozlesmeTarihi)}</TableCell>
                                <TableCell>{formatTableDate(sozlesme.isBitisTarihi)}</TableCell>
                                <TableCell>
                                    {sozlesme.odemeTipi === 'götüre_bedel' ? 'Götüre Bedel' :
                                     sozlesme.odemeTipi === 'birim_fiyat' ? 'Birim Fiyat' :
                                     sozlesme.odemeTipi === 'karma' ? 'Karma Sistem' : '-'}
                                </TableCell>
                                <TableCell>
                                    {new Intl.NumberFormat('tr-TR', {
                                        style: 'currency',
                                        currency: sozlesme.paraBirimi || 'TRY'
                                    }).format(sozlesme.sozlesmeBedeli || 0)}
                                    {sozlesme.kdvDahil ? ' (KDV Dahil)' : ' (KDV Hariç)'}
                                </TableCell>
                                <TableCell>
                                    {sozlesme.teminatOrani ? `%${sozlesme.teminatOrani}` : '-'}
                                    {sozlesme.teminatTutari ? (
                                        <Typography variant="body2" color="textSecondary">
                                            {new Intl.NumberFormat('tr-TR', {
                                                style: 'currency',
                                                currency: sozlesme.paraBirimi || 'TRY'
                                            }).format(sozlesme.teminatTutari)}
                                        </Typography>
                                    ) : null}
                                </TableCell>
                                <TableCell>{sozlesme.stopajKesintisi ? `%${sozlesme.stopajKesintisi}` : '-'}</TableCell>
                                <TableCell>{sozlesme.sigortaKesintisi ? `%${sozlesme.sigortaKesintisi}` : '-'}</TableCell>
                                <TableCell>
                                    {sozlesme.digerKesintiler ? new Intl.NumberFormat('tr-TR', {
                                        style: 'currency',
                                        currency: sozlesme.paraBirimi || 'TRY'
                                    }).format(sozlesme.digerKesintiler) : '-'}
                                </TableCell>
                                <TableCell>
                                    <Switch
                                        checked={sozlesme.aktif}
                                        onChange={(e) => handleToggleAktif(sozlesme.id, e)}
                                        color="primary"
                                        size="small"
                                    />
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleEdit(sozlesme)}
                                        disabled={loading}
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        onClick={() => handleDelete(sozlesme.id)}
                                        disabled={loading}
                                        size="small"
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
                open={modalOpen} 
                onClose={handleCloseModal}
                maxWidth="md"
                fullWidth
            >
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedSozlesme ? 'Sözleşme Düzenle' : 'Yeni Sözleşme'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="subtitle1" gutterBottom>
                                    Temel Bilgiler
                                </Typography>
                            </Grid>
                            
                            {/* Temel bilgiler */}
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Sözleşme No"
                                    value={formData.sozlesmeNo}
                                    onChange={(e) => handleInputChange('sozlesmeNo', e.target.value)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="İşin Adı"
                                    value={formData.isinAdi}
                                    onChange={(e) => handleInputChange('isinAdi', e.target.value)}
                                />
                            </Grid>

                            {/* Şantiye ve Taşeron seçimi */}
                            <Grid item xs={12} md={6}>
                                <SozlesmeSantiyeSecici
                                    value={selectedSantiye}
                                    onChange={setSelectedSantiye}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TaseronSecici
                                    value={selectedTaseron}
                                    onChange={setSelectedTaseron}
                                />
                            </Grid>

                            {/* Tarihler */}
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} locale={tr}>
                                    <DatePicker
                                        label="Sözleşme Tarihi"
                                        value={formData.sozlesmeTarihi}
                                        onChange={(date) => handleDateChange(date, 'sozlesmeTarihi')}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                variant="outlined"
                                                error={false}
                                                helperText={null}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <LocalizationProvider dateAdapter={AdapterDateFns} locale={tr}>
                                    <DatePicker
                                        label="İş Bitiş Tarihi"
                                        value={formData.isBitisTarihi}
                                        onChange={(date) => handleDateChange(date, 'isBitisTarihi')}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                fullWidth
                                                variant="outlined"
                                                error={false}
                                                helperText={null}
                                            />
                                        )}
                                    />
                                </LocalizationProvider>
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Ödeme Bilgileri</Typography>
                            </Grid>

                            {/* Ödeme bilgileri */}
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Ödeme Tipi</InputLabel>
                                    <Select
                                        value={formData.odemeTipi}
                                        onChange={(e) => handleInputChange('odemeTipi', e.target.value)}
                                        label="Ödeme Tipi"
                                    >
                                        {odemeTipleri.map(tip => (
                                            <MenuItem key={tip.value} value={tip.value}>
                                                {tip.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Para Birimi</InputLabel>
                                    <Select
                                        value={formData.paraBirimi}
                                        onChange={(e) => handleInputChange('paraBirimi', e.target.value)}
                                        label="Para Birimi"
                                    >
                                        {paraBirimleri.map(birim => (
                                            <MenuItem key={birim.value} value={birim.value}>
                                                {birim.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    required
                                    label="Sözleşme Bedeli"
                                    name="sozlesmeBedeli"
                                    value={formData.sozlesmeBedeli}
                                    onChange={handleNumberChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {paraBirimleri.find(birim => birim.value === formData.paraBirimi)?.label || '₺'}
                                            </InputAdornment>
                                        ),
                                        inputProps: { min: 0 }
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={formData.kdvDahil}
                                            onChange={(e) => handleInputChange('kdvDahil', e.target.checked)}
                                        />
                                    }
                                    label="KDV Dahil"
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Birim Fiyat"
                                    value={formData.birimFiyat}
                                    onChange={handleNumberChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">
                                            {formData.paraBirimi === 'TRY' ? '₺' : 
                                             formData.paraBirimi === 'USD' ? '$' : 
                                             formData.paraBirimi === 'EUR' ? '€' : ''}
                                        </InputAdornment>,
                                    }}
                                    disabled={!['birim_fiyat', 'karma'].includes(formData.odemeTipi)}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Kâr Oranı"
                                    value={formData.karOrani}
                                    onChange={handlePercentageChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                    disabled={formData.odemeTipi !== 'maliyet_arti_kar'}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Avans Tutarı"
                                    value={formData.avansTutari}
                                    onChange={handleNumberChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">
                                            {formData.paraBirimi === 'TRY' ? '₺' : 
                                             formData.paraBirimi === 'USD' ? '$' : 
                                             formData.paraBirimi === 'EUR' ? '€' : ''}
                                        </InputAdornment>,
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Malzeme ve Teknik Detaylar</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Malzeme Temini</InputLabel>
                                    <Select
                                        value={formData.malzemeTemini}
                                        onChange={(e) => handleInputChange('malzemeTemini', e.target.value)}
                                        label="Malzeme Temini"
                                    >
                                        {malzemeTeminiSecenekleri.map(secenek => (
                                            <MenuItem key={secenek.value} value={secenek.value}>
                                                {secenek.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Malzeme Listesi"
                                    value={formData.malzemeListesi}
                                    onChange={(e) => handleInputChange('malzemeListesi', e.target.value)}
                                    multiline
                                    rows={4}
                                    placeholder="Karma seçeneği için hangi malzemelerin kim tarafından temin edileceğini belirtin"
                                    disabled={formData.malzemeTemini !== 'karma'}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Teknik Şartname"
                                    value={formData.teknikSartname}
                                    onChange={(e) => handleInputChange('teknikSartname', e.target.value)}
                                    multiline
                                    rows={4}
                                    placeholder="İşin teknik detayları ve standartlarını belirtin"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Cezai Şartlar ve Teminatlar</Typography>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Gecikme Cezası (Günlük)"
                                    value={formData.gecikmeCezasiOrani}
                                    onChange={handlePercentageChange}
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Cezai Şartlar"
                                    value={formData.cezaiSartlar}
                                    onChange={(e) => handleInputChange('cezaiSartlar', e.target.value)}
                                    multiline
                                    rows={4}
                                    placeholder="Gecikme ve hatalı iş durumunda uygulanacak cezaları belirtin"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Typography variant="subtitle1" sx={{ mb: 2 }}>Teminat ve Kesintiler</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teminat Oranı"
                                    name="teminatOrani"
                                    value={formData.teminatOrani}
                                    onChange={handlePercentageChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        inputProps: { min: 0, max: 100 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Teminat Tutarı"
                                    name="teminatTutari"
                                    value={formData.teminatTutari}
                                    onChange={handleNumberChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {paraBirimleri.find(birim => birim.value === formData.paraBirimi)?.label || '₺'}
                                            </InputAdornment>
                                        ),
                                        inputProps: { min: 0 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Stopaj Kesintisi"
                                    name="stopajKesintisi"
                                    value={formData.stopajKesintisi}
                                    onChange={handlePercentageChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        inputProps: { min: 0, max: 100 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Sigorta Kesintisi"
                                    name="sigortaKesintisi"
                                    value={formData.sigortaKesintisi}
                                    onChange={handlePercentageChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: <InputAdornment position="end">%</InputAdornment>,
                                        inputProps: { min: 0, max: 100 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Diğer Kesintiler"
                                    name="digerKesintiler"
                                    value={formData.digerKesintiler}
                                    onChange={handleNumberChange}
                                    type="number"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                {paraBirimleri.find(birim => birim.value === formData.paraBirimi)?.label || '₺'}
                                            </InputAdornment>
                                        ),
                                        inputProps: { min: 0 }
                                    }}
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>Hakediş Bilgileri</Typography>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <FormControl fullWidth>
                                    <InputLabel>Hakediş Düzenleme Periyodu</InputLabel>
                                    <Select
                                        name="hakedisDuzenlemePeriyodu"
                                        value={formData.hakedisDuzenlemePeriyodu}
                                        onChange={handleInputChange}
                                        label="Hakediş Düzenleme Periyodu"
                                    >
                                        {hakedisDuzenlemePeriyotlari.map(periyot => (
                                            <MenuItem key={periyot.value} value={periyot.value}>
                                                {periyot.label}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Özel Hakediş Periyodu"
                                    name="ozelHakedisPeriyodu"
                                    value={formData.ozelHakedisPeriyodu}
                                    onChange={handleInputChange}
                                    placeholder="Özel hakediş periyodu varsa belirtiniz"
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6" sx={{ mt: 2, mb: 2 }}>İş Sağlığı ve Güvenliği</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="İSG Yükümlülükleri"
                                    value={formData.isgYukumlulukleri}
                                    onChange={(e) => handleInputChange('isgYukumlulukleri', e.target.value)}
                                    multiline
                                    rows={4}
                                    placeholder="İş sağlığı ve güvenliği önlemleri ve sorumlulukları belirtin"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>İptal</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedSozlesme ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default Sozlesme;
