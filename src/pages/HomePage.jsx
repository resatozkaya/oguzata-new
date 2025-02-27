import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  IconButton,
  CircularProgress,
  Modal,
  Chip,
  Dialog,
  DialogContent,
  Card,
  CardContent,
  Button,
  LinearProgress
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useTheme } from '../contexts/ThemeContext';
import { alpha } from '@mui/material/styles';
import {
  Business as BusinessIcon,
  Group as GroupIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon
} from '@mui/icons-material';
import {
  collection, getDocs, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

const ImageModal = ({ open, handleClose, imageUrl }) => {
  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
    >
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        maxWidth: '90vw',
        maxHeight: '90vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        p: 1,
        borderRadius: 2,
      }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0, 0, 0, 0.5)',
            '&:hover': {
              bgcolor: 'rgba(0, 0, 0, 0.7)',
            },
          }}
        >
          <CloseIcon />
        </IconButton>
        <img 
          src={imageUrl} 
          alt="Şantiye Resmi"
          style={{
            maxWidth: '100%',
            maxHeight: '85vh',
            objectFit: 'contain',
            display: 'block'
          }}
        />
      </Box>
    </Modal>
  );
};

const StatCard = ({ label, value, icon, trend, trendUp, subtext, onClick }) => {
  const { sidebarColor, isDarkMode } = useTheme();
  
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        height: '100%',
        bgcolor: isDarkMode ? 'background.paper' : '#fff',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        border: 1,
        borderColor: isDarkMode ? 'background.paper' : alpha(sidebarColor, 0.1),
        '&:hover': {
          bgcolor: isDarkMode ? alpha(sidebarColor, 0.1) : alpha(sidebarColor, 0.05)
        }
      }}
      onClick={onClick}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box sx={{ 
          p: 1, 
          borderRadius: 1, 
          bgcolor: isDarkMode ? alpha(sidebarColor, 0.2) : alpha(sidebarColor, 0.1),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {icon}
        </Box>
        {trend && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: trendUp ? 'success.main' : 'error.main',
            color: '#fff',
            typography: 'caption'
          }}>
            {trendUp ? <ArrowUpwardIcon sx={{ fontSize: 14, mr: 0.5 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14, mr: 0.5 }} />}
            {trend}
          </Box>
        )}
      </Box>
      
      {value && (
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 'medium' }}>
          {value}
        </Typography>
      )}
      
      {label && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          {label}
        </Typography>
      )}

      {subtext && (
        <Typography variant="h5" color="text.primary" sx={{ mt: 'auto', textAlign: 'center' }}>
          {subtext}
        </Typography>
      )}
    </Paper>
  );
};

const ProjectCard = ({ santiye }) => {
  const { sidebarColor, isDarkMode } = useTheme();

  // İlerleme durumunu hesapla
  const progressValue = santiye.tamamlanmaOrani || 0;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        border: '2px solid #e0e0e0',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        '&:hover': {
          border: '2px solid #9c27b0',
          boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
          transform: 'translateY(-2px)',
          transition: 'all 0.3s ease'
        }
      }}
    >
      {santiye.resimUrl && (
        <Box
          component="img"
          src={santiye.resimUrl}
          alt={santiye.ad}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 60,
            height: 60,
            borderRadius: 1,
            objectFit: 'cover',
            border: 1,
            borderColor: 'divider'
          }}
        />
      )}

      <Box sx={{ p: 2, flexGrow: 1 }}>
        <Typography variant="h6" component="h3" gutterBottom>
          {santiye.ad}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Box component="span" sx={{ mr: 1 }}>
            <Chip
              label={santiye.personelSayisi} 
              color="primary"
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" gutterBottom>
          <strong>Proje Müdürü:</strong> {santiye.proje_muduru || '***'}
        </Typography>
        
        <Typography variant="body2" component="div" gutterBottom>
          <strong>Şantiye Şefi:</strong> {santiye.santiye_sefi || '***'}
        </Typography>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" gutterBottom>
            <strong>İlerleme Durumu:</strong>
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressValue}
            sx={{
              height: 8,
              borderRadius: 2,
              bgcolor: alpha(sidebarColor, 0.1),
              '& .MuiLinearProgress-bar': {
                bgcolor: progressValue >= 75 ? alpha(sidebarColor, 1) :
                         progressValue >= 50 ? alpha(sidebarColor, 0.8) :
                         alpha(sidebarColor, 0.6),
                borderRadius: 2
              }
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              Tamamlanan: {santiye.tamamlananEksiklik}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Toplam: {santiye.eksiklikSayisi}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              textAlign: 'right',
              mt: 0.5,
              color: 'text.secondary'
            }}
          >
            {`${Math.round(progressValue)}%`}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
          <Typography variant="body2" component="span">
            <strong>Durum:</strong>
          </Typography>
          <Chip
            label={santiye.durum || 'Aktif'}
            size="small"
            color={santiye.durum === 'Tamamlandı' ? 'success' : 
                   santiye.durum === 'Durduruldu' ? 'error' : 
                   santiye.durum === 'Beklemede' ? 'warning' : 'primary'}
          />
        </Box>
      </Box>
    </Card>
  );
};

