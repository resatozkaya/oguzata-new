import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  TextField,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Container,
  Paper,
  Alert,
  IconButton,
  CircularProgress,
  Autocomplete
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { tr } from 'date-fns/locale';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { personnelService, getUniqueCompanyNames } from '../services/personnelService';
import { constructionSiteService } from '../services/constructionSiteService';

const BLOOD_TYPES = ['A Rh+', 'A Rh-', 'B Rh+', 'B Rh-', 'AB Rh+', 'AB Rh-', '0 Rh+', '0 Rh-'];

const PersonelKayit = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    // Kişisel Bilgiler
    ad: '',
    soyad: '',
    tcNo: '',
    dogumTarihi: null,
    telefon: '',
    email: '',
    adres: '',
    kanGrubu: '',
    acilDurumKisi: {
      ad: '',
      telefon: '',
      yakinlik: '',
    },

    // İş Bilgileri
    calismaSekli: '',
    departman: '',
    baslangicTarihi: null,
    santiye: '',
    maas: '',
    sigorta: true,
    aktif: true,

    // Belgeler
    ehliyet: '',
    sertifikalar: [],
    foto: null,
    fotoUrl: null,

    // Notlar
    notlar: '',
    firmaAdi: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const [constructionSites, setConstructionSites] = useState([]);
  const [companies, setCompanies] = useState([]);

  // Eğer id varsa, personel bilgilerini getir
  useEffect(() => {
    const loadPersonnel = async () => {
      if (id && id !== 'yeni') { // Sadece id varsa ve 'yeni' değilse yükle
        try {
          setLoading(true);
          const personnel = await personnelService.getPersonnelById(id);
          console.log("Yüklenen personel bilgileri:", personnel);
          
          if (personnel) {
            // Tarih dönüşüm fonksiyonu
            const convertToDate = (dateValue) => {
              if (!dateValue) return null;
              // Eğer timestamp ise
              if (dateValue?.seconds) {
                return new Date(dateValue.seconds * 1000);
              }
              // Eğer ISO string ise
              if (typeof dateValue === 'string') {
                return new Date(dateValue);
              }
              // Eğer zaten Date objesi ise
              if (dateValue instanceof Date) {
                return dateValue;
              }
              return null;
            };

            setFormData(prevData => ({
              ...prevData,
              // Kişisel Bilgiler
              ad: personnel.ad || '',
              soyad: personnel.soyad || '',
              tcNo: personnel.tcNo || '',
              telefon: personnel.telefon || '',
              email: personnel.email || '',
              adres: personnel.adres || personnel.address || '',
              kanGrubu: personnel.kanGrubu || personnel.bloodType || '',
              firmaAdi: personnel.firmaAdi || personnel.firma || '',
              
              // İş Bilgileri
              calismaSekli: personnel.calismaSekli || personnel.calisma_sekli || '',
              departman: personnel.departman || personnel.department || '',
              santiye: personnel.santiye || personnel.constructionSite || '',
              maas: personnel.maas || personnel.salary || '',
              
              // Tarih Bilgileri
              dogumTarihi: convertToDate(personnel.dogumTarihi || personnel.birthDate),
              baslangicTarihi: convertToDate(personnel.baslangicTarihi || personnel.startDate),
              
              // Durum Bilgileri
              sigorta: personnel.sigorta ?? personnel.hasInsurance ?? true,
              aktif: personnel.aktif ?? personnel.isActive ?? true,
              
              // Acil Durum İletişim
              acilDurumKisi: {
                ad: personnel.acilDurumKisi?.ad || personnel.emergencyContact?.name || '',
                telefon: personnel.acilDurumKisi?.telefon || personnel.emergencyContact?.phone || '',
                yakinlik: personnel.acilDurumKisi?.yakinlik || personnel.emergencyContact?.relation || ''
              },
              
              notlar: personnel.notlar || personnel.notes || ''
            }));
            
            console.log("Form verileri güncellendi:", formData);
          } else {
            setError('Personel bulunamadı');
            navigate('/personel');
          }
        } catch (error) {
          console.error('Personel yüklenirken hata:', error);
          setError('Personel bilgileri yüklenirken hata oluştu');
        } finally {
          setLoading(false);
        }
      }
    };

    loadPersonnel();
  }, [id, navigate]);

  // Şantiye listesini yükle
  useEffect(() => {
    const loadConstructionSites = async () => {
      try {
        const sites = await constructionSiteService.getActiveConstructionSites();
        console.log('Loaded construction sites:', sites);
        setConstructionSites(sites);
      } catch (err) {
        console.error('Error loading construction sites:', err);
        setError('Şantiye listesi yüklenirken bir hata oluştu');
      }
    };

    loadConstructionSites();
  }, []);

  // Firma adlarını yükle
  useEffect(() => {
    getUniqueCompanyNames()
      .then(companyNames => setCompanies(companyNames))
      .catch(error => console.error('Error loading companies:', error));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmergencyContactChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      acilDurumKisi: {
        ...prev.acilDurumKisi,
        [name]: value
      }
    }));
  };

  const handleDateChange = (date, field) => {
    setFormData(prev => ({
      ...prev,
      [field]: date
    }));
  };

  // Dosyayı base64'e çevir
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Fotoğraf yükleme işlemi
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Dosya boyutu kontrolü (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Fotoğraf boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      // Dosya tipi kontrolü
      if (!file.type.startsWith('image/')) {
        setError('Lütfen geçerli bir resim dosyası seçin');
        return;
      }

      try {
        // Dosyayı base64'e çevir
        const base64String = await fileToBase64(file);
        
        setFormData(prev => ({
          ...prev,
          foto: base64String,
          fotoUrl: URL.createObjectURL(file) // Önizleme için
        }));
      } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        setError('Fotoğraf yüklenirken bir hata oluştu');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Form validasyonu
      if (!formData.ad || !formData.soyad || !formData.tcNo) {
        setError('Lütfen zorunlu alanları doldurun');
        return;
      }

      // Önizleme URL'ini formdan çıkar
      const { fotoUrl, ...dataToSave } = formData;

      if (id && id !== 'yeni') {
        // Mevcut personeli güncelle
        await personnelService.updatePersonnel(id, {
          ...dataToSave,
          updatedAt: new Date().toISOString()
        });
        setSuccess('Personel başarıyla güncellendi');
      } else {
        // Yeni personel ekle
        await personnelService.addPersonnel({
          ...dataToSave,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        setSuccess('Personel başarıyla kaydedildi');
      }

      // 2 saniye sonra listeye dön
      setTimeout(() => {
        navigate('/personel');
      }, 2000);

    } catch (error) {
      console.error('Kayıt hatası:', error);
      setError('Kayıt sırasında bir hata oluştu: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {id ? 'Personel Düzenle' : 'Yeni Personel Kaydı'}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/personel')}
              variant="outlined"
            >
              Geri Dön
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : (id && id !== 'yeni' ? 'Güncelle' : 'Kaydet')}
            </Button>
          </Box>
          <Grid container spacing={3}>
            {/* Kişisel Bilgiler */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Kişisel Bilgiler
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ad"
                name="ad"
                value={formData.ad}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Soyad"
                name="soyad"
                value={formData.soyad}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="TC Kimlik No *"
                name="tcNo"
                value={formData.tcNo}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DatePicker
                  label="Doğum Tarihi"
                  value={formData.dogumTarihi}
                  onChange={(newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      dogumTarihi: newValue
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefon"
                name="telefon"
                value={formData.telefon}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="E-posta"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Adres"
                name="adres"
                multiline
                rows={2}
                value={formData.adres}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Kan Grubu</InputLabel>
                <Select
                  name="kanGrubu"
                  value={formData.kanGrubu}
                  onChange={handleChange}
                  label="Kan Grubu"
                >
                  {BLOOD_TYPES.map(type => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Autocomplete
                freeSolo
                options={companies}
                value={formData.firmaAdi || ''}
                onChange={(event, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    firmaAdi: newValue
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    label="Firma Adı"
                    name="firmaAdi"
                  />
                )}
              />
            </Grid>

            {/* Acil Durum İletişim */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Acil Durum İletişim
              </Typography>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="ad"
                value={formData.acilDurumKisi.ad}
                onChange={handleEmergencyContactChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Telefon"
                name="telefon"
                value={formData.acilDurumKisi.telefon}
                onChange={handleEmergencyContactChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Yakınlık"
                name="yakinlik"
                value={formData.acilDurumKisi.yakinlik}
                onChange={handleEmergencyContactChange}
              />
            </Grid>

            {/* İş Bilgileri */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                İş Bilgileri
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Çalışma Şekli *</InputLabel>
                <Select
                  name="calismaSekli"
                  value={formData.calismaSekli}
                  onChange={handleChange}
                  label="Çalışma Şekli *"
                  required
                >
                  <MenuItem value="">Seçiniz</MenuItem>
                  <MenuItem value="MAAŞLI ÇALIŞAN">Maaşlı Çalışan</MenuItem>
                  <MenuItem value="YEVMİYE ÇALIŞAN">Yevmiye Çalışan</MenuItem>
                  <MenuItem value="TAŞERON">Taşeron</MenuItem>
                  <MenuItem value="TAŞERON ÇALIŞANI">Taşeron Çalışanı</MenuItem>
                  <MenuItem value="ESNAF">Esnaf</MenuItem>
                  <MenuItem value="DİĞER">Diğer</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Departman"
                name="departman"
                value={formData.departman}
                onChange={handleChange}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
                <DatePicker
                  label="İşe Başlama Tarihi"
                  value={formData.baslangicTarihi}
                  onChange={(newValue) => {
                    setFormData(prev => ({
                      ...prev,
                      baslangicTarihi: newValue
                    }));
                  }}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Şantiye</InputLabel>
                <Select
                  name="santiye"
                  value={formData.santiye}
                  onChange={handleChange}
                  label="Şantiye"
                >
                  <MenuItem value="">
                    <em>Seçiniz</em>
                  </MenuItem>
                  {constructionSites.map((site) => (
                    <MenuItem key={site.id} value={site.id}>
                      {site.ad} {/* Firestore'daki alan adı 'ad' */}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Maaş"
                name="maas"
                type="number"
                value={formData.maas}
                onChange={handleChange}
              />
            </Grid>

            {/* Fotoğraf Yükleme */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Fotoğraf
              </Typography>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="photo-upload"
                type="file"
                onChange={handlePhotoChange}
              />
              <label htmlFor="photo-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<PhotoCamera />}
                >
                  Fotoğraf Yükle
                </Button>
              </label>
              {formData.fotoUrl && (
                <Box mt={2} display="flex" flexDirection="column" alignItems="center">
                  <img 
                    src={formData.fotoUrl} 
                    alt="Personel fotoğrafı" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '200px', 
                      objectFit: 'cover',
                      borderRadius: '4px'
                    }} 
                  />
                  <Typography variant="caption" display="block" mt={1}>
                    Seçilen fotoğraf
                  </Typography>
                </Box>
              )}
            </Grid>

            {/* Notlar */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notlar"
                name="notlar"
                multiline
                rows={4}
                value={formData.notlar}
                onChange={handleChange}
              />
            </Grid>

          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default PersonelKayit;
