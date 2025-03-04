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
  Typography,
  FormHelperText
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../config/firebase';
import trLocale from 'date-fns/locale/tr';

const SozlesmeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [taseronlar, setTaseronlar] = useState([]);
  const [santiyeler, setSantiyeler] = useState([]);
  const [formData, setFormData] = useState({
    sozlesmeNo: '',
    santiyeId: '',
    taseronId: '',
    isTanimi: '',
    sozlesmeTipi: 'birimFiyat',
    tutar: '',
    baslangicTarihi: null,
    bitisTarihi: null,
    birimFiyatlar: [],
    durum: 'aktif',
    aciklama: ''
  });

  useEffect(() => {
    fetchTaseronlar();
    fetchSantiyeler();
    if (id) {
      fetchSozlesme();
    }
  }, [id]);

  const fetchTaseronlar = async () => {
    try {
      const q = query(
        collection(db, 'personeller'),
        where('calismaSekli', '==', 'TAŞERON')
      );
      const querySnapshot = await getDocs(q);
      
      // Firma bazında gruplama yapalım
      const firmaGrubu = {};
      querySnapshot.docs.forEach(doc => {
        const data = { id: doc.id, ...doc.data() };
        if (!firmaGrubu[data.firma]) {
          firmaGrubu[data.firma] = data;
        }
      });
      
      // Gruplanan verileri diziye çevirip sıralayalım
      const uniqueTaseronlar = Object.values(firmaGrubu)
        .sort((a, b) => a.firma.localeCompare(b.firma));
      
      setTaseronlar(uniqueTaseronlar);
    } catch (error) {
      console.error('Taşeronlar yüklenirken hata:', error);
    }
  };

  const fetchSantiyeler = async () => {
    try {
      const q = query(collection(db, 'santiyeler'));
      const querySnapshot = await getDocs(q);
      const santiyeList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      .sort((a, b) => a.ad.localeCompare(b.ad)); // Şantiyeleri ada göre sıralayalım
      
      setSantiyeler(santiyeList);
    } catch (error) {
      console.error('Şantiyeler yüklenirken hata:', error);
    }
  };

  const fetchSozlesme = async () => {
    try {
      const sozlesmeDoc = await getDoc(doc(db, 'sozlesmeler', id));
      if (sozlesmeDoc.exists()) {
        const data = sozlesmeDoc.data();
        setFormData({
          ...data,
          baslangicTarihi: data.baslangicTarihi?.toDate(),
          bitisTarihi: data.bitisTarihi?.toDate()
        });
      }
    } catch (error) {
      console.error('Sözleşme yüklenirken hata:', error);
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

      console.log('Seçilen Şantiye:', seciliSantiye);
      console.log('Seçilen Taşeron:', seciliTaseron);

      const sozlesmeData = {
        ...formData,
        santiyeAdi: seciliSantiye?.ad || '',
        taseronAdi: seciliTaseron?.firma || '',
        olusturmaTarihi: new Date(),
        guncellemeTarihi: new Date()
      };

      console.log('Kaydedilecek Sözleşme Verisi:', sozlesmeData);

      if (id) {
        await updateDoc(doc(db, 'sozlesmeler', id), sozlesmeData);
      } else {
        const docRef = doc(collection(db, 'sozlesmeler'));
        await setDoc(docRef, sozlesmeData);
      }

      navigate('/sozlesme');
    } catch (error) {
      console.error('Sözleşme kaydedilirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          {id ? 'Sözleşme Düzenle' : 'Yeni Sözleşme'}
        </Typography>

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sözleşme No"
                name="sozlesmeNo"
                value={formData.sozlesmeNo}
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
              <FormControl fullWidth>
                <InputLabel>Sözleşme Tipi</InputLabel>
                <Select
                  name="sozlesmeTipi"
                  value={formData.sozlesmeTipi}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="birimFiyat">Birim Fiyat</MenuItem>
                  <MenuItem value="goturu">Götürü Bedel</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="İş Tanımı"
                name="isTanimi"
                value={formData.isTanimi}
                onChange={handleChange}
                multiline
                rows={3}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Tutar (TL)"
                name="tutar"
                type="number"
                value={formData.tutar}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Durum</InputLabel>
                <Select
                  name="durum"
                  value={formData.durum}
                  onChange={handleChange}
                  required
                >
                  <MenuItem value="aktif">Aktif</MenuItem>
                  <MenuItem value="pasif">Pasif</MenuItem>
                  <MenuItem value="beklemede">Beklemede</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Başlangıç Tarihi"
                  value={formData.baslangicTarihi}
                  onChange={(newValue) => handleDateChange('baslangicTarihi', newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth required />}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={trLocale}>
                <DatePicker
                  label="Bitiş Tarihi"
                  value={formData.bitisTarihi}
                  onChange={(newValue) => handleDateChange('bitisTarihi', newValue)}
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
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/sozlesme')}
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

export default SozlesmeForm;
