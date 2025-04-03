import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  CircularProgress,
  Alert,
  Stack,
  IconButton,
  Tabs,
  Tab,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  InputAdornment
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, orderBy, addDoc, deleteDoc, serverTimestamp, Timestamp, writeBatch, where, limit } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../config/firebase';
import { alpha } from '@mui/material/styles';
import { useSnackbar } from 'notistack';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { tr } from 'date-fns/locale';
import { CloudUpload as CloudUploadIcon, Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../../contexts/AuthContext';
import sozlesmeService from '../../services/sozlesmeService';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const SozlesmeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode, sidebarColor } = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [isKalemleri, setIsKalemleri] = useState([]);
  const [yeniIsKalemi, setYeniIsKalemi] = useState({
    pozNo: '',
    tanim: '',
    birim: '',
    birimFiyat: '',
    miktar: ''
  });

  const [formData, setFormData] = useState({
    sozlesmeNo: '',
    sozlesmeAdi: '',
    sozlesmeTuru: 'birimFiyat',
    santiye: null,
    taseron: null,
    sozlesmeTarihi: null,
    baslangicTarihi: null,
    bitisTarihi: null,
    toplamBedel: '',
    teminatOrani: '',
    paraBirimi: 'TRY',
    aciklama: '',
    dosyaUrl: '',
    durum: 'aktif',
    birimFiyatlar: []
  });

  const [santiyeler, setSantiyeler] = useState([]);
  const [taseronlar, setTaseronlar] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [duzenlemeModu, setDuzenlemeModu] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Şantiyeleri yükle
        const santiyeSnapshot = await getDocs(collection(db, 'santiyeler'));
        const santiyeData = santiyeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setSantiyeler(santiyeData);

        // Taşeronları yükle
        const taseronSnapshot = await getDocs(collection(db, 'taseronlar'));
        const taseronData = taseronSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTaseronlar(taseronData);

        // Eğer düzenleme modundaysa sözleşme bilgilerini yükle
        if (id) {
          const sozlesme = await sozlesmeService.getSozlesmeById(id);
          console.log('Yüklenen sözleşme:', sozlesme);

          setFormData({
            ...sozlesme,
            sozlesmeTarihi: sozlesme.sozlesmeTarihi?.toDate() || null,
            baslangicTarihi: sozlesme.baslangicTarihi?.toDate() || null,
            bitisTarihi: sozlesme.bitisTarihi?.toDate() || null
          });

          // İş kalemlerini yükle
          const isKalemleriSnapshot = await getDocs(
            query(
              collection(db, 'sozlesmeler', id, 'isKalemleri'),
              orderBy('pozNo')
            )
          );

          const isKalemleriData = isKalemleriSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          setIsKalemleri(isKalemleriData);
        }
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        setError('Veri yüklenirken bir hata oluştu');
        enqueueSnackbar('Veri yüklenirken bir hata oluştu', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    const yeniToplam = isKalemleri.reduce((toplam, isKalemi) => {
      return toplam + (parseFloat(isKalemi.birimFiyat || 0) * parseFloat(isKalemi.miktar || 0));
    }, 0);
    
    setFormData(prev => ({
      ...prev,
      toplamBedel: yeniToplam.toString()
    }));
  }, [isKalemleri]);

  const formatDateForInput = (date) => {
    if (!date) return '';
    
    // Eğer Firebase Timestamp ise Date'e çevir
    if (date?.toDate) {
      date = date.toDate();
    }
    
    // Eğer string ise Date'e çevir
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    // Geçerli bir Date değilse boş string döndür
    if (!(date instanceof Date) || isNaN(date)) {
      return '';
    }
    
    // YYYY-MM-DD formatına çevir
    return date.toISOString().split('T')[0];
  };

  const handleDateChange = (field) => (event) => {
    const dateValue = event.target.value ? new Date(event.target.value) : null;
    setFormData(prev => ({
      ...prev,
      [field]: dateValue
    }));
  };

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleFileChange = (event) => {
    if (event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const validateForm = () => {
    const requiredFields = ['sozlesmeNo', 'sozlesmeAdi', 'sozlesmeTuru', 'santiye', 'taseron'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      enqueueSnackbar(`Lütfen zorunlu alanları doldurun: ${missingFields.join(', ')}`, { variant: 'warning' });
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      setError(null);

      const sozlesmeData = {
        ...formData,
        kullaniciId: currentUser.uid,
        olusturanKullanici: currentUser.uid,
        guncelleyenKullanici: currentUser.uid
      };

      console.log('Gönderilecek sözleşme verisi:', sozlesmeData);

      let sozlesmeId;
      
      if (id) {
        // Mevcut sözleşmeyi güncelle
        await sozlesmeService.updateSozlesme(id, sozlesmeData);
        sozlesmeId = id;
      } else {
        // Yeni sözleşme oluştur
        const yeniSozlesme = await sozlesmeService.createSozlesme(sozlesmeData);
        sozlesmeId = yeniSozlesme.id;
      }

      // İş kalemlerini kaydet
      const batch = writeBatch(db);
      
      // Önce mevcut iş kalemlerini al
      const mevcutIsKalemleriSnapshot = await getDocs(collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri'));
      const mevcutIsKalemleri = {};
      mevcutIsKalemleriSnapshot.forEach((doc) => {
        mevcutIsKalemleri[doc.data().pozNo] = {
          id: doc.id,
          ...doc.data()
        };
      });

      // Yeni iş kalemlerini ekle/güncelle
      for (const isKalemi of isKalemleri) {
        let isKalemiRef;
        const mevcutIsKalemi = mevcutIsKalemleri[isKalemi.pozNo];

        if (mevcutIsKalemi) {
          // Mevcut iş kalemini güncelle, ID'yi koru
          isKalemiRef = doc(db, 'sozlesmeler', sozlesmeId, 'isKalemleri', mevcutIsKalemi.id);
          const guncelData = {
            ...isKalemi,
            id: mevcutIsKalemi.id,
            // Mevcut yeşil defter verilerini koru
            buAy: mevcutIsKalemi.buAy || 0,
            gecenAy: mevcutIsKalemi.gecenAy || 0,
            oncekiAylarToplami: mevcutIsKalemi.oncekiAylarToplami || 0,
            toplamYapilan: mevcutIsKalemi.toplamYapilan || 0,
            // Gerçekleşme oranını güncelle
            gerceklesmeOrani: isKalemi.miktar > 0 ? 
              Number(((mevcutIsKalemi.toplamYapilan / isKalemi.miktar) * 100).toFixed(2)) : 0,
            guncellemeTarihi: serverTimestamp(),
            guncelleyenKullanici: currentUser.uid
          };
          batch.update(isKalemiRef, guncelData);
        } else {
          // Yeni iş kalemi ekle
          isKalemiRef = doc(collection(db, 'sozlesmeler', sozlesmeId, 'isKalemleri'));
          const yeniData = {
            ...isKalemi,
            id: isKalemiRef.id,
            buAy: 0,
            gecenAy: 0,
            oncekiAylarToplami: 0,
            toplamYapilan: 0,
            gerceklesmeOrani: 0,
            olusturmaTarihi: serverTimestamp(),
            guncellemeTarihi: serverTimestamp(),
            olusturanKullanici: currentUser.uid,
            guncelleyenKullanici: currentUser.uid
          };
          batch.set(isKalemiRef, yeniData);
        }
      }

      await batch.commit();
      console.log('İş kalemleri başarıyla kaydedildi');

      enqueueSnackbar('Sözleşme ve iş kalemleri başarıyla kaydedildi', { variant: 'success' });
      navigate('/sozlesme');
    } catch (error) {
      console.error('Sözleşme kaydedilirken hata:', error);
      setError('Sözleşme kaydedilirken bir hata oluştu');
      enqueueSnackbar('Sözleşme kaydedilirken bir hata oluştu: ' + error.message, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleIsKalemiDuzenle = (isKalemi) => {
    setYeniIsKalemi({ ...isKalemi });
    setDuzenlemeModu(true);
  };

  const handleIsKalemiKaydet = async () => {
    if (!yeniIsKalemi.pozNo || !yeniIsKalemi.tanim || !yeniIsKalemi.birim || !yeniIsKalemi.birimFiyat) {
      enqueueSnackbar('Lütfen tüm alanları doldurun', { variant: 'warning' });
      return;
    }

    try {
      if (duzenlemeModu && id) {
        // Firestore'dan mevcut iş kalemini al
        const isKalemiRef = doc(db, 'sozlesmeler', id, 'isKalemleri', yeniIsKalemi.id);
        const isKalemiDoc = await getDoc(isKalemiRef);
        
        if (isKalemiDoc.exists()) {
          const mevcutData = isKalemiDoc.data();
          const yeniMiktar = Number(yeniIsKalemi.miktar) || 0;
          
          // Yeşil defter verilerini koru
          const guncelData = {
            ...yeniIsKalemi,
            id: yeniIsKalemi.id,
            pozNo: yeniIsKalemi.pozNo,
            tanim: yeniIsKalemi.tanim,
            birim: yeniIsKalemi.birim,
            birimFiyat: Number(yeniIsKalemi.birimFiyat),
            miktar: yeniMiktar,
            // Mevcut yeşil defter verilerini koru
            buAy: mevcutData.buAy || 0,
            gecenAy: mevcutData.gecenAy || 0,
            oncekiAylarToplami: mevcutData.oncekiAylarToplami || 0,
            toplamYapilan: mevcutData.toplamYapilan || 0,
            // Gerçekleşme oranını sadece yeni miktara göre güncelle
            gerceklesmeOrani: yeniMiktar > 0 ? 
              Number(((mevcutData.toplamYapilan / yeniMiktar) * 100).toFixed(2)) : 0,
            guncellemeTarihi: serverTimestamp(),
            guncelleyenKullanici: currentUser.uid
          };

          console.log('İş kalemi güncelleniyor:', {
            id: yeniIsKalemi.id,
            eskiMiktar: mevcutData.miktar,
            yeniMiktar: yeniMiktar,
            korunanVeriler: {
              buAy: guncelData.buAy,
              gecenAy: guncelData.gecenAy,
              oncekiAylarToplami: guncelData.oncekiAylarToplami,
              toplamYapilan: guncelData.toplamYapilan
            },
            yeniGerceklesmeOrani: guncelData.gerceklesmeOrani
          });

          // Firestore'u güncelle
          await updateDoc(isKalemiRef, guncelData);
          
          // Local state'i güncelle
          setIsKalemleri(isKalemleri.map(item => 
            item.id === yeniIsKalemi.id ? guncelData : item
          ));
        }
      } else {
        // Yeni iş kalemi ekleme
        const yeniKalem = {
          id: duzenlemeModu ? yeniIsKalemi.id : doc(collection(db, 'temp')).id,
          pozNo: yeniIsKalemi.pozNo,
          tanim: yeniIsKalemi.tanim,
          birim: yeniIsKalemi.birim,
          birimFiyat: Number(yeniIsKalemi.birimFiyat),
          miktar: Number(yeniIsKalemi.miktar) || 0,
          // Yeni iş kalemi için başlangıç değerleri
          buAy: 0,
          gecenAy: 0,
          oncekiAylarToplami: 0,
          toplamYapilan: 0,
          gerceklesmeOrani: 0,
          olusturmaTarihi: serverTimestamp(),
          guncellemeTarihi: serverTimestamp(),
          olusturanKullanici: currentUser.uid,
          guncelleyenKullanici: currentUser.uid
        };

        setIsKalemleri([...isKalemleri, yeniKalem]);
      }

      // Formu temizle
      setYeniIsKalemi({
        pozNo: '',
        tanim: '',
        birim: '',
        birimFiyat: '',
        miktar: ''
      });
      setDuzenlemeModu(false);
      
      enqueueSnackbar('İş kalemi başarıyla kaydedildi', { variant: 'success' });
    } catch (error) {
      console.error('İş kalemi güncellenirken hata:', error);
      enqueueSnackbar('İş kalemi güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleIsKalemiSil = (id) => {
    setIsKalemleri(isKalemleri.filter(item => item.id !== id));
  };

  // Para formatı için yardımcı fonksiyon
  const formatMoney = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: formData.paraBirimi
    }).format(amount);
  };

  const generateSozlesmeNo = async () => {
    try {
      // Bugünün tarihini al
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}${month}${day}`;

      // Son sözleşme numarasını kontrol et
      const sozlesmeRef = collection(db, 'sozlesmeler');
      const q = query(
        sozlesmeRef,
        where('sozlesmeNo', '>=', `SZL-${dateStr}-`),
        where('sozlesmeNo', '<', `SZL-${dateStr}-999`),
        orderBy('sozlesmeNo', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(q);
      let nextNumber = 1;

      if (!snapshot.empty) {
        // Son sözleşme numarasından sayıyı çıkar
        const lastNo = snapshot.docs[0].data().sozlesmeNo;
        const lastNumber = parseInt(lastNo.split('-')[2]);
        nextNumber = lastNumber + 1;
      }

      // Yeni sözleşme numarası oluştur
      const newSozlesmeNo = `SZL-${dateStr}-${String(nextNumber).padStart(3, '0')}`;
      return newSozlesmeNo;
    } catch (error) {
      console.error('Sözleşme no oluşturulurken hata:', error);
      return '';
    }
  };

  useEffect(() => {
    const initializeSozlesmeNo = async () => {
      const newSozlesmeNo = await generateSozlesmeNo();
      setFormData(prev => ({
        ...prev,
        sozlesmeNo: newSozlesmeNo
      }));
    };

    initializeSozlesmeNo();
  }, []);

  const handleIsKalemiGuncelle = async (isKalemi) => {
    try {
      const isKalemiRef = doc(db, 'sozlesmeler', id, 'isKalemleri', isKalemi.id);
      const isKalemiDoc = await getDoc(isKalemiRef);
      
      if (isKalemiDoc.exists()) {
        const mevcutData = isKalemiDoc.data();
        
        // Yeşil defter verilerini koru
        const guncelData = {
          ...isKalemi,
          // Mevcut yeşil defter verilerini koru
          buAy: mevcutData.buAy || 0,
          gecenAy: mevcutData.gecenAy || 0,
          oncekiAylarToplami: mevcutData.oncekiAylarToplami || 0,
          toplamYapilan: mevcutData.toplamYapilan || 0,
          // Gerçekleşme oranını yeni miktara göre güncelle
          gerceklesmeOrani: mevcutData.toplamYapilan ? 
            Number(((mevcutData.toplamYapilan / isKalemi.miktar) * 100).toFixed(2)) : 0,
          guncellemeTarihi: serverTimestamp(),
          guncelleyenKullanici: currentUser.uid
        };

        await updateDoc(isKalemiRef, guncelData);
        
        // İş kalemlerini yeniden yükle
        await fetchIsKalemleri();
        enqueueSnackbar('İş kalemi başarıyla güncellendi', { variant: 'success' });
      }
    } catch (error) {
      console.error('İş kalemi güncellenirken hata:', error);
      enqueueSnackbar('İş kalemi güncellenirken bir hata oluştu', { variant: 'error' });
    }
  };

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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{
        bgcolor: isDarkMode ? 'background.paper' : '#fff',
        boxShadow: 3,
        borderRadius: 2,
        mb: 3
      }}>
        <CardContent>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              sx={{
                '& .MuiTab-root': {
                  fontSize: '1rem',
                  textTransform: 'none'
                }
              }}
            >
              <Tab label="Sözleşme Bilgileri" />
              <Tab label="Birim Fiyatlar" />
            </Tabs>
          </Box>

          {/* Sözleşme Bilgileri Tab */}
          {activeTab === 0 && (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Temel Bilgiler */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Temel Bilgiler
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Sözleşme No"
                    name="sozlesmeNo"
                    value={formData.sozlesmeNo}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Sözleşme Adı"
                    value={formData.sozlesmeAdi}
                    onChange={handleInputChange('sozlesmeAdi')}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Sözleşme Türü</InputLabel>
                    <Select
                      value={formData.sozlesmeTuru}
                      onChange={handleInputChange('sozlesmeTuru')}
                    >
                      <MenuItem value="birimFiyat">Birim Fiyat</MenuItem>
                      <MenuItem value="gotureBedel">Götüre Bedel</MenuItem>
                      <MenuItem value="maliyetKar">Maliyet + Kâr</MenuItem>
                      <MenuItem value="karma">Karma</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Şantiye ve Taşeron Seçimi */}
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={santiyeler}
                    getOptionLabel={(option) => option.ad || ''}
                    value={formData.santiye}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        santiye: newValue
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Şantiye"
                        required
                        error={!formData.santiye && formData.santiye === null}
                        helperText={!formData.santiye && formData.santiye === null ? 'Şantiye seçimi zorunludur' : ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={taseronlar}
                    getOptionLabel={(option) => option.unvan || ''}
                    value={formData.taseron}
                    onChange={(event, newValue) => {
                      setFormData(prev => ({
                        ...prev,
                        taseron: newValue
                      }));
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Taşeron"
                        required
                        error={!formData.taseron && formData.taseron === null}
                        helperText={!formData.taseron && formData.taseron === null ? 'Taşeron seçimi zorunludur' : ''}
                      />
                    )}
                  />
                </Grid>

                {/* Tarih Bilgileri */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Sözleşme Tarihi"
                    value={formatDateForInput(formData.sozlesmeTarihi)}
                    onChange={handleDateChange('sozlesmeTarihi')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Başlangıç Tarihi"
                    value={formatDateForInput(formData.baslangicTarihi)}
                    onChange={handleDateChange('baslangicTarihi')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Bitiş Tarihi"
                    value={formatDateForInput(formData.bitisTarihi)}
                    onChange={handleDateChange('bitisTarihi')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                {/* Finansal Bilgiler */}
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Toplam Bedel"
                    value={formData.toplamBedel}
                    onChange={handleInputChange('toplamBedel')}
                    InputProps={{
                      endAdornment: formData.paraBirimi
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Teminat Oranı (%)"
                    value={formData.teminatOrani}
                    onChange={handleInputChange('teminatOrani')}
                    InputProps={{
                      endAdornment: '%'
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Para Birimi</InputLabel>
                    <Select
                      value={formData.paraBirimi}
                      onChange={handleInputChange('paraBirimi')}
                    >
                      <MenuItem value="TRY">TRY</MenuItem>
                      <MenuItem value="USD">USD</MenuItem>
                      <MenuItem value="EUR">EUR</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Diğer Bilgiler */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Açıklama"
                    value={formData.aciklama}
                    onChange={handleInputChange('aciklama')}
                  />
                </Grid>

                {/* Dosya Yükleme */}
                <Grid item xs={12}>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="sozlesme-dosya"
                  />
                  <label htmlFor="sozlesme-dosya">
                    <Button
                      variant="contained"
                      component="span"
                      sx={{ mr: 2 }}
                    >
                      Dosya Seç
                    </Button>
                  </label>
                  {selectedFile && (
                    <Typography variant="body2" component="span">
                      Seçilen dosya: {selectedFile.name}
                    </Typography>
                  )}
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/sozlesme')}
                  disabled={saving}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    bgcolor: sidebarColor,
                    '&:hover': {
                      bgcolor: alpha(sidebarColor, 0.8)
                    }
                  }}
                >
                  {saving ? <CircularProgress size={24} /> : 'Kaydet'}
                </Button>
              </Box>
            </form>
          )}

          {/* Birim Fiyatlar Tab */}
          {activeTab === 1 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Poz No"
                    name="pozNo"
                    value={yeniIsKalemi.pozNo}
                    onChange={(e) => setYeniIsKalemi({ ...yeniIsKalemi, pozNo: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Tanım"
                    name="tanim"
                    value={yeniIsKalemi.tanim}
                    onChange={(e) => setYeniIsKalemi({ ...yeniIsKalemi, tanim: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Birim"
                    name="birim"
                    value={yeniIsKalemi.birim}
                    onChange={(e) => setYeniIsKalemi({ ...yeniIsKalemi, birim: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Birim Fiyat"
                    name="birimFiyat"
                    type="number"
                    value={yeniIsKalemi.birimFiyat}
                    onChange={(e) => setYeniIsKalemi({ ...yeniIsKalemi, birimFiyat: e.target.value })}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">{formData.paraBirimi}</InputAdornment>
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <TextField
                    fullWidth
                    label="Miktar"
                    name="miktar"
                    type="number"
                    value={yeniIsKalemi.miktar}
                    onChange={(e) => setYeniIsKalemi({ ...yeniIsKalemi, miktar: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleIsKalemiKaydet}
                    sx={{
                      height: '56px',
                      bgcolor: sidebarColor,
                      '&:hover': {
                        bgcolor: alpha(sidebarColor, 0.8)
                      }
                    }}
                  >
                    {duzenlemeModu ? 'Güncelle' : 'Ekle'}
                  </Button>
                </Grid>
              </Grid>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Poz No</TableCell>
                      <TableCell>Tanım</TableCell>
                      <TableCell>Birim</TableCell>
                      <TableCell>Birim Fiyat</TableCell>
                      <TableCell>Miktar</TableCell>
                      <TableCell>Tutar</TableCell>
                      <TableCell>İşlemler</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isKalemleri.map((isKalemi) => (
                      <TableRow key={isKalemi.id}>
                        <TableCell>{isKalemi.pozNo}</TableCell>
                        <TableCell>{isKalemi.tanim}</TableCell>
                        <TableCell>{isKalemi.birim}</TableCell>
                        <TableCell>{isKalemi.birimFiyat} {formData.paraBirimi}</TableCell>
                        <TableCell>{isKalemi.miktar}</TableCell>
                        <TableCell>{(isKalemi.birimFiyat * isKalemi.miktar).toFixed(2)} {formData.paraBirimi}</TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleIsKalemiDuzenle(isKalemi)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleIsKalemiSil(isKalemi.id)}>
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SozlesmeForm;   