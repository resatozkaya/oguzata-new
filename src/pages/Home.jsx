import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Chip,
  IconButton,
  CardActions,
  Button,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import BusinessIcon from '@mui/icons-material/Business';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import defaultImage from '../assets/default-santiye.jpg';

const Home = () => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSantiyeler();
  }, []);

  const fetchSantiyeler = async () => {
    try {
      const q = query(collection(db, 'santiyeler'), orderBy('olusturmaTarihi', 'desc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSantiyeler(data);
    } catch (error) {
      console.error('Şantiyeler yüklenirken hata:', error);
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

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        Şantiyeler
      </Typography>

      <Grid container spacing={3}>
        {santiyeler.map((santiye) => (
          <Grid item xs={12} sm={6} md={4} key={santiye.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardMedia
                component="img"
                height="200"
                image={santiye.resimUrl || defaultImage}
                alt={santiye.ad}
                sx={{ objectFit: 'cover' }}
              />
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {santiye.ad}
                  </Typography>
                  <Chip
                    label={santiye.durum}
                    color={getDurumRenk(santiye.durum)}
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <BusinessIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  {santiye.adres}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Şantiye Şefi: {santiye.santiyeSefi}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  Proje Müdürü: {santiye.projeMuduru}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                  <CalendarTodayIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
                  {formatTarih(santiye.baslangicTarihi)} - {formatTarih(santiye.bitisTarihi)}
                </Typography>
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => navigate(`/santiye/${santiye.id}`)}
                >
                  Detaylar
                </Button>
                <IconButton
                  size="small"
                  onClick={() => navigate('/santiye', { state: { editData: santiye } })}
                >
                  <EditIcon />
                </IconButton>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Home;
