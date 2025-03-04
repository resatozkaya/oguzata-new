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
  LinearProgress,
  DialogTitle,
  DialogActions
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
  ArrowDownward as ArrowDownwardIcon,
  Engineering as EngineeringIcon,
  Timeline as TimelineIcon,
  Circle as CircleIcon,
  Warehouse as WarehouseIcon
} from '@mui/icons-material';
import {
  collection, getDocs, query, orderBy, doc, getDoc
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
            bgcolor: trendUp ? sidebarColor : 'error.main',
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

const ProjectCard = ({ santiye, bugunCalisanlar }) => {
  const { sidebarColor, isDarkMode } = useTheme();
  const [openImage, setOpenImage] = useState(false);
  const defaultLogo = '/logo.png';

  // Tema renginden gradient oluştur
  const getGradient = (opacity = 1) => {
    return `linear-gradient(90deg, ${sidebarColor} 0%, ${adjustColor(sidebarColor, -20)} 100%)`;
  };

  // Rengi koyulaştır/açıklaştır
  const adjustColor = (color, amount) => {
    const hex = color.replace('#', '');
    const r = Math.max(Math.min(parseInt(hex.substring(0, 2), 16) + amount, 255), 0);
    const g = Math.max(Math.min(parseInt(hex.substring(2, 4), 16) + amount, 255), 0);
    const b = Math.max(Math.min(parseInt(hex.substring(4, 6), 16) + amount, 255), 0);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  };

  return (
    <Card className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-white'} shadow-lg hover:shadow-xl transition-all duration-300`}>
      {/* Şantiye Başlık Kısmı - Tema Rengine Uygun Gradient */}
      <Box sx={{
        p: 2,
        borderTopLeftRadius: 8,
        borderTopRightRadius: 8,
        background: isDarkMode 
          ? `linear-gradient(90deg, ${adjustColor(sidebarColor, -40)}80 0%, ${adjustColor(sidebarColor, -60)}80 100%)`
          : getGradient()
      }}>
        <Box className="flex justify-between items-center">
          <Typography variant="h6" className="font-bold text-white mb-2">
            {santiye.ad}
          </Typography>
          <IconButton
            onClick={() => setOpenImage(true)}
            sx={{
              width: 56,
              height: 56,
              padding: 0.5,
              marginLeft: 2,
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s'
              },
              '& img': {
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: '50%',
                border: `3px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.8)'}`,
                boxShadow: isDarkMode ? '0 0 10px rgba(0,0,0,0.3)' : '0 0 10px rgba(255,255,255,0.3)'
              }
            }}
          >
            <img 
              src={santiye.resimUrl || defaultLogo} 
              alt={santiye.ad} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultLogo;
              }}
            />
          </IconButton>

          <Dialog
            open={openImage}
            onClose={() => setOpenImage(false)}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle sx={{ 
              background: isDarkMode 
                ? `linear-gradient(90deg, ${adjustColor(sidebarColor, -40)}80 0%, ${adjustColor(sidebarColor, -60)}80 100%)`
                : getGradient(),
              color: 'white'
            }}>
              {santiye.ad}
            </DialogTitle>
            <DialogContent>
              <img
                src={santiye.resimUrl || defaultLogo}
                alt={santiye.ad}
                style={{
                  width: '100%',
                  height: 'auto',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                  marginTop: '16px'
                }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = defaultLogo;
                }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenImage(false)} sx={{ color: sidebarColor }}>
                Kapat
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </Box>

      <CardContent>
        {/* Personel Sayıları - Tema Rengine Uygun Arkaplanlar */}
        <Box className="flex flex-wrap gap-4 mb-6 -mt-2">
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            backgroundColor: isDarkMode 
              ? `${adjustColor(sidebarColor, -40)}20`
              : `${adjustColor(sidebarColor, 40)}20`
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              color: isDarkMode ? adjustColor(sidebarColor, 40) : sidebarColor 
            }}>
              {santiye.personelSayisi || 0}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: isDarkMode ? `${adjustColor(sidebarColor, 20)}` : `${adjustColor(sidebarColor, -20)}`,
              fontWeight: 500
            }}>
              Kayıtlı Personel
            </Typography>
          </Box>

          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            p: 2,
            borderRadius: 2,
            backgroundColor: isDarkMode 
              ? `${adjustColor(sidebarColor, -40)}20`
              : `${adjustColor(sidebarColor, 40)}20`
          }}>
            <Typography variant="h4" sx={{ 
              fontWeight: 'bold',
              color: isDarkMode ? adjustColor(sidebarColor, 40) : sidebarColor 
            }}>
              {bugunCalisanlar[santiye.id] || 0}
            </Typography>
            <Typography variant="body2" sx={{ 
              color: isDarkMode ? `${adjustColor(sidebarColor, 20)}` : `${adjustColor(sidebarColor, -20)}`,
              fontWeight: 500
            }}>
              Bugün Çalışan
            </Typography>
          </Box>
        </Box>

        <Box className="space-y-3">
          {/* Proje Müdürü ve Şantiye Şefi Bilgileri */}
          <Box sx={{
            p: 2,
            borderRadius: 2,
            backgroundColor: isDarkMode 
              ? `${adjustColor(sidebarColor, -40)}10`
              : `${adjustColor(sidebarColor, 40)}10`
          }}>
            <Box className="flex items-center gap-2 mb-2">
              <PersonIcon sx={{ 
                color: isDarkMode ? adjustColor(sidebarColor, 20) : sidebarColor 
              }} />
              <Box>
                <Typography variant="body2" className="font-medium">
                  Proje Müdürü
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {santiye.projeMuduru || "Proje müdürü belirtilmedi"}
                </Typography>
              </Box>
            </Box>

            <Box className="flex items-center gap-2">
              <EngineeringIcon sx={{ 
                color: isDarkMode ? adjustColor(sidebarColor, 20) : sidebarColor 
              }} />
              <Box>
                <Typography variant="body2" className="font-medium">
                  Şantiye Şefi
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {santiye.santiyeSefi || "Şantiye şefi belirtilmedi"}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Progress Bar - Tema Rengine Uygun */}
          <Box className="mt-4">
            <Typography variant="body2" className="font-medium mb-2">
              İlerleme Durumu
            </Typography>
            <LinearProgress
              variant="determinate"
              value={santiye.tamamlanmaOrani ? (santiye.tamamlanmaOrani / 100) * 100 : 0}
              sx={{
                height: 10,
                borderRadius: 5,
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                '& .MuiLinearProgress-bar': {
                  background: isDarkMode 
                    ? `linear-gradient(90deg, ${adjustColor(sidebarColor, -20)}99 0%, ${adjustColor(sidebarColor, -40)}99 100%)`
                    : getGradient(),
                  borderRadius: 5
                }
              }}
            />
            <Box className="flex justify-between mt-1">
              <Typography variant="body2" color="textSecondary">
                Tamamlanan: {santiye.tamamlananEksiklik || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {santiye.tamamlananEksiklik && santiye.eksiklikSayisi 
                  ? `${Math.round((santiye.tamamlananEksiklik / santiye.eksiklikSayisi) * 100)}%` 
                  : '0%'}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Toplam: {santiye.eksiklikSayisi || 0}
              </Typography>
            </Box>
          </Box>

          {/* Durum Chip - Tema Rengine Uygun */}
          <Box className="flex items-center gap-2 mt-4">
            <Typography variant="body2" className="font-medium">
              Durum:
            </Typography>
            <Chip
              label={santiye.durum || "Aktif"}
              size="small"
              className="font-medium"
              sx={{
                background: isDarkMode
                  ? `linear-gradient(90deg, ${adjustColor(sidebarColor, -20)}99 0%, ${adjustColor(sidebarColor, -40)}99 100%)`
                  : getGradient(),
                color: 'white'
              }}
            />
          </Box>
        </Box>
      </CardContent>
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
  const [bugunCalisanlar, setBugunCalisanlar] = useState({});
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

        // Depo verilerini çek
        const depoRef = collection(db, 'depolar');
        const depoSnapshot = await getDocs(depoRef);
        const depoData = depoSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const aktifDepoSayisi = depoData.filter(d => d.durum === 'Aktif').length;

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

        // Bugünün puantaj verilerini çek
        const today = new Date();
        const currentMonth = today.getMonth() + 1;
        const currentYear = today.getFullYear();
        const currentDay = today.getDate();

        const calisanSayilari = {};

        // Her şantiye için bugün çalışanları kontrol et
        for (const santiye of santiyelerData) {
          const puantajDoc = await getDoc(doc(db, "puantaj", `${currentYear}-${currentMonth}-${santiye.ad}`));
          let calisanSayisi = 0;

          if (puantajDoc.exists()) {
            const puantajData = puantajDoc.data();
            // Tüm personelleri kontrol et
            Object.values(puantajData).forEach(personelData => {
              // Bugünün verisini kontrol et
              const bugunData = personelData[currentDay];
              if (bugunData && bugunData.status && 
                  ["tam", "yarim", "mesai"].includes(bugunData.status)) {
                calisanSayisi++;
              }
            });
          }
          calisanSayilari[santiye.id] = calisanSayisi;
        }

        setBugunCalisanlar(calisanSayilari);

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
            value: santiyelerData.length,
            label: "Şantiye",
            icon: <BusinessIcon sx={{ fontSize: 24, color: sidebarColor }} />,
            onClick: () => navigate('/santiye')
          },
          {
            value: totalPersonel,
            label: "Personel",
            icon: <GroupIcon sx={{ fontSize: 24, color: sidebarColor }} />,
            onClick: () => navigate('/personel')
          },
          {
            value: depoData.length,
            label: "Depo",
            icon: <WarehouseIcon sx={{ fontSize: 24, color: sidebarColor }} />,
            onClick: () => navigate('/depo')
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
      <Box sx={{ mb: 4 }}>
        <Grid container spacing={3} sx={{ mb: 12, pb: 4, maxWidth: "1000px", mx: "auto" }} justifyContent="center">
          {stats.map((stat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <StatCard {...stat} />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Grid container spacing={3}>
        {santiyeler.map((santiye) => (
          <Grid item xs={12} sm={6} md={3} key={santiye.id}>
            <ProjectCard santiye={santiye} bugunCalisanlar={bugunCalisanlar} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