const HomePage = () => {
  const [santiyeler, setSantiyeler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([]);
  const [personelStats, setPersonelStats] = useState({
    maasli: 0,
    yevmiye: 0,
    total: 0,
    santiyePersonel: {} // Her şantiye için personel sayısı
  });
  const { sidebarColor } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Şantiye verileri
        const santiyelerRef = collection(db, 'santiyeler');
        const santiyeSnapshot = await getDocs(santiyelerRef);
        const santiyelerData = santiyeSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          ad: doc.data().ad || doc.data().santiyeAdi || 'İsimsiz Şantiye',
          kod: doc.data().kod || doc.data().santiyeKodu || '-',
          adres: doc.data().adres || doc.data().santiyeAdresi || 'Adres belirtilmedi',
          proje_muduru: doc.data().projeMuduru || doc.data().proje_muduru || 'Proje müdürü belirtilmedi',
          santiye_sefi: doc.data().santiyeSefi || doc.data().santiye_sefi || 'Şantiye şefi belirtilmedi',
          resimUrl: doc.data().resimUrl || doc.data().resimler?.[0] || null,
          durum: doc.data().durum || 'Aktif'
        }));

        // Her şantiye için eksiklik verilerini al
        const santiyelerWithProgress = await Promise.all(santiyelerData.map(async (santiye) => {
          try {
            // Önce şantiyenin bloklarını al
            const bloklarRef = collection(db, 'santiyeler', santiye.id, 'bloklar');
            const bloklarSnapshot = await getDocs(bloklarRef);
            
            // Tüm bloklardaki eksiklikleri topla
            let toplamEksiklik = 0;
            let tamamlananEksiklik = 0;

            await Promise.all(bloklarSnapshot.docs.map(async (blokDoc) => {
              const eksikliklerRef = collection(db, 'santiyeler', santiye.id, 'bloklar', blokDoc.id, 'eksiklikler');
              const eksiklikSnapshot = await getDocs(eksikliklerRef);
              const eksiklikler = eksiklikSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
              }));
              
              toplamEksiklik += eksiklikler.length;
              // Durum kontrolünü düzeltelim
              tamamlananEksiklik += eksiklikler.filter(e => 
                e.durum?.toLowerCase() === 'tamamlandı' || 
                e.durum?.toLowerCase() === 'tamamlandi'
              ).length;

              console.log(`${santiye.ad} - ${blokDoc.id} bloğu:`, {
                toplamEksiklik: eksiklikler.length,
                tamamlananEksiklik: eksiklikler.filter(e => 
                  e.durum?.toLowerCase() === 'tamamlandı' || 
                  e.durum?.toLowerCase() === 'tamamlandi'
                ).length,
                eksiklikler: eksiklikler.map(e => ({
                  id: e.id,
                  durum: e.durum
                }))
              });
            }));

            // Tamamlanma oranını hesapla
            const tamamlanmaOrani = toplamEksiklik > 0 ? (tamamlananEksiklik / toplamEksiklik) * 100 : 0;

            console.log(`${santiye.ad} toplam:`, {
              toplamEksiklik,
              tamamlananEksiklik,
              tamamlanmaOrani
            });

            return {
              ...santiye,
              tamamlanmaOrani,
              eksiklikSayisi: toplamEksiklik,
              tamamlananEksiklik
            };
          } catch (error) {
            console.error(`${santiye.ad} için eksiklik verileri alınırken hata:`, error);
            return {
              ...santiye,
              tamamlanmaOrani: 0,
              eksiklikSayisi: 0,
              tamamlananEksiklik: 0
            };
          }
        }));

        // Personel verileri ve şantiye bazlı sayılar
        const personelRef = collection(db, 'personeller');
        const personelSnapshot = await getDocs(personelRef);
        let maasliCount = 0;
        let yevmiyeCount = 0;
        let santiyePersonel = {};

        personelSnapshot.forEach(doc => {
          const personel = doc.data();
          console.log("Personel:", {
            ad: personel.ad,
            soyad: personel.soyad,
            santiye: personel.santiye,
            aktif: personel.aktif,
            calismaSekli: personel.calisma_sekli || personel.calismaSekli
          });

          const isAktif = personel.aktif === undefined || personel.aktif === true;
          
          if (isAktif) {
            // Personelin şantiye ID'si
            const santiyeId = personel.santiye;
            if (santiyeId) {
              santiyePersonel[santiyeId] = (santiyePersonel[santiyeId] || 0) + 1;
            }

            // Çalışma şekli sayıları
            const calismaSekli = (personel.calisma_sekli || personel.calismaSekli || '').toUpperCase();
            if (calismaSekli.includes('MAAŞ') || calismaSekli.includes('MAAS')) {
              maasliCount++;
            } else if (calismaSekli === 'YEVMİYE ÇALIŞAN' || calismaSekli === 'YEVMIYE CALISAN' || calismaSekli === 'YEVMİYE' || calismaSekli === 'YEVMIYE') {
              yevmiyeCount++;
            }
          }
        });

        console.log("Şantiye Personel Sayıları:", santiyePersonel);

        // Şantiye verilerine personel sayılarını ekle
        const santiyelerWithAll = santiyelerWithProgress.map(santiye => ({
          ...santiye,
          personelSayisi: santiyePersonel[santiye.id] || 0
        }));

        setSantiyeler(santiyelerWithAll);
        
        const totalPersonel = maasliCount + yevmiyeCount;
        setPersonelStats({
          maasli: maasliCount,
          yevmiye: yevmiyeCount,
          total: totalPersonel,
          santiyePersonel
        });

        // İstatistik kartları
        const statsData = [
          {
            label: "Aktif Şantiyeler",
            value: santiyelerData.filter(s => s.durum?.toLowerCase() === 'aktif').length || 1,
            icon: <BusinessIcon sx={{ fontSize: 24, color: 'primary.main' }} />,
            trend: "+12%",
            trendUp: true,
            onClick: () => navigate('/santiye')
          },
          {
            label: "İş Programı",
            value: 0,
            icon: <AssignmentIcon sx={{ fontSize: 24, color: '#ff9800' }} />,
            trend: "Tümü Planlandı",
            trendUp: true,
            onClick: () => navigate('/is-programi')
          },
          {
            label: "Depo Durumu",
            value: 0,
            icon: <WarningIcon sx={{ fontSize: 24, color: '#f44336' }} />,
            trend: "Stok Normal",
            trendUp: true,
            onClick: () => navigate('/depo')
          },
          {
            label: "Personel Durumu",
            icon: <TrendingUpIcon sx={{ fontSize: 24, color: '#4caf50' }} />,
            trend: `${totalPersonel} Aktif Personel`,
            trendUp: totalPersonel > 0,
            subtext: `${maasliCount} Maaşlı\n${yevmiyeCount} Yevmiyeli`,
            onClick: () => navigate('/puantaj')
          }
        ];
        setStats(statsData);

      } catch (error) {
        console.error("Veriler yüklenirken hata:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Grid container spacing={3} sx={{ mb: 12, pb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {santiyeler.map((santiye) => (
          <Grid item xs={12} sm={6} md={3} key={santiye.id}>
            <ProjectCard santiye={santiye} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
