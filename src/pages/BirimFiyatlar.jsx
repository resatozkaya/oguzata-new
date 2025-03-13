import React, { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    TextField, Grid, FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, IconButton, Typography, Box, Autocomplete, CircularProgress, Alert, InputAdornment, Tooltip, Chip
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { tr } from 'date-fns/locale';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import birimFiyatService from '../services/birimFiyatService';
import sozlesmeService from '../services/sozlesmeService';
import { formatDate } from '../utils/dateUtils';
import { Timestamp } from 'firebase/firestore';
import * as XLSX from 'xlsx';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useTheme } from '../contexts/ThemeContext';
import { Add as AddIcon, Upload as UploadIcon, Download as DownloadIcon, FilterList as FilterListIcon } from '@mui/icons-material';
import { alpha } from '@mui/material/styles';

const initialFormData = {
    pozNo: '',
    tanim: '',
    birim: '',
    birimFiyat: '',
    aciklama: ''
};

const BirimFiyatlar = () => {
    const { isDarkMode, sidebarColor } = useTheme();
    const { enqueueSnackbar } = useSnackbar();
    const [loading, setLoading] = useState(true);
    const [birimFiyatlar, setBirimFiyatlar] = useState([]);
    const [filteredBirimFiyatlar, setFilteredBirimFiyatlar] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedBirimFiyat, setSelectedBirimFiyat] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterPozNo, setFilterPozNo] = useState('');
    const [filterBirim, setFilterBirim] = useState('');

    const [formData, setFormData] = useState({ ...initialFormData });
    const [sozlesmeler, setSozlesmeler] = useState([]);
    const [selectedSozlesme, setSelectedSozlesme] = useState(null);

    // Sözleşmeleri yükle
    const fetchSozlesmeler = async () => {
        try {
            const data = await sozlesmeService.getSozlesmeler();
            setSozlesmeler(data);
        } catch (error) {
            console.error('Sözleşmeler yüklenirken hata:', error);
            enqueueSnackbar('Sözleşmeler yüklenirken bir hata oluştu', { variant: 'error' });
        }
    };

    // Birim fiyatları yükle
    const fetchBirimFiyatlar = async () => {
        try {
            setLoading(true);
            const birimFiyatRef = collection(db, 'birimFiyatlar');
            const birimFiyatSnapshot = await getDocs(query(birimFiyatRef, orderBy('pozNo')));
            const birimFiyatData = birimFiyatSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBirimFiyatlar(birimFiyatData);
            setFilteredBirimFiyatlar(birimFiyatData);
        } catch (error) {
            console.error('Birim fiyatlar yüklenirken hata:', error);
            enqueueSnackbar('Birim fiyatlar yüklenirken bir hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSozlesmeler();
        fetchBirimFiyatlar();
    }, []);

    useEffect(() => {
        filterData();
    }, [birimFiyatlar, searchTerm, filterPozNo, filterBirim]);

    const filterData = () => {
        let filtered = [...birimFiyatlar];

        // Arama filtresi
        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.tanim.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.pozNo.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Poz no filtresi
        if (filterPozNo) {
            filtered = filtered.filter(item => item.pozNo.startsWith(filterPozNo));
        }

        // Birim filtresi
        if (filterBirim) {
            filtered = filtered.filter(item => item.birim === filterBirim);
        }

        setFilteredBirimFiyatlar(filtered);
    };

    // Form gönderme
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSozlesme) {
            enqueueSnackbar('Lütfen bir sözleşme seçin', { variant: 'warning' });
            return;
        }

        setLoading(true);

        try {
            const birimFiyatData = {
                ...formData,
                birimFiyat: parseFloat(formData.birimFiyat) || 0,
                guncellemeTarihi: new Date()
            };

            if (selectedBirimFiyat) {
                await updateDoc(doc(db, 'birimFiyatlar', selectedBirimFiyat.id), birimFiyatData);
                enqueueSnackbar('Birim fiyat başarıyla güncellendi', { variant: 'success' });
            } else {
                const newDoc = doc(collection(db, 'birimFiyatlar'));
                await setDoc(newDoc, {
                    ...birimFiyatData,
                    olusturmaTarihi: new Date()
                });
                enqueueSnackbar('Birim fiyat başarıyla oluşturuldu', { variant: 'success' });
            }

            setOpenDialog(false);
            setFormData({ ...initialFormData });
            setSelectedBirimFiyat(null);
            setSelectedSozlesme(null);
            await fetchBirimFiyatlar();
        } catch (error) {
            console.error('Birim fiyat kaydedilirken hata:', error);
            enqueueSnackbar('Birim fiyat kaydedilirken bir hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    // Düzenleme işlemi
    const handleEdit = (birimFiyat) => {
        const sozlesme = sozlesmeler.find(s => s.id === birimFiyat.sozlesmeId);
        setSelectedSozlesme(sozlesme || null);
        setSelectedBirimFiyat(birimFiyat);
        setFormData({
            ...initialFormData,
            ...birimFiyat,
            birimFiyat: birimFiyat.birimFiyat?.toString() || '',
            gecerlilikBaslangic: birimFiyat.gecerlilikBaslangic?.toDate() || null,
            gecerlilikBitis: birimFiyat.gecerlilikBitis?.toDate() || null
        });
        setOpenDialog(true);
    };

    // Silme işlemi
    const handleDelete = async (id) => {
        if (window.confirm('Bu birim fiyatı silmek istediğinizden emin misiniz?')) {
        try {
                await deleteDoc(doc(db, 'birimFiyatlar', id));
            enqueueSnackbar('Birim fiyat başarıyla silindi', { variant: 'success' });
            await fetchBirimFiyatlar();
        } catch (error) {
            console.error('Birim fiyat silinirken hata:', error);
            enqueueSnackbar('Birim fiyat silinirken bir hata oluştu', { variant: 'error' });
            }
        }
    };

    // Input değişiklik handler'ı
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value === undefined ? '' : value
        }));
    };

    // Modal kapatma
    const handleDialogClose = () => {
        setOpenDialog(false);
        setSelectedBirimFiyat(null);
        setSelectedSozlesme(null);
        setFormData({ ...initialFormData });
    };

    // Sözleşme seçildiğinde
    const handleSozlesmeChange = (event, sozlesme) => {
        setSelectedSozlesme(sozlesme);
        if (sozlesme) {
            setFormData(prev => ({
                ...prev,
                yapiFirma: sozlesme.taseronAdi || '',
                sozlesmeId: sozlesme.id || '',
                sozlesmeNo: sozlesme.sozlesmeNo || ''
            }));
        } else {
            setFormData({ ...initialFormData });
        }
    };

    const handleExcelImport = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const workbook = XLSX.read(event.target.result, { type: 'binary' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(firstSheet);

                // Excel verilerini işle ve kaydet
                for (const row of data) {
                    const birimFiyat = {
                        pozNo: row['Poz No'] || row['POZ NO'] || '',
                        tanim: row['Tanım'] || row['TANIM'] || '',
                        birim: row['Birim'] || row['BİRİM'] || '',
                        birimFiyat: parseFloat(row['Birim Fiyat'] || row['BİRİM FİYAT'] || 0),
                        aciklama: row['Açıklama'] || row['AÇIKLAMA'] || ''
                    };

                    const newDoc = doc(collection(db, 'birimFiyatlar'));
                    await setDoc(newDoc, {
                        ...birimFiyat,
                        olusturmaTarihi: new Date(),
                        guncellemeTarihi: new Date()
                    });
                }

                enqueueSnackbar('Excel dosyası başarıyla içe aktarıldı', { variant: 'success' });
                fetchBirimFiyatlar();
            } catch (error) {
                console.error('Excel içe aktarılırken hata:', error);
                enqueueSnackbar('Excel içe aktarılırken bir hata oluştu', { variant: 'error' });
            }
        };

        reader.readAsBinaryString(file);
    };

    const handleExcelExport = () => {
        const ws = XLSX.utils.json_to_sheet(birimFiyatlar.map(item => ({
            'Poz No': item.pozNo,
            'Tanım': item.tanim,
            'Birim': item.birim,
            'Birim Fiyat': item.birimFiyat,
            'Açıklama': item.aciklama || ''
        })));

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Birim Fiyatlar');
        XLSX.writeFile(wb, 'birim_fiyatlar.xlsx');
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
            {/* Başlık ve Butonlar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    Birim Fiyat Listesi
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        variant="outlined"
                        startIcon={<UploadIcon />}
                        component="label"
                    >
                        Excel İçe Aktar
                        <input
                            type="file"
                            hidden
                            accept=".xlsx,.xls"
                            onChange={handleExcelImport}
                        />
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleExcelExport}
                    >
                        Excel Dışa Aktar
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenDialog(true)}
                        sx={{
                            bgcolor: sidebarColor,
                            '&:hover': {
                                bgcolor: alpha(sidebarColor, 0.9)
                            }
                        }}
                    >
                    Yeni Birim Fiyat
                </Button>
                </Box>
            </Box>

            {/* Filtreler */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Ara"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <TextField
                        fullWidth
                        label="Poz No Filtrele"
                        value={filterPozNo}
                        onChange={(e) => setFilterPozNo(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <FilterListIcon />
                                </InputAdornment>
                            )
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <FormControl fullWidth>
                        <InputLabel>Birim Filtrele</InputLabel>
                        <Select
                            value={filterBirim}
                            onChange={(e) => setFilterBirim(e.target.value)}
                            label="Birim Filtrele"
                        >
                            <MenuItem value="">Tümü</MenuItem>
                            {Array.from(new Set(birimFiyatlar.map(item => item.birim))).map((birim) => (
                                <MenuItem key={birim} value={birim}>{birim}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {/* Birim Fiyat Tablosu */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Poz No</TableCell>
                            <TableCell>Tanım</TableCell>
                            <TableCell>Birim</TableCell>
                            <TableCell align="right">Birim Fiyat</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredBirimFiyatlar.map((birimFiyat) => (
                            <TableRow key={birimFiyat.id}>
                                <TableCell>{birimFiyat.pozNo}</TableCell>
                                <TableCell>
                                    <Tooltip title={birimFiyat.aciklama} arrow>
                                        <Typography>{birimFiyat.tanim}</Typography>
                                    </Tooltip>
                                </TableCell>
                                <TableCell>{birimFiyat.birim}</TableCell>
                                <TableCell align="right">
                                    {new Intl.NumberFormat('tr-TR', {
                                        style: 'currency',
                                        currency: 'TRY'
                                    }).format(birimFiyat.birimFiyat)}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleEdit(birimFiyat)}
                                    >
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={() => handleDelete(birimFiyat.id)}
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredBirimFiyatlar.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    <Typography variant="body2" sx={{ py: 2 }}>
                                        Gösterilecek birim fiyat bulunamadı
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Birim Fiyat Dialog */}
            <Dialog
                open={openDialog}
                onClose={handleDialogClose}
                maxWidth="sm"
                fullWidth
            >
                <form onSubmit={handleSubmit}>
                <DialogTitle>
                    {selectedBirimFiyat ? 'Birim Fiyat Düzenle' : 'Yeni Birim Fiyat'}
                </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Poz No"
                                    value={formData.pozNo}
                                    onChange={(e) => setFormData({ ...formData, pozNo: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Tanım"
                                    value={formData.tanim}
                                    onChange={(e) => setFormData({ ...formData, tanim: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Birim"
                                    value={formData.birim}
                                    onChange={(e) => setFormData({ ...formData, birim: e.target.value })}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Birim Fiyat"
                                    type="number"
                                    value={formData.birimFiyat}
                                    onChange={(e) => setFormData({ ...formData, birimFiyat: e.target.value })}
                                    required
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start">₺</InputAdornment>,
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Açıklama"
                                    value={formData.aciklama}
                                    onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
                                    multiline
                                    rows={4}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleDialogClose}>
                            İptal
                        </Button>
                        <Button
                            type="submit"
                            variant="contained"
                            sx={{
                                bgcolor: sidebarColor,
                                '&:hover': {
                                    bgcolor: alpha(sidebarColor, 0.9)
                                }
                            }}
                        >
                            {selectedBirimFiyat ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default BirimFiyatlar;
