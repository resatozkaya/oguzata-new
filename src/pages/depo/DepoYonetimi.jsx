import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Grid, Paper, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Dialog, DialogContent, IconButton, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { Add as AddIcon, ViewModule as GridIcon, ViewList as ListIcon, Edit as EditIcon, Delete as DeleteIcon, Remove as RemoveIcon, MoreVert as MoreVertIcon } from '@mui/icons-material';
import DepoSantiyeSecici from '../../components/depo/DepoSantiyeSecici';
import DepoSecici from '../../components/depo/DepoSecici';
import DepoKarti from '../../components/depo/DepoKarti';
import DepoEkleDialog from '../../components/depo/DepoEkleDialog';
import MalzemeEkleDialog from '../../components/depo/MalzemeEkleDialog';
import MalzemeDuzenleDialog from '../../components/depo/MalzemeDuzenleDialog';
import MalzemeIslemDialog from '../../components/depo/MalzemeIslemDialog';
import IslemDuzenleDialog from '../../components/depo/IslemDuzenleDialog';
import { useDepo } from '../../contexts/DepoContext';
import { depoService } from '../../services/depoService';
import { formatDistance } from 'date-fns';
import { tr } from 'date-fns/locale';

const DepoYonetimi = () => {
  const { 
    seciliSantiye, 
    seciliDepo, 
    setSeciliDepo,
    malzemeler, 
    setMalzemeler, 
    depolar, 
    setDepolar 
  } = useDepo();
  const [depoEkleDialogAcik, setDepoEkleDialogAcik] = useState(false);
  const [malzemeEkleDialogAcik, setMalzemeEkleDialogAcik] = useState(false);
  const [gorunumTipi, setGorunumTipi] = useState('liste'); // 'liste' veya 'kart'
  const [seciliTab, setSeciliTab] = useState(0);
  const [buyukResim, setBuyukResim] = useState(null);
  const [seciliMalzeme, setSeciliMalzeme] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [duzenleDialogAcik, setDuzenleDialogAcik] = useState(false);
  const [islemDialogAcik, setIslemDialogAcik] = useState(false);
  const [sonIslemler, setSonIslemler] = useState([]);
  const [seciliIslem, setSeciliIslem] = useState(null);
  const [islemDuzenleDialogAcik, setIslemDuzenleDialogAcik] = useState(false);

  // Base64 resmi görüntülemek için yardımcı fonksiyon
  const getImageUrl = (base64Data) => {
    if (!base64Data) return null;
    // Eğer zaten tam base64 url ise olduğu gibi döndür
    if (base64Data.startsWith('data:image/')) return base64Data;
    // Değilse base64 header ekle
    return `data:image/jpeg;base64,${base64Data}`;
  };

  // Tarih formatla
  const formatTarih = (tarih) => {
    if (!tarih) return '';
    try {
      if (typeof tarih === 'string') {
        return new Date(tarih).toLocaleDateString('tr-TR');
      }
      // Firestore Timestamp
      if (tarih.toDate) {
        return tarih.toDate().toLocaleDateString('tr-TR');
      }
      // Normal Date objesi
      if (tarih instanceof Date) {
        return tarih.toLocaleDateString('tr-TR');
      }
      return '';
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '';
    }
  };

  const handleMenuClick = (event, malzeme) => {
    event.stopPropagation();
    setSeciliMalzeme(malzeme);
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  const handleMalzemeSil = async () => {
    if (!seciliMalzeme) return;
    
    if (window.confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
      try {
        await depoService.malzemeSil(seciliSantiye.id, seciliDepo.id, seciliMalzeme.id);
        setMalzemeler(prev => prev.filter(m => m.id !== seciliMalzeme.id));
      } catch (error) {
        console.error('Malzeme silinirken hata:', error);
        alert('Malzeme silinirken bir hata oluştu');
      }
    }
    handleMenuClose();
  };

  const handleMalzemeClick = (malzeme) => {
    setSeciliMalzeme(malzeme);
    setIslemDialogAcik(true);
  };

  // İşlemleri yükle
  const islemleriYukle = async (malzemeId) => {
    try {
      if (!seciliSantiye?.id || !seciliDepo?.id) return [];
      
      const islemler = await depoService.getMalzemeIslemler(
        seciliSantiye.id,
        seciliDepo.id,
        malzemeId
      );
      
      return islemler;
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
      return [];
    }
  };

  // Tüm malzemelerin son işlemlerini yükle
  const tumIslemleriYukle = async () => {
    try {
      const tumIslemler = [];
      for (const malzeme of malzemeler) {
        const islemler = await islemleriYukle(malzeme.id);
        tumIslemler.push(...islemler.map(islem => ({
          ...islem,
          malzemeId: malzeme.id,
          malzemeAdi: malzeme.ad,
          birim: malzeme.birim
        })));
      }
      
      // Son 10 işlemi al ve tarihe göre sırala
      const sonOnIslem = tumIslemler
        .sort((a, b) => b.tarih.getTime() - a.tarih.getTime())
        .slice(0, 10);
      
      setSonIslemler(sonOnIslem);
    } catch (error) {
      console.error('İşlemler yüklenirken hata:', error);
    }
  };

  // Malzemeler veya seçili depo değiştiğinde işlemleri yükle
  useEffect(() => {
    if (seciliSantiye?.id && seciliDepo?.id) {
      tumIslemleriYukle();
    }
  }, [malzemeler, seciliSantiye?.id, seciliDepo?.id]);

  // İşlem silme fonksiyonu
  const handleIslemSil = async () => {
    if (!seciliIslem || !window.confirm('Bu işlemi silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await depoService.islemSil(
        seciliSantiye.id,
        seciliDepo.id,
        seciliIslem.malzemeId,
        seciliIslem.id
      );

      // İşlemler listesini güncelle
      setSonIslemler(prev => prev.filter(i => i.id !== seciliIslem.id));

      // Malzeme miktarını güncelle (işlem geri alınıyor)
      const miktar = seciliIslem.islemTuru === 'Giriş' 
        ? -Number(seciliIslem.miktar) 
        : Number(seciliIslem.miktar);

      await depoService.malzemeMiktarGuncelle(
        seciliSantiye.id,
        seciliDepo.id,
        seciliIslem.malzemeId,
        miktar
      );

      // Malzemeler listesini güncelle
      setMalzemeler(prev => prev.map(m => 
        m.id === seciliIslem.malzemeId
          ? { ...m, miktar: m.miktar + miktar }
          : m
      ));

      handleIslemMenuClose();
    } catch (error) {
      console.error('İşlem silinirken hata:', error);
      alert('İşlem silinirken bir hata oluştu');
    }
  };

  // Son işlemler listesi komponenti
  const SonIslemListesi = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      {sonIslemler.length === 0 ? (
        <Typography color="text.secondary">Henüz işlem yapılmamış</Typography>
      ) : (
        sonIslemler.map((islem) => (
          <Paper 
            key={islem.id} 
            sx={{ 
              p: 2,
              bgcolor: islem.islemTuru === 'Giriş' ? 'success.main' : 'error.main',
              color: 'white',
              position: 'relative',
              '&:hover .islem-butonlar': {
                opacity: 1
              }
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box>
                <Typography variant="subtitle2">
                  {islem.malzemeAdi}
                </Typography>
                <Typography variant="body2">
                  {islem.islemTuru}: {islem.miktar} {islem.birim}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {formatDistance(islem.tarih, new Date(), { 
                    addSuffix: true,
                    locale: tr 
                  })}
                </Typography>
                {islem.aciklama && (
                  <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                    {islem.aciklama}
                  </Typography>
                )}
              </Box>
              <Box 
                className="islem-butonlar"
                sx={{ 
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  display: 'flex',
                  gap: 1
                }}
              >
                <IconButton
                  size="small"
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,255,255,0.2)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeciliIslem(islem);
                    setIslemDuzenleDialogAcik(true);
                  }}
                >
                  <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  sx={{ 
                    color: 'white', 
                    bgcolor: 'rgba(255,255,255,0.1)',
                    '&:hover': { 
                      bgcolor: 'rgba(255,0,0,0.2)'
                    }
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSeciliIslem(islem);
                    handleIslemSil();
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Paper>
        ))
      )}
    </Box>
  );

  // İstatistik hesaplama fonksiyonları
  const hesaplaIstatistikler = () => {
    if (!malzemeler.length) return null;

    return {
      // Toplam malzeme çeşidi
      toplamMalzemeCesidi: malzemeler.length,

      // Toplam stok miktarı (birime göre gruplandırılmış)
      toplamStoklar: malzemeler.reduce((acc, m) => {
        acc[m.birim] = (acc[m.birim] || 0) + Number(m.miktar);
        return acc;
      }, {}),

      // Kategorilere göre malzeme dağılımı
      kategoriDagilimi: malzemeler.reduce((acc, m) => {
        acc[m.kategori] = (acc[m.kategori] || 0) + 1;
        return acc;
      }, {}),

      // Kritik stokları kontrol et
      kritikStoklar: malzemeler.filter(m => {
        const miktar = Number(m.miktar);
        const kritikSeviye = m.kritikStokSeviyesi || 10; // Eğer belirlenmemişse varsayılan 10
        return miktar < kritikSeviye;
      }),

      // Son 24 saatteki işlem sayısı
      sonYirmiDortSaat: sonIslemler.filter(islem => {
        const yirmiDortSaatOnce = new Date(Date.now() - 24 * 60 * 60 * 1000);
        return new Date(islem.tarih) > yirmiDortSaatOnce;
      }).length,

      // Giriş/Çıkış oranı
      islemOzeti: sonIslemler.reduce((acc, islem) => {
        acc[islem.islemTuru] = (acc[islem.islemTuru] || 0) + 1;
        return acc;
      }, {})
    };
  };

  // İstatistikler komponenti
  const IstatistiklerTab = () => {
    const istatistikler = hesaplaIstatistikler();

    if (!istatistikler) {
      return <Typography color="text.secondary">Henüz veri yok</Typography>;
    }

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Özet Kartları */}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6">Toplam Malzeme Çeşidi</Typography>
              <Typography variant="h4">{istatistikler.toplamMalzemeCesidi}</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Paper sx={{ p: 2, bgcolor: 'secondary.main', color: 'white' }}>
              <Typography variant="h6">Son 24 Saat İşlem</Typography>
              <Typography variant="h4">{istatistikler.sonYirmiDortSaat}</Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Stok Durumu */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Toplam Stok Durumu</Typography>
          {Object.entries(istatistikler.toplamStoklar).map(([birim, miktar]) => (
            <Box key={birim} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>{birim}</Typography>
              <Typography fontWeight="bold">{miktar}</Typography>
            </Box>
          ))}
        </Paper>

        {/* Kritik Stoklar */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Kritik Stoklar ({istatistikler.kritikStoklar.length})
          </Typography>
          {istatistikler.kritikStoklar.map(malzeme => (
            <Box key={malzeme.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>{malzeme.ad}</Typography>
              <Box>
                <Typography 
                  component="span" 
                  color="error.main"
                  fontWeight="bold"
                >
                  {malzeme.miktar}
                </Typography>
                <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                  / {malzeme.kritikStokSeviyesi} {malzeme.birim}
                </Typography>
              </Box>
            </Box>
          ))}
        </Paper>

        {/* Kategori Dağılımı */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Kategori Dağılımı</Typography>
          {Object.entries(istatistikler.kategoriDagilimi).map(([kategori, sayi]) => (
            <Box key={kategori} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography>{kategori.replace(/_/g, ' ')}</Typography>
              <Typography>{sayi} çeşit</Typography>
            </Box>
          ))}
        </Paper>

        {/* İşlem Özeti */}
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>İşlem Özeti</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Paper sx={{ p: 2, flex: 1, bgcolor: 'success.main', color: 'white' }}>
              <Typography>Giriş İşlemleri</Typography>
              <Typography variant="h4">{istatistikler.islemOzeti['Giriş'] || 0}</Typography>
            </Paper>
            <Paper sx={{ p: 2, flex: 1, bgcolor: 'error.main', color: 'white' }}>
              <Typography>Çıkış İşlemleri</Typography>
              <Typography variant="h4">{istatistikler.islemOzeti['Çıkış'] || 0}</Typography>
            </Paper>
          </Box>
        </Paper>
      </Box>
    );
  };

  // Kritik stok uyarılarını göster
  const KritikStokUyarilari = () => {
    const istatistikler = hesaplaIstatistikler();
    
    if (!istatistikler?.kritikStoklar.length) return null;

    return (
      <Paper sx={{ 
        p: 2, 
        mb: 2, 
        bgcolor: 'warning.light',
        borderLeft: 4,
        borderColor: 'warning.main'
      }}>
        <Typography variant="h6" gutterBottom color="warning.dark">
          Kritik Stok Uyarıları
        </Typography>
        {istatistikler.kritikStoklar.map(malzeme => (
          <Box 
            key={malzeme.id} 
            sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 1 
            }}
          >
            <Typography>
              {malzeme.ad}
            </Typography>
            <Box>
              <Typography 
                component="span" 
                color="error.main" 
                fontWeight="bold"
              >
                {malzeme.miktar}
              </Typography>
              <Typography component="span" color="text.secondary" sx={{ ml: 1 }}>
                / {malzeme.kritikStokSeviyesi} {malzeme.birim}
              </Typography>
            </Box>
          </Box>
        ))}
      </Paper>
    );
  };

  // Depo silme fonksiyonu
  const handleDepoSil = async () => {
    if (!seciliSantiye?.id || !seciliDepo?.id) {
      console.error('Depo silme için gerekli bilgiler eksik:', {
        santiyeId: seciliSantiye?.id,
        depoId: seciliDepo?.id
      });
      return;
    }

    try {
      if (window.confirm('Depoyu silmek istediğinize emin misiniz?')) {
        await depoService.depoSil(seciliSantiye.id, seciliDepo.id);
        
        // Önce seçili depoyu temizle
        setSeciliDepo(null);
        
        // Sonra depolar listesini güncelle
        const yeniDepolar = depolar.filter(d => d.id !== seciliDepo.id);
        setDepolar(yeniDepolar);
        
        // Malzemeleri temizle
        setMalzemeler([]);
      }
    } catch (error) {
      console.error('Depo silinirken hata:', error);
      alert('Depo silinirken bir hata oluştu');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Üst Kısım: Seçiciler ve Butonlar */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Box sx={{ flex: 1 }}>
              <DepoSantiyeSecici />
            </Box>
            <Box sx={{ flex: 1 }}>
              <DepoSecici onDepoSil={handleDepoSil} />
            </Box>
            {/* Depo Ekleme Butonu - Şantiye seçili olduğunda göster */}
            {seciliSantiye && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setDepoEkleDialogAcik(true)}
                startIcon={<AddIcon />}
              >
                Yeni Depo
              </Button>
            )}
            {/* Malzeme Ekleme Butonu - Depo seçili olduğunda göster */}
            {seciliDepo && (
              <Button
                variant="contained"
                color="primary"
                onClick={() => setMalzemeEkleDialogAcik(true)}
                startIcon={<AddIcon />}
              >
                Yeni Malzeme
              </Button>
            )}
            {/* Görünüm Değiştirme Butonları */}
            {seciliDepo && (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton 
                  color={gorunumTipi === 'liste' ? 'primary' : 'default'}
                  onClick={() => setGorunumTipi('liste')}
                >
                  <ListIcon />
                </IconButton>
                <IconButton
                  color={gorunumTipi === 'kart' ? 'primary' : 'default'}
                  onClick={() => setGorunumTipi('kart')}
                >
                  <GridIcon />
                </IconButton>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Kritik stok uyarıları - Sabit */}
        <Grid item xs={12}>
          <KritikStokUyarilari />
        </Grid>

        {/* Sol Taraf: Malzeme Listesi */}
        <Grid item xs={12} md={8}>
          <Paper>
            {/* Malzeme Listesi */}
            <Box>
              {malzemeler.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Henüz malzeme eklenmemiş
                  </Typography>
                </Box>
              ) : gorunumTipi === 'liste' ? (
                <TableContainer>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Resim</TableCell>
                        <TableCell>Malzeme Adı</TableCell>
                        <TableCell>Kategori</TableCell>
                        <TableCell align="right">Miktar</TableCell>
                        <TableCell>Birim</TableCell>
                        <TableCell>İşlem</TableCell>
                        <TableCell>Tarih</TableCell>
                        <TableCell align="right">İşlemler</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {malzemeler.map((malzeme) => (
                        <TableRow 
                          key={malzeme.id}
                          hover
                          onClick={() => handleMalzemeClick(malzeme)}
                          sx={{ '&:hover': { cursor: 'pointer' } }}
                        >
                          <TableCell>
                            {malzeme.resimUrl && (
                              <img 
                                src={getImageUrl(malzeme.resimUrl)}
                                alt={malzeme.ad}
                                style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBuyukResim(malzeme.resimUrl);
                                }}
                              />
                            )}
                          </TableCell>
                          <TableCell>{malzeme.ad}</TableCell>
                          <TableCell>{malzeme.kategori.replace(/_/g, ' ')}</TableCell>
                          <TableCell align="right">{malzeme.miktar}</TableCell>
                          <TableCell>{malzeme.birim}</TableCell>
                          <TableCell>{malzeme.islemTuru}</TableCell>
                          <TableCell>{formatTarih(malzeme.tarih)}</TableCell>
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={(e) => handleMenuClick(e, malzeme)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ p: 2 }}>
                  <Grid container spacing={2}>
                    {malzemeler.map((malzeme) => (
                      <Grid item xs={12} sm={6} md={4} key={malzeme.id}>
                        <DepoKarti 
                          malzeme={malzeme} 
                          onClick={() => handleMalzemeClick(malzeme)}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Sağ Taraf: İşlem Geçmişi ve İstatistikler */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ 
            display: 'flex',
            flexDirection: 'column',
            height: 'calc(100vh - 250px)'
          }}>
            {/* Tabs - Sabit */}
            <Tabs 
              value={seciliTab} 
              onChange={(e, newValue) => setSeciliTab(newValue)}
              sx={{ 
                borderBottom: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper',
                position: 'sticky',
                top: 0,
                zIndex: 1
              }}
            >
              <Tab label="Son İşlemler" />
              <Tab label="İstatistikler" />
            </Tabs>

            {/* İçerik - Kaydırılabilir */}
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {seciliTab === 0 ? (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Son 10 İşlem
                  </Typography>
                  <SonIslemListesi />
                </Box>
              ) : (
                <IstatistiklerTab />
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <DepoEkleDialog 
        open={depoEkleDialogAcik}
        onClose={() => setDepoEkleDialogAcik(false)}
        santiyeId={seciliSantiye?.id}
      />

      <MalzemeEkleDialog 
        open={malzemeEkleDialogAcik}
        onClose={() => setMalzemeEkleDialogAcik(false)}
        depoId={seciliDepo?.id}
      />

      {/* Büyük Resim Dialog'u */}
      <Dialog
        open={Boolean(buyukResim)}
        onClose={() => setBuyukResim(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 0 }}>
          {buyukResim && (
            <img
              src={getImageUrl(buyukResim)}
              alt="Büyük Resim"
              style={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Malzeme Düzenleme Dialog'u */}
      <MalzemeDuzenleDialog
        open={duzenleDialogAcik}
        onClose={() => setDuzenleDialogAcik(false)}
        malzeme={seciliMalzeme}
      />

      {/* Malzeme İşlem Dialog'u */}
      <MalzemeIslemDialog
        open={islemDialogAcik}
        onClose={() => {
          setIslemDialogAcik(false);
          setSeciliMalzeme(null);
        }}
        malzeme={seciliMalzeme}
      />

      {/* İşlem Düzenleme Dialog'u */}
      <IslemDuzenleDialog
        open={islemDuzenleDialogAcik}
        onClose={() => {
          setIslemDuzenleDialogAcik(false);
          setSeciliIslem(null);
        }}
        islem={seciliIslem}
        onSuccess={() => {
          // İşlem başarıyla güncellendiğinde
          tumIslemleriYukle(); // İşlemleri yeniden yükle
        }}
      />

      {/* Malzeme Menüsü */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        <MenuItem onClick={() => {
          handleMenuClose();
          setIslemDialogAcik(true);
        }}>
          <ListItemIcon>
            <AddIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Giriş/Çıkış İşlemi</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          handleMenuClose();
          setDuzenleDialogAcik(true);
        }}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Düzenle</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleMalzemeSil}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Sil</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default DepoYonetimi; 