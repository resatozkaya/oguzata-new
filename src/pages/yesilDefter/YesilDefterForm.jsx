import React, { useState, useEffect } from 'react';
import {
    Box,
    Button,
    Card,
    CardContent,
    Grid,
    TextField,
    Typography,
    CircularProgress,
    Alert,
    Autocomplete,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import SozlesmeSecici from '../../components/SozlesmeSecici';

const YesilDefterForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [isKalemleri, setIsKalemleri] = useState([]);
    const [selectedSozlesme, setSelectedSozlesme] = useState(null);

    const [formData, setFormData] = useState({
        sozlesmeId: '',
        pozNo: '',
        isKalemiAdi: '',
        miktar: '',
        birim: '',
        birimFiyat: '',
        oncekiAylarToplami: '0',
        gecenAy: '0',
        buAy: '0',
        aciklama: '',
        durum: 'aktif'
    });

    useEffect(() => {
        if (id) {
            loadYesilDefter(id);
        }
    }, [id]);

    useEffect(() => {
        if (selectedSozlesme?.id) {
            loadIsKalemleri(selectedSozlesme.id);
        }
    }, [selectedSozlesme]);

    const loadYesilDefter = async (yesilDefterId) => {
        try {
            setLoading(true);
            const yesilDefterDoc = await getDoc(doc(db, 'yesilDefter', yesilDefterId));
            
            if (yesilDefterDoc.exists()) {
                const data = yesilDefterDoc.data();
                setFormData(data);
                
                // Sözleşme bilgisini yükle
                if (data.sozlesmeId) {
                    const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', data.sozlesmeId));
                    if (sozlesmeDoc.exists()) {
                        setSelectedSozlesme({
                            id: sozlesmeDoc.id,
                            ...sozlesmeDoc.data()
                        });
                    }
                }
            } else {
                setError('Kayıt bulunamadı');
            }
        } catch (error) {
            console.error('Kayıt yüklenirken hata:', error);
            setError('Kayıt yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const loadIsKalemleri = async (sozlesmeId) => {
        try {
            const isKalemleriRef = collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri');
            const q = query(isKalemleriRef, orderBy('pozNo'));
            const querySnapshot = await getDocs(q);
            
            const isKalemleriData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            setIsKalemleri(isKalemleriData);
        } catch (error) {
            console.error('İş kalemleri yüklenirken hata:', error);
            enqueueSnackbar('İş kalemleri yüklenirken bir hata oluştu', { variant: 'error' });
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!selectedSozlesme?.id) {
            enqueueSnackbar('Lütfen bir sözleşme seçin', { variant: 'error' });
            return;
        }

        try {
            setSaving(true);
            
            const saveData = {
                ...formData,
                sozlesmeId: selectedSozlesme.id,
                sozlesmeAdi: selectedSozlesme.sozlesmeAdi,
                kullaniciId: currentUser.uid,
                oncekiAylarToplami: Number(formData.oncekiAylarToplami),
                gecenAy: Number(formData.gecenAy),
                buAy: Number(formData.buAy),
                birimFiyat: Number(formData.birimFiyat),
                miktar: Number(formData.miktar),
                updatedAt: new Date(),
                updatedBy: currentUser.uid
            };

            if (id) {
                await updateDoc(doc(db, 'yesilDefter', id), saveData);
                enqueueSnackbar('Kayıt başarıyla güncellendi', { variant: 'success' });
            } else {
                await addDoc(collection(db, 'yesilDefter'), {
                    ...saveData,
                    createdAt: new Date(),
                    createdBy: currentUser.uid
                });
                enqueueSnackbar('Kayıt başarıyla oluşturuldu', { variant: 'success' });
            }
            
            navigate('/yesilDefter');
        } catch (error) {
            console.error('Kayıt sırasında hata:', error);
            enqueueSnackbar('Kayıt sırasında bir hata oluştu', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleIsKalemiChange = (event, newValue) => {
        if (newValue) {
            setFormData(prev => ({
                ...prev,
                pozNo: newValue.pozNo,
                isKalemiAdi: newValue.tanim,
                birim: newValue.birim,
                birimFiyat: newValue.birimFiyat,
                miktar: newValue.miktar
            }));
        }
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
            <Typography variant="h4" sx={{ mb: 4 }}>
                {id ? 'Yeşil Defter Kaydı Düzenle' : 'Yeni Yeşil Defter Kaydı'}
            </Typography>

            <form onSubmit={handleSave}>
                <Card>
                    <CardContent>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <SozlesmeSecici
                                    value={selectedSozlesme?.id || ''}
                                    onChange={(e, newValue) => setSelectedSozlesme(newValue)}
                                />
                            </Grid>

                            {selectedSozlesme && (
                                <Grid item xs={12}>
                                    <Autocomplete
                                        options={isKalemleri}
                                        getOptionLabel={(option) => `${option.pozNo} - ${option.tanim}`}
                                        onChange={handleIsKalemiChange}
                                        value={isKalemleri.find(
                                            item => item.pozNo === formData.pozNo && 
                                            item.tanim === formData.isKalemiAdi
                                        ) || null}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="İş Kalemi"
                                                required
                                            />
                                        )}
                                    />
                                </Grid>
                            )}

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Poz No"
                                    value={formData.pozNo}
                                    onChange={(e) => setFormData(prev => ({ ...prev, pozNo: e.target.value }))}
                                    required
                                    disabled
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Birim"
                                    value={formData.birim}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birim: e.target.value }))}
                                    required
                                    disabled
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Birim Fiyat"
                                    type="number"
                                    value={formData.birimFiyat}
                                    onChange={(e) => setFormData(prev => ({ ...prev, birimFiyat: e.target.value }))}
                                    required
                                    disabled
                                />
                            </Grid>

                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Sözleşme Miktarı"
                                    type="number"
                                    value={formData.miktar}
                                    onChange={(e) => setFormData(prev => ({ ...prev, miktar: e.target.value }))}
                                    required
                                    disabled
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Önceki Aylar Toplamı"
                                    type="number"
                                    value={formData.oncekiAylarToplami}
                                    onChange={(e) => setFormData(prev => ({ ...prev, oncekiAylarToplami: e.target.value }))}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Geçen Ay"
                                    type="number"
                                    value={formData.gecenAy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, gecenAy: e.target.value }))}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12} md={4}>
                                <TextField
                                    fullWidth
                                    label="Bu Ay"
                                    type="number"
                                    value={formData.buAy}
                                    onChange={(e) => setFormData(prev => ({ ...prev, buAy: e.target.value }))}
                                    required
                                />
                            </Grid>

                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Açıklama"
                                    multiline
                                    rows={4}
                                    value={formData.aciklama}
                                    onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                                />
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => navigate('/yesilDefter')}>
                        İptal
                    </Button>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={saving}
                    >
                        {saving ? 'Kaydediliyor...' : (id ? 'Güncelle' : 'Kaydet')}
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default YesilDefterForm; 