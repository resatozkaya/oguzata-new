import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import trLocale from 'date-fns/locale/tr';

const BirimFiyatForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [santiyeler, setSantiyeler] = useState([]);
  const [taseronlar, setTaseronlar] = useState([]);
  const [formData, setFormData] = useState({
    pozNo: '',
    isKalemi: '',
    birim: '',
    birimFiyat: '',
    santiyeId: '',
    taseronId: '',
    gecerlilikTarihi: null,
    aciklama: ''
  });

  useEffect(() => {
    fetchSantiyeler();
    fetchTaseronlar();
    if (id) {
      fetchBirimFiyat();
    }
  }, [id]);

  const fetchSantiyeler = async () => {
    try {
      const q = query(collection(db, 'santiyeler'));
      const querySnapshot = await getDocs(q);
      const santiyeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => a.ad.localeCompare(b.ad));
      
      setSantiyeler(santiyeList);
    } catch (error) {
      console.error('Şantiyeler yüklenirken hata:', error);
    }
  };

  const fetchTaseronlar = async () => {
    try {
      const q = query(
        collection(db, 'personeller'),
        where('calismaSekli', '==', 'TAŞERON')
      );
      const querySnapshot = await getDocs(q);
      
      const firmaGrubu = {};
      querySnapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (!firmaGrubu[data.firma]) {
          firmaGrubu[data.firma] = data;
        }
      });
      
      const uniqueTaseronlar = Object.values(firmaGrubu)
        .sort((a, b) => a.firma.localeCompare(b.firma));
      
      setTaseronlar(uniqueTaseronlar);
    } catch (error) {
      console.error('Taşeronlar yüklenirken hata:', error);
    }
  };

  const fetchBirimFiyat = async () => {
    try {
      const birimFiyatDoc = await getDoc(doc(db, 'birimFiyatlar', id));
      if (birimFiyatDoc.exists()) {
        const data = birimFiyatDoc.data();
        setFormData({
          ...data,
          gecerlilikTarihi: data.gecerlilikTarihi?.toDate()
        });
      }
    } catch (error) {
      console.error('Birim fiyat yüklenirken hata:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Seçilen şantiye ve taşeron bilgilerini bulalım
      const seciliSantiye = santiyeler.find(s => s.id === formData.santiyeId);
      const seciliTaseron = taseronlar.find(t => t.id === formData.taseronId);

      const birimFiyatData = {
        ...formData,
        santiyeAdi: seciliSantiye?.ad || '',
        taseronAdi: seciliTaseron?.firma || '',
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date()
      };

      if (id) {
        await updateDoc(doc(db, 'birimFiyatlar', id), birimFiyatData);
      } else {
        const docRef = doc(collection(db, 'birimFiyatlar'));
        await setDoc(docRef, birimFiyatData);
      }

      navigate('/birim-fiyatlar');
    } catch (error) {
      console.error('Birim fiyat kaydedilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const birimler = [
    'm²',
    'm³',
    'mt',
    'kg',
    'ton',
    'adet',
    'takım',
    'paket'
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {id ? 'Birim Fiyat Düzenle' : 'Yeni Birim Fiyat'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Poz No"
                name="pozNo"
                value={formData.pozNo}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="İş Kalemi"
                name="isKalemi"
                value={formData.isKalemi}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Birim</InputLabel>
                <Select
                  name="birim"
                  value={formData.birim}
                  onChange={handleChange}
                >
                  {birimler.map((birim) => (
                    <MenuItem key={birim} value={birim}>
                      {birim}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Birim Fiyat (TL)"
                name="birimFiyat"
                type="number"
                value={formData.birimFiyat}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Şantiye</InputLabel>
                <Select
                  name="santiyeId"
                  value={formData.santiyeId}
                  onChange={handleChange}
                >
                  {santiyeler.map((santiye) => (
                    <MenuItem key={santiye.id} value={santiye.id}>
                      {santiye.ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Taşeron</InputLabel>
                <Select
                  name="taseronId"
                  value={formData.taseronId}
                  onChange={handleChange}
                >
                  {taseronlar.map((taseron) => (
                    <MenuItem key={taseron.id} value={taseron.id}>
                      {taseron.firma}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Geçerlilik Tarihi"
                  value={formData.gecerlilikTarihi}
                  onChange={(newValue) => handleDateChange('gecerlilikTarihi', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Açıklama"
                name="aciklama"
                value={formData.aciklama}
                onChange={handleChange}
                multiline
                rows={4}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/birim-fiyatlar')}
                >
                  İptal
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Kaydediliyor...' : (id ? 'Güncelle' : 'Kaydet')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
};

export default BirimFiyatForm;
