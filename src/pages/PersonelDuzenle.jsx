import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { personnelService } from '../services/personnelService';
import { constructionSiteService } from '../services/constructionSiteService';
import {
  Box,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  CircularProgress,
  Alert,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import trLocale from 'date-fns/locale/tr';

const PersonelDuzenle = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ad: '',
    soyad: '',
    tcNo: '',
    telefon: '',
    email: '',
    adres: '',
    kanGrubu: '',
    calismaSekli: '',
    departman: '',
    santiye: '',
    iseBaslamaTarihi: null,
    aktif: true,
    sigortali: true,
    notlar: ''
  });
  const [constructionSites, setConstructionSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // Personel bilgilerini getir
        const personnelData = await personnelService.getPersonnelById(id);
        if (personnelData) {
          setFormData(personnelData);
        } else {
          setError('Personel bulunamadı');
        }

        // Şantiyeleri getir
        const sites = await constructionSiteService.getAllConstructionSites();
        setConstructionSites(sites);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Veriler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      iseBaslamaTarihi: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await personnelService.updatePersonnel(id, formData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/personel-listesi');
      }, 2000);
    } catch (err) {
      console.error('Error updating personnel:', err);
      setError('Personel güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, m: 3 }}>
      <Typography variant="h6" gutterBottom>
        Personel Düzenle
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>Personel başarıyla güncellendi</Alert>}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={2}>
          {/* Kişisel Bilgiler */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Kişisel Bilgiler
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Ad"
              name="ad"
              value={formData.ad}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
              label="TC Kimlik No"
              name="tcNo"
              value={formData.tcNo}
              onChange={handleChange}
              required
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Telefon"
              name="telefon"
              value={formData.telefon}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
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
              rows={3}
              value={formData.adres}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Kan Grubu</InputLabel>
              <Select
                name="kanGrubu"
                value={formData.kanGrubu}
                onChange={handleChange}
                label="Kan Grubu"
              >
                <MenuItem value="">Seçiniz</MenuItem>
                <MenuItem value="A+">A Rh+</MenuItem>
                <MenuItem value="A-">A Rh-</MenuItem>
                <MenuItem value="B+">B Rh+</MenuItem>
                <MenuItem value="B-">B Rh-</MenuItem>
                <MenuItem value="AB+">AB Rh+</MenuItem>
                <MenuItem value="AB-">AB Rh-</MenuItem>
                <MenuItem value="0+">0 Rh+</MenuItem>
                <MenuItem value="0-">0 Rh-</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* İş Bilgileri */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              İş Bilgileri
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Çalışma Şekli</InputLabel>
              <Select
                name="calismaSekli"
                value={formData.calismaSekli}
                onChange={handleChange}
                label="Çalışma Şekli"
                required
              >
                <MenuItem value="">Seçiniz</MenuItem>
                <MenuItem value="MAAŞLI ÇALIŞAN">Maaşlı Çalışan</MenuItem>
                <MenuItem value="GÜNLÜK YEVMIYE">Günlük Yevmiye</MenuItem>
                <MenuItem value="ALCI BOYA USTASI">Alçı Boya Ustası</MenuItem>
                <MenuItem value="FORMEN">Formen</MenuItem>
                <MenuItem value="ŞÖFÖR">Şöför</MenuItem>
                <MenuItem value="TEKNİK PERSONEL">Teknik Personel</MenuItem>
                <MenuItem value="BEKÇI">Bekçi</MenuItem>
                <MenuItem value="USTA">Usta</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Departman"
              name="departman"
              value={formData.departman}
              onChange={handleChange}
            />
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
                <MenuItem value="">Seçiniz</MenuItem>
                {constructionSites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
              <DatePicker
                label="İşe Başlama Tarihi"
                value={formData.iseBaslamaTarihi ? new Date(formData.iseBaslamaTarihi) : null}
                onChange={handleDateChange}
                renderInput={(params) => <TextField {...params} fullWidth />}
              />
            </LocalizationProvider>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.aktif}
                    onChange={(e) => setFormData(prev => ({ ...prev, aktif: e.target.checked }))}
                    color="success"
                  />
                }
                label={formData.aktif ? "Aktif" : "Pasif"}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.sigortali}
                    onChange={(e) => setFormData(prev => ({ ...prev, sigortali: e.target.checked }))}
                    color="primary"
                  />
                }
                label={formData.sigortali ? "Sigortalı" : "Sigortasız"}
              />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Notlar"
              name="notlar"
              multiline
              rows={3}
              value={formData.notlar}
              onChange={handleChange}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/personel-listesi')}
              >
                İptal
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Kaydet'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PersonelDuzenle;
