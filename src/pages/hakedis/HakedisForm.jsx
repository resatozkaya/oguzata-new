// Firebase imports
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, serverTimestamp, updateDoc, orderBy, writeBatch } from 'firebase/firestore';

// Context imports
import { useAuth } from '../../contexts/AuthContext';

// Service imports
import sozlesmeService from '../../services/sozlesmeService';

// Component imports
import SozlesmeSantiyeSecici from '../../components/SozlesmeSantiyeSecici';

// Material-UI imports
import {
    Box,
    Button,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    TextField,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Tooltip,
    Chip,
    Card,
    CardContent,
    InputAdornment,
    Tabs,
    Tab
} from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { Autocomplete } from '@mui/material';
import { CircularProgress, Alert, Divider } from '@mui/material';

// React imports
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';
import { useTheme } from '../../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';

// Date imports
import dayjs from 'dayjs';
import 'dayjs/locale/tr';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Configure dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('tr');

// TabPanel bileşeni
function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`hakedis-tabpanel-${index}`}
            aria-labelledby={`hakedis-tab-${index}`}
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

const HakedisForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { enqueueSnackbar } = useSnackbar();
    const { currentUser } = useAuth();
    const { isDarkMode, sidebarColor } = useTheme();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState(0);

    const [formData, setFormData] = useState({
        hakedisNo: '',
        sozlesmeId: '',
        donem: null,
        isKalemleri: [],
        kesintiler: [],
        atasmanlar: [],
        toplamTutar: 0,
        kesintilerToplami: 0,
        kdv: 0,
        netTutar: 0,
        durum: 'taslak'
    });

    const [sozlesmeler, setSozlesmeler] = useState([]);
    const [yesilDefterVerileri, setYesilDefterVerileri] = useState([]);
    const [kesintilerListesi, setKesintilerListesi] = useState([]);
    const [atasmanlar, setAtasmanlar] = useState([]);

    useEffect(() => {
        loadSozlesmeler();
        if (id) {
            loadHakedis(id);
        }
    }, [id]);

    const loadSozlesmeler = async () => {
        try {
            const sozlesmeRef = collection(db, 'sozlesmeler');
            const q = query(sozlesmeRef, orderBy('sozlesmeAdi'));
            const querySnapshot = await getDocs(q);
            const sozlesmeData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setSozlesmeler(sozlesmeData);
        } catch (error) {
            console.error('Sözleşmeler yüklenirken hata:', error);
            setError('Sözleşmeler yüklenemedi');
        }
    };

    const loadHakedis = async (hakedisId) => {
        try {
            setLoading(true);
            const hakedisDoc = await getDoc(doc(db, 'hakedisler', hakedisId));
            
                if (hakedisDoc.exists()) {
                    const hakedisData = hakedisDoc.data();
                setFormData(hakedisData);

                    if (hakedisData.sozlesmeId) {
                    const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', hakedisData.sozlesmeId));
                    if (sozlesmeDoc.exists()) {
                        setFormData(prev => ({ ...prev, sozlesmeId: hakedisData.sozlesmeId }));
                        await loadYesilDefterVerileri(hakedisData.sozlesmeId);
                        await loadKesintiler(hakedisData.sozlesmeId);
                        await loadAtasmanlar(hakedisData.sozlesmeId);
                    }
                }
            } else {
                setError('Hakediş bulunamadı');
            }
        } catch (error) {
            console.error('Hakediş yüklenirken hata:', error);
            setError('Hakediş yüklenirken bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    const loadYesilDefterVerileri = async (sozlesmeId) => {
        try {
            const yesilDefterRef = collection(db, 'yesilDefter');
            const q = query(
                yesilDefterRef,
                where('sozlesmeId', '==', sozlesmeId),
                where('durum', '==', 'aktif')
            );
            const querySnapshot = await getDocs(q);
            const veriler = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                secili: false
            }));
            setYesilDefterVerileri(veriler);
        } catch (error) {
            console.error('Yeşil defter verileri yüklenirken hata:', error);
        }
    };

    const loadKesintiler = async (sozlesmeId) => {
        try {
            const kesintilerRef = collection(db, 'kesintiler');
            const q = query(
                kesintilerRef,
                where('sozlesmeId', '==', sozlesmeId),
                where('durum', '==', 'aktif')
            );
            const querySnapshot = await getDocs(q);
            const kesintiler = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                secili: false
            }));
            setKesintilerListesi(kesintiler);
        } catch (error) {
            console.error('Kesintiler yüklenirken hata:', error);
        }
    };

    const loadAtasmanlar = async (sozlesmeId) => {
        try {
            const atasmanRef = collection(db, 'atasmanlar');
            const q = query(
                atasmanRef,
                where('sozlesmeId', '==', sozlesmeId),
                where('durum', '==', 'aktif')
            );
            const querySnapshot = await getDocs(q);
            const atasmanlar = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                secili: false
            }));
            setAtasmanlar(atasmanlar);
        } catch (error) {
            console.error('Ataşmanlar yüklenirken hata:', error);
        }
    };

    const generateHakedisNo = async (sozlesmeId, donem) => {
        if (!sozlesmeId || !donem) return '';
        
        try {
            const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', sozlesmeId));
            if (!sozlesmeDoc.exists()) return '';
            
            const sozlesmeKodu = sozlesmeDoc.data().sozlesmeKodu || '';
            const yil = new Date(donem.seconds * 1000).getFullYear();
            
            // Mevcut hakedişleri kontrol et
            const hakedisRef = collection(db, 'hakedisler');
            const q = query(
                hakedisRef,
                where('sozlesmeId', '==', sozlesmeId),
                where('yil', '==', yil)
            );
            const querySnapshot = await getDocs(q);
            const donemNo = querySnapshot.size + 1;
            
            return `${sozlesmeKodu}-${yil}-${donemNo.toString().padStart(3, '0')}`;
        } catch (error) {
            console.error('Hakediş no üretilirken hata:', error);
            return '';
        }
    };

    const handleSozlesmeChange = async (event) => {
        const sozlesmeId = event.target.value;
        setFormData(prev => ({ ...prev, sozlesmeId }));
        
        // İlgili verileri yükle
        await loadYesilDefterVerileri(sozlesmeId);
        await loadKesintiler(sozlesmeId);
        await loadAtasmanlar(sozlesmeId);
        
        // Hakediş no güncelle
        if (formData.donem) {
            const hakedisNo = await generateHakedisNo(sozlesmeId, formData.donem);
            setFormData(prev => ({ ...prev, hakedisNo }));
        }
    };

    const handleDonemChange = async (date) => {
        setFormData(prev => ({ ...prev, donem: date }));
        
        if (formData.sozlesmeId) {
            const hakedisNo = await generateHakedisNo(formData.sozlesmeId, date);
            setFormData(prev => ({ ...prev, hakedisNo }));
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            
            // Hakediş verilerini kaydet
            const hakedisRef = id ? doc(db, 'hakedisler', id) : doc(collection(db, 'hakedisler'));
            await updateDoc(hakedisRef, {
                ...formData,
                updatedAt: new Date(),
                updatedBy: currentUser.uid,
                ...(id ? {} : { createdAt: new Date(), createdBy: currentUser.uid })
            });

            // Yeşil defter verilerini güncelle
            for (const isKalemi of formData.isKalemleri) {
                const yesilDefterRef = doc(db, 'yesilDefter', isKalemi.yesilDefterId);
                await updateDoc(yesilDefterRef, {
                    oncekiAylarToplami: isKalemi.miktar,
                    updatedAt: new Date(),
                    updatedBy: currentUser.uid
                });
            }

            enqueueSnackbar('Hakediş başarıyla kaydedildi', { variant: 'success' });
            navigate('/hakedis');
        } catch (error) {
            console.error('Hakediş kaydedilirken hata:', error);
            enqueueSnackbar('Hakediş kaydedilirken bir hata oluştu', { variant: 'error' });
        } finally {
            setSaving(false);
        }
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const calculateTotals = () => {
        const toplamTutar = formData.isKalemleri.reduce((sum, item) => sum + (item.miktar * item.birimFiyat), 0);
        const kesintilerToplami = formData.kesintiler.reduce((sum, item) => sum + item.tutar, 0);
        const kdv = toplamTutar * 0.20; // %20 KDV
        const netTutar = toplamTutar - kesintilerToplami + kdv;

        setFormData(prev => ({
            ...prev,
            toplamTutar,
            kesintilerToplami,
            kdv,
            netTutar
        }));
    };

    useEffect(() => {
        calculateTotals();
    }, [formData.isKalemleri, formData.kesintiler]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">{error}</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold' }}>
                {id ? 'Hakediş Düzenle' : 'Yeni Hakediş'}
            </Typography>

            <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 3 }}>
                <Tab label="İş Kalemleri" />
                <Tab label="Kesintiler" />
                <Tab label="Ataşmanlar" />
            </Tabs>

            <form onSubmit={handleSave}>
                {activeTab === 0 && (
                    <Card sx={{ mb: 3 }}>
                        <CardContent>
                <Grid container spacing={3}>
                                <Grid item xs={12} md={6}>
                            <TextField
                                        fullWidth
                                label="Hakediş No"
                                value={formData.hakedisNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, hakedisNo: e.target.value }))}
                                    />
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Autocomplete
                                        options={sozlesmeler}
                                        getOptionLabel={(option) => option ? `${option.sozlesmeNo} - ${option.sozlesmeAdi}` : ''}
                                        value={sozlesmeler.find(sozlesme => sozlesme.id === formData.sozlesmeId) || null}
                                        onChange={(event, newValue) => {
                                            if (newValue) {
                                                handleSozlesmeChange({ target: { value: newValue.id } });
                                            }
                                        }}
                                        renderInput={(params) => (
                                            <TextField
                                                {...params}
                                                label="Sözleşme"
                                required
                                            />
                                        )}
                                        isOptionEqualToValue={(option, value) => option.id === value?.id}
                            />
                    </Grid>
                                <Grid item xs={12} md={6}>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                                        <MobileDatePicker
                                            label="Dönem"
                                            inputFormat="MM/YYYY"
                                            value={formData.donem ? dayjs.unix(formData.donem.seconds) : null}
                                            onChange={(newValue) => {
                                                if (newValue) {
                                                    const date = newValue.toDate();
                                                    handleDonemChange(date);
                                                }
                                            }}
                                            views={['month', 'year']}
                                            renderInput={(params) => (
                                                <TextField
                                                    {...params}
                                                    fullWidth
                                                    required
                                                />
                                            )}
                            />
                        </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} md={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Durum</InputLabel>
                            <Select
                                            value={formData.durum}
                                            onChange={(e) => setFormData(prev => ({ ...prev, durum: e.target.value }))}
                                        >
                                            <MenuItem value="taslak">Taslak</MenuItem>
                                            <MenuItem value="onaybekliyor">Onay Bekliyor</MenuItem>
                                            <MenuItem value="onaylandi">Onaylandı</MenuItem>
                                            <MenuItem value="reddedildi">Reddedildi</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            fullWidth
                            multiline
                            rows={4}
                                        label="Açıklama"
                            value={formData.aciklama}
                                        onChange={(e) => setFormData(prev => ({ ...prev, aciklama: e.target.value }))}
                        />
                    </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 1 && (
                    <Card>
                        <CardContent>
                            <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                            <TableCell>Kesinti Adı</TableCell>
                                            <TableCell>Tutar</TableCell>
                                        <TableCell>İşlemler</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                        {formData.kesintiler.map((kesinti, index) => (
                                                <TableRow key={index}>
                                                <TableCell>{kesinti.ad}</TableCell>
                                                <TableCell>{kesinti.tutar}</TableCell>
                                                    <TableCell>
                                                    <IconButton onClick={() => {/* Kesinti silme */}}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                )}

                {activeTab === 2 && (
                    <Card>
                        <CardContent>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                            <TableRow>
                                            <TableCell>Ataşman No</TableCell>
                                            <TableCell>Açıklama</TableCell>
                                            <TableCell>Tarih</TableCell>
                                            <TableCell>İşlemler</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {formData.atasmanlar.map((atasman, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{atasman.no}</TableCell>
                                                <TableCell>{atasman.aciklama}</TableCell>
                                                <TableCell>{new Date(atasman.tarih.seconds * 1000).toLocaleDateString('tr-TR')}</TableCell>
                                                <TableCell>
                                                    <IconButton onClick={() => {/* Ataşman silme */}}>
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </CardContent>
                    </Card>
                )}

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button onClick={() => navigate('/hakedis')}>
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

export default HakedisForm;
