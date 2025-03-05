import React, { useState, useEffect } from 'react';
import { createSozlesme, updateSozlesme, deleteSozlesme, getSozlesmeler, getSozlesme } from '../services/sozlesmeService';
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
    Box,
    Typography,
    Modal,
    TextField,
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
        loadSozlesmeler();
    }, []);

    const loadSozlesmeler = async () => {
        try {
            setLoading(true);
            const data = await getSozlesmeler();
            setSozlesmeler(data);
        } catch (error) {
            console.error('Sözleşmeler yüklenirken hata:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSozlesmeSelect = async (sozlesmeId) => {
        try {
            const sozlesme = await getSozlesme(sozlesmeId);
            setSelectedSozlesme(sozlesme);
        } catch (error) {
            console.error('Sözleşme detayları alınırken hata:', error);
        }
    };

    const handleSozlesmeSubmit = async () => {
        try {
            await createSozlesme(formData);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDateChange = (date) => {
        setFormData(prev => ({
            ...prev,
            baslangicTarihi: date
        }));
    };

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
                            <TableCell>Sözleşme No</TableCell>
                            <TableCell>İşin Adı</TableCell>
                            <TableCell>Sözleşme Bedeli</TableCell>
                            <TableCell>Başlangıç Tarihi</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {sozlesmeler.map((sozlesme) => (
                            <TableRow key={sozlesme.id}>
                                <TableCell>{sozlesme.sozlesmeNo}</TableCell>
                                <TableCell>{sozlesme.isinAdi}</TableCell>
                                <TableCell>{sozlesme.sozlesmeBedeli}</TableCell>
                                <TableCell>
                                    {sozlesme.baslangicTarihi?.toDate().toLocaleDateString('tr-TR')}
                                </TableCell>
                                <TableCell>
                                    <IconButton
                                        onClick={() => handleSozlesmeSelect(sozlesme.id)}
                                        size="small"
                                    >
                                        <EditIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Modal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                aria-labelledby="sozlesme-modal"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}>
                    <Typography variant="h6" component="h2" gutterBottom>
                        Yeni Sözleşme
                    </Typography>
                    <Box component="form" sx={{ mt: 2 }}>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Sözleşme No"
                            name="sozlesmeNo"
                            value={formData.sozlesmeNo}
                            onChange={handleInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="İşin Adı"
                            name="isinAdi"
                            value={formData.isinAdi}
                            onChange={handleInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="İşin Tanımı"
                            name="isinTanimi"
                            value={formData.isinTanimi}
                            onChange={handleInputChange}
                            multiline
                            rows={3}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Sözleşme Bedeli"
                            name="sozlesmeBedeli"
                            value={formData.sozlesmeBedeli}
                            onChange={handleInputChange}
                            type="number"
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="İş Süresi (Gün)"
                            name="isSuresi"
                            value={formData.isSuresi}
                            onChange={handleInputChange}
                            type="number"
                        />
                        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                            <DatePicker
                                label="Başlangıç Tarihi"
                                value={formData.baslangicTarihi}
                                onChange={handleDateChange}
                                renderInput={(params) => (
                                    <TextField {...params} fullWidth margin="normal" />
                                )}
                            />
                        </LocalizationProvider>
                        <TextField
                            fullWidth
                            margin="normal"
                            label="İşveren Adı"
                            name="isverenAdi"
                            value={formData.isverenAdi}
                            onChange={handleInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="İşveren Adres"
                            name="isverenAdres"
                            value={formData.isverenAdres}
                            onChange={handleInputChange}
                            multiline
                            rows={2}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Yüklenici Adı"
                            name="yukleniciAdi"
                            value={formData.yukleniciAdi}
                            onChange={handleInputChange}
                        />
                        <TextField
                            fullWidth
                            margin="normal"
                            label="Yüklenici Adres"
                            name="yukleniciAdres"
                            value={formData.yukleniciAdres}
                            onChange={handleInputChange}
                            multiline
                            rows={2}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleSozlesmeSubmit}
                            sx={{ mt: 3 }}
                        >
                            Kaydet
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default Sozlesme;
