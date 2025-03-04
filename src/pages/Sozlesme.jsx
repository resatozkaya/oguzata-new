import React, { useState, useEffect } from 'react';
import { sozlesmeService } from '../services/sozlesmeService';
import { useParams } from 'react-router-dom';
import {
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Box,
    Typography,
    Grid,
    IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import tr from 'date-fns/locale/tr';

const Sozlesme = () => {
    const { projeId } = useParams();
    const [sozlesmeler, setSozlesmeler] = useState([]);
    const [selectedSozlesme, setSelectedSozlesme] = useState(null);
    const [birimFiyatlar, setBirimFiyatlar] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [birimFiyatModalOpen, setBirimFiyatModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        sozlesmeNo: '',
        isinAdi: '',
        isinTanimi: '',
        sozlesmeBedeli: '',
        isSuresi: '',
        baslangicTarihi: null,
        isverenAdi: '',
        isverenAdres: '',
        yukleniciAdi: '',
        yukleniciAdres: ''
    });
    const [birimFiyatData, setBirimFiyatData] = useState({
        pozNo: '',
        pozAdi: '',
        birim: '',
        birimFiyat: '',
        aciklama: ''
    });

    useEffect(() => {
        if (projeId) {
            loadSozlesmeler();
        }
    }, [projeId]);

    const loadSozlesmeler = async () => {
        try {
            setLoading(true);
            const data = await sozlesmeService.getProjeSozlesmeleri(projeId);
            setSozlesmeler(data);
        } catch (error) {
            console.error('Sözleşmeler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSozlesmeSelect = async (sozlesmeId) => {
        try {
            const detay = await sozlesmeService.getSozlesmeDetails(sozlesmeId);
            setSelectedSozlesme(detay.sozlesme);
            setBirimFiyatlar(detay.birimFiyatlar);
        } catch (error) {
            console.error('Sözleşme detayları alınırken hata:', error);
        }
    };

    const handleSozlesmeSubmit = async () => {
        try {
            await sozlesmeService.createSozlesme({
                ...formData,
                projeId
            });
            setModalOpen(false);
            loadSozlesmeler();
            setFormData({
                sozlesmeNo: '',
                isinAdi: '',
                isinTanimi: '',
                sozlesmeBedeli: '',
                isSuresi: '',
                baslangicTarihi: null,
                isverenAdi: '',
                isverenAdres: '',
                yukleniciAdi: '',
                yukleniciAdres: ''
            });
        } catch (error) {
            console.error('Sözleşme oluşturulurken hata:', error);
        }
    };

    const handleBirimFiyatSubmit = async () => {
        try {
            await sozlesmeService.createBirimFiyat({
                ...birimFiyatData,
                sozlesmeId: selectedSozlesme.id
            });
            setBirimFiyatModalOpen(false);
            handleSozlesmeSelect(selectedSozlesme.id);
            setBirimFiyatData({
                pozNo: '',
                pozAdi: '',
                birim: '',
                birimFiyat: '',
                aciklama: ''
            });
        } catch (error) {
            console.error('Birim fiyat eklenirken hata:', error);
        }
    };

    const columns = [
        { field: 'sozlesmeNo', headerName: 'Sözleşme No' },
        { field: 'isinAdi', headerName: 'İşin Adı' },
        { field: 'sozlesmeBedeli', headerName: 'Sözleşme Bedeli' },
        { 
            field: 'baslangicTarihi', 
            headerName: 'Başlangıç Tarihi',
            render: (date) => date ? new Date(date.seconds * 1000).toLocaleDateString() : '-'
        },
        {
            field: 'actions',
            headerName: 'İşlemler',
            render: (row) => (
                <IconButton
                    onClick={() => handleSozlesmeSelect(row.id)}
                    size="small"
                >
                    <EditIcon />
                </IconButton>
            )
        }
    ];

    return (
        <Box sx={{ width: '100%', p: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Typography variant="h5" component="h1" gutterBottom>
                    Sözleşme Yönetimi
                </Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setModalOpen(true)}
                    sx={{ mb: 2 }}
                >
                    Yeni Sözleşme
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.field}>
                                    {column.headerName}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sozlesmeler.map((row) => (
                            <TableRow key={row.id}>
                                {columns.map((column) => (
                                    <TableCell key={column.field}>
                                        {column.render ? column.render(row) : row[column.field]}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {selectedSozlesme && (
                <Box sx={{ mt: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6">
                            Birim Fiyatlar
                        </Typography>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setBirimFiyatModalOpen(true)}
                        >
                            Yeni Birim Fiyat
                        </Button>
                    </Box>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Poz No</TableCell>
                                    <TableCell>Poz Adı</TableCell>
                                    <TableCell>Birim</TableCell>
                                    <TableCell>Birim Fiyat</TableCell>
                                    <TableCell>Açıklama</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {birimFiyatlar.map((birimFiyat) => (
                                    <TableRow key={birimFiyat.id}>
                                        <TableCell>{birimFiyat.pozNo}</TableCell>
                                        <TableCell>{birimFiyat.pozAdi}</TableCell>
                                        <TableCell>{birimFiyat.birim}</TableCell>
                                        <TableCell>{birimFiyat.birimFiyat}</TableCell>
                                        <TableCell>{birimFiyat.aciklama}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            )}

            {/* Sözleşme Ekleme Modal */}
            <Dialog 
                open={modalOpen} 
                onClose={() => setModalOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <DialogTitle>Yeni Sözleşme</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Sözleşme No"
                                value={formData.sozlesmeNo}
                                onChange={(e) => setFormData({ ...formData, sozlesmeNo: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                                <DatePicker
                                    label="Başlangıç Tarihi"
                                    value={formData.baslangicTarihi}
                                    onChange={(newValue) => setFormData({ ...formData, baslangicTarihi: newValue })}
                                    renderInput={(params) => <TextField {...params} fullWidth />}
                                />
                            </LocalizationProvider>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="İşin Adı"
                                value={formData.isinAdi}
                                onChange={(e) => setFormData({ ...formData, isinAdi: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="İşin Tanımı"
                                value={formData.isinTanimi}
                                onChange={(e) => setFormData({ ...formData, isinTanimi: e.target.value })}
                                fullWidth
                                multiline
                                rows={3}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Sözleşme Bedeli"
                                value={formData.sozlesmeBedeli}
                                onChange={(e) => setFormData({ ...formData, sozlesmeBedeli: e.target.value })}
                                fullWidth
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="İş Süresi (Gün)"
                                value={formData.isSuresi}
                                onChange={(e) => setFormData({ ...formData, isSuresi: e.target.value })}
                                fullWidth
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="İşveren Adı"
                                value={formData.isverenAdi}
                                onChange={(e) => setFormData({ ...formData, isverenAdi: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="İşveren Adres"
                                value={formData.isverenAdres}
                                onChange={(e) => setFormData({ ...formData, isverenAdres: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Yüklenici Adı"
                                value={formData.yukleniciAdi}
                                onChange={(e) => setFormData({ ...formData, yukleniciAdi: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Yüklenici Adres"
                                value={formData.yukleniciAdres}
                                onChange={(e) => setFormData({ ...formData, yukleniciAdres: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>İptal</Button>
                    <Button onClick={handleSozlesmeSubmit} variant="contained">
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Birim Fiyat Ekleme Modal */}
            <Dialog 
                open={birimFiyatModalOpen} 
                onClose={() => setBirimFiyatModalOpen(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Yeni Birim Fiyat</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Poz No"
                                value={birimFiyatData.pozNo}
                                onChange={(e) => setBirimFiyatData({ ...birimFiyatData, pozNo: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Birim"
                                value={birimFiyatData.birim}
                                onChange={(e) => setBirimFiyatData({ ...birimFiyatData, birim: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Poz Adı"
                                value={birimFiyatData.pozAdi}
                                onChange={(e) => setBirimFiyatData({ ...birimFiyatData, pozAdi: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Birim Fiyat"
                                value={birimFiyatData.birimFiyat}
                                onChange={(e) => setBirimFiyatData({ ...birimFiyatData, birimFiyat: e.target.value })}
                                fullWidth
                                type="number"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                label="Açıklama"
                                value={birimFiyatData.aciklama}
                                onChange={(e) => setBirimFiyatData({ ...birimFiyatData, aciklama: e.target.value })}
                                fullWidth
                                multiline
                                rows={2}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBirimFiyatModalOpen(false)}>İptal</Button>
                    <Button onClick={handleBirimFiyatSubmit} variant="contained">
                        Kaydet
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Sozlesme;
