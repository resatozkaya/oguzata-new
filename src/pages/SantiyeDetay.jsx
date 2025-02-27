import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  Button,
  Grid,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditIcon from '@mui/icons-material/Edit';
import defaultImage from '../assets/default-santiye.jpg';

const SantiyeDetay = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [santiye, setSantiye] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedBlok, setSelectedBlok] = useState('B');  // Varsayılan blok

  useEffect(() => {
    fetchSantiye();
  }, [id]);

  const fetchSantiye = async () => {
    try {
      const santiyeDoc = await getDoc(doc(db, 'santiyeler', id));
      if (santiyeDoc.exists()) {
        setSantiye({ id: santiyeDoc.id, ...santiyeDoc.data() });
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Şantiye bilgileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDurumRenk = (durum) => {
    switch (durum) {
      case 'Devam Ediyor':
        return 'success';
      case 'Tamamlandı':
        return 'primary';
      case 'Beklemede':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatTarih = (tarih) => {
    if (!tarih) return '';
    return new Date(tarih).toLocaleDateString('tr-TR');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!santiye) {
    return null;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Geri Dön
        </Button>
        <Button
          startIcon={<EditIcon />}
          variant="contained"
          onClick={() => navigate('/santiye', { state: { editData: santiye } })}
        >
          Düzenle
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="400"
              image={santiye.resimUrl || defaultImage}
              alt={santiye.ad}
              sx={{ objectFit: 'cover' }}
            />
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h4">
                {santiye.ad}
              </Typography>
              <Chip
                label={santiye.durum}
                color={getDurumRenk(santiye.durum)}
                sx={{ ml: 2 }}
              />
            </Box>

            <Typography variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <BusinessIcon sx={{ mr: 1 }} />
              {santiye.adres}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Şantiye Şefi: {santiye.santiyeSefi}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <PersonIcon sx={{ mr: 1 }} />
              Proje Müdürü: {santiye.projeMuduru}
            </Typography>

            <Typography variant="body1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              Başlangıç: {formatTarih(santiye.baslangicTarihi)}
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
              <CalendarTodayIcon sx={{ mr: 1 }} />
              Bitiş: {formatTarih(santiye.bitisTarihi)}
            </Typography>

            {santiye.notlar && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Notlar
                </Typography>
                <Typography variant="body1">
                  {santiye.notlar}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel>Blok Seç</InputLabel>
                <Select
                  value={selectedBlok}
                  label="Blok Seç"
                  onChange={(e) => setSelectedBlok(e.target.value)}
                >
                  <MenuItem value="A">A Blok</MenuItem>
                  <MenuItem value="B">B Blok</MenuItem>
                  <MenuItem value="C">C Blok</MenuItem>
                </Select>
              </FormControl>

              <Button 
                onClick={() => navigate(`/santiye/${id}/blok/${selectedBlok}/eksiklikler`)}
                variant="contained"
                color="primary"
              >
                Eksiklik Yönetimi
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SantiyeDetay;
