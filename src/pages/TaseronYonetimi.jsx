import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Grid,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Typography,
    CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useSnackbar } from 'notistack';

const TaseronYonetimi = () => {
    const [taseronlar, setTaseronlar] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedTaseron, setSelectedTaseron] = useState(null);
    const { enqueueSnackbar } = useSnackbar();

    const [formData, setFormData] = useState({
        unvan: '',
        vergiDairesi: '',
        vergiNo: '',
        yetkili: '',
        adres: '',
        telefon: '',
        eposta: ''
    });

    // Taşeronları getir
    const fetchTaseronlar = async () => {
        try {
            setLoading(true);
            const querySnapshot = await getDocs(collection(db, 'taseronlar'));
            const taseronList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTaseronlar(taseronList);
        } catch (error) {
            console.error('Taşeronlar yüklenirken hata:', error);
            enqueueSnackbar('Taşeronlar yüklenirken hata oluştu', { variant: 'error' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTaseronlar();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (selectedTaseron) {
                // Güncelleme
                await updateDoc(doc(db, 'taseronlar', selectedTaseron.id), formData);
                enqueueSnackbar('Taşeron başarıyla güncellendi', { variant: 'success' });
            } else {
                // Yeni ekleme
                await addDoc(collection(db, 'taseronlar'), formData);
                enqueueSnackbar('Taşeron başarıyla eklendi', { variant: 'success' });
            }
            handleCloseModal();
            fetchTaseronlar();
        } catch (error) {
            console.error('Taşeron kaydedilirken hata:', error);
            enqueueSnackbar('Taşeron kaydedilirken hata oluştu', { variant: 'error' });
        }
    };

    const handleEdit = (taseron) => {
        setSelectedTaseron(taseron);
        setFormData({
            unvan: taseron.unvan || '',
            vergiDairesi: taseron.vergiDairesi || '',
            vergiNo: taseron.vergiNo || '',
            yetkili: taseron.yetkili || '',
            adres: taseron.adres || '',
            telefon: taseron.telefon || '',
            eposta: taseron.eposta || ''
        });
        setModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Bu taşeronu silmek istediğinizden emin misiniz?')) {
            try {
                await deleteDoc(doc(db, 'taseronlar', id));
                enqueueSnackbar('Taşeron başarıyla silindi', { variant: 'success' });
                fetchTaseronlar();
            } catch (error) {
                console.error('Taşeron silinirken hata:', error);
                enqueueSnackbar('Taşeron silinirken hata oluştu', { variant: 'error' });
            }
        }
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setSelectedTaseron(null);
        setFormData({
            unvan: '',
            vergiDairesi: '',
            vergiNo: '',
            yetkili: '',
            adres: '',
            telefon: '',
            eposta: ''
        });
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
                <Typography variant="h5">Taşeron Yönetimi</Typography>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setModalOpen(true)}
                >
                    Yeni Taşeron
                </Button>
            </Box>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Ünvan</TableCell>
                            <TableCell>Vergi Dairesi</TableCell>
                            <TableCell>Vergi No</TableCell>
                            <TableCell>Yetkili</TableCell>
                            <TableCell>Telefon</TableCell>
                            <TableCell>E-posta</TableCell>
                            <TableCell>İşlemler</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {taseronlar.map((taseron) => (
                            <TableRow key={taseron.id}>
                                <TableCell>{taseron.unvan}</TableCell>
                                <TableCell>{taseron.vergiDairesi}</TableCell>
                                <TableCell>{taseron.vergiNo}</TableCell>
                                <TableCell>{taseron.yetkili}</TableCell>
                                <TableCell>{taseron.telefon}</TableCell>
                                <TableCell>{taseron.eposta}</TableCell>
                                <TableCell>
                                    <IconButton onClick={() => handleEdit(taseron)} size="small">
                                        <EditIcon />
                                    </IconButton>
                                    <IconButton onClick={() => handleDelete(taseron.id)} size="small">
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={modalOpen} onClose={handleCloseModal} maxWidth="md" fullWidth>
                <form onSubmit={handleSubmit}>
                    <DialogTitle>
                        {selectedTaseron ? 'Taşeron Düzenle' : 'Yeni Taşeron'}
                    </DialogTitle>
                    <DialogContent>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Firma Ünvanı"
                                    name="unvan"
                                    value={formData.unvan}
                                    onChange={handleInputChange}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Vergi Dairesi"
                                    name="vergiDairesi"
                                    value={formData.vergiDairesi}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Vergi No"
                                    name="vergiNo"
                                    value={formData.vergiNo}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Yetkili"
                                    name="yetkili"
                                    value={formData.yetkili}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Adres"
                                    name="adres"
                                    value={formData.adres}
                                    onChange={handleInputChange}
                                    multiline
                                    rows={3}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Telefon"
                                    name="telefon"
                                    value={formData.telefon}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="E-posta"
                                    name="eposta"
                                    type="email"
                                    value={formData.eposta}
                                    onChange={handleInputChange}
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseModal}>İptal</Button>
                        <Button type="submit" variant="contained" color="primary">
                            {selectedTaseron ? 'Güncelle' : 'Kaydet'}
                        </Button>
                    </DialogActions>
                </form>
            </Dialog>
        </Box>
    );
};

export default TaseronYonetimi; 