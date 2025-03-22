import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Modal,
} from '@mui/material';
import {
  Add as AddIcon,
  GetApp as ExportIcon,
  Security as SecurityIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Fullscreen as FullscreenIcon,
  Close as CloseIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { enqueueSnackbar } from 'notistack';
import { useSantiye } from '../../contexts/SantiyeContext';
import { binaService } from '../../services/binaService';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import BinaGorunumu from './components/BinaGorunumu';
import EksiklikIstatistikKartlari from './components/EksiklikIstatistikKartlari';
import EksiklikListesi from './components/EksiklikListesi';
import EksiklikFiltrele from './components/EksiklikFiltrele';
import EksiklikFormModal from './components/EksiklikFormModal';
import ExcelJS from 'exceljs';
import RolYetkilendirme from './components/RolYetkilendirme';
import BinaYapisiDuzenle from './components/BinaYapisiDuzenle';
import BlokYonetimi from './components/BlokYonetimi';
import { saveAs } from 'file-saver';

const EksiklikYonetimi = ({ showTeslimatEkip = false }) => {
  const [eksiklikler, setEksiklikler] = useState([]);
  const [binaYapisi, setBinaYapisi] = useState(null);
  const [filtreler, setFiltreler] = useState({
    kategori: '',
    taseron: '',
    durum: '',
    oncelik: '',
    daire: ''
  });
  const [formModalAcik, setFormModalAcik] = useState(false);
  const [seciliEksiklik, setSeciliEksiklik] = useState(null);
  const [yetkiModalAcik, setYetkiModalAcik] = useState(false);
  const { seciliSantiye, seciliBlok } = useSantiye(); 
  const [seciliDaire, setSeciliDaire] = useState(null);
  const [taseronlar, setTaseronlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);
  const [binaGorunumuTamEkran, setBinaGorunumuTamEkran] = useState(false);
  const [eksikliklerTamEkran, setEksikliklerTamEkran] = useState(false);
  const [blokYonetimiOpen, setBlokYonetimiOpen] = useState(false);
  const [binaYapisiOpen, setBinaYapisiOpen] = useState(false);
  const [selectedBlokId, setSelectedBlokId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Yetki kontrolleri
  const { hasPermission } = usePermission();
  const canManageBinaYapisi = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.BINA_YAPISI);
  const canManageBloklar = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.BLOK_YONETIMI);
  const canCreateEksiklik = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.CREATE);
  const canViewEksiklik = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.VIEW);
  const canManageEksiklik = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.MANAGE);
  const canManagePermissions = hasPermission(PAGE_PERMISSIONS.EKSIKLIK.MANAGE_PERMISSIONS);

  useEffect(() => {
    console.log('Yetki durumu:', {
      canManageBinaYapisi,
      canManageBloklar,
      canCreateEksiklik,
      canViewEksiklik,
      canManageEksiklik,
      canManagePermissions
    });
  }, [canManageBinaYapisi, canManageBloklar, canCreateEksiklik, canViewEksiklik, canManageEksiklik, canManagePermissions]);

  useEffect(() => {
    const yukle = async () => {
      if (!seciliSantiye?.id || !seciliBlok?.id) {
        return; 
      }

      try {
        setYukleniyor(true);
        const [eksikliklerData, taseronlarData, binaYapisiData] = await Promise.all([
          binaService.getEksiklikler(seciliSantiye.id, seciliBlok.id),
          binaService.getTaseronlar(),
          binaService.getBlokBilgileri(seciliSantiye.id, seciliBlok.id)
        ]);

        setEksiklikler(eksikliklerData);
        setTaseronlar(taseronlarData);
        setBinaYapisi(binaYapisiData);
      } catch (error) {
        console.error('Veri yüklenirken hata:', error);
        enqueueSnackbar('Veriler yüklenirken hata oluştu', { variant: 'error' });
      } finally {
        setYukleniyor(false);
      }
    };

    yukle();
  }, [seciliSantiye?.id, seciliBlok?.id]);

  useEffect(() => {
    // Teslimat ekip görünümü için özel ayarlar
    if (showTeslimatEkip) {
      // Teslimat ekibi ile ilgili özel ayarlar
    }
  }, [showTeslimatEkip]);

  const handleExcelExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Eksiklikler');

      // Başlık stili
      const titleStyle = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Alt başlık stili
      const headerStyle = {
        font: { bold: true, size: 12 },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Veri stili
      const dataStyle = {
        alignment: { vertical: 'middle', wrapText: true },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      // Durum renkleri
      const durumRenkleri = {
        'Tamamlandı': 'FF90EE90', // Açık yeşil
        'Devam Ediyor': 'FFFFD700', // Altın sarısı
        'Beklemede': 'FFFF6B6B', // Açık kırmızı
      };

      // Daire numaralarını doğru sıralamak için yardımcı fonksiyon
      const parseDaireNo = (daireNo) => {
        if (!daireNo || daireNo === 'Diğer') return { type: 'other', value: Number.MAX_SAFE_INTEGER };
        
        // Ortak alan kontrolü
        const isOrtakAlan = /kat|hol|merdiven|toplantı|asansör|giriş|yönetim/i.test(daireNo);
        if (isOrtakAlan) {
          return { 
            type: 'common',
            value: daireNo.toLowerCase()
          };
        }
        
        // Normal daire numarası
        const num = parseInt(daireNo.replace(/\D/g, '')) || 0;
        return { 
          type: 'apartment',
          value: num
        };
      };

      // Başlık satırı
      worksheet.mergeCells('A1:F1');
      const titleCell = worksheet.getCell('A1');
      const taseron = filtrelenmisEksiklikler.length > 0 ? (filtrelenmisEksiklikler[0].taseron || 'Belirtilmemiş') : 'Belirtilmemiş';
      titleCell.value = `${seciliSantiye?.ad || ''} - ${seciliBlok?.ad || ''} Eksiklik Raporu | ${taseron}`;
      titleCell.style = {
        font: { bold: true, size: 14, color: { argb: 'FFFFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };
      titleCell.height = 30;

      // Tarih satırı
      worksheet.mergeCells('A2:F2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
      dateCell.style = { 
        ...headerStyle, 
        alignment: { horizontal: 'right' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE5E7EB' } }
      };

      // Excel'e eklenecek satırları oluştur
      let currentRow = 3;

      // Başlık satırı
      const headerRow = worksheet.getRow(currentRow);
      headerRow.values = ['Daire', 'No', 'Açıklama', 'Öncelik', 'Durum', 'Not'];
      headerRow.eachCell(cell => {
        cell.style = headerStyle;
      });
      currentRow++;

      // Verileri daire numarasına göre sırala
      const siraliEksiklikler = filtrelenmisEksiklikler.sort((a, b) => {
        const aInfo = parseDaireNo(a.daire || 'Diğer');
        const bInfo = parseDaireNo(b.daire || 'Diğer');

        if (aInfo.type !== bInfo.type) {
          if (aInfo.type === 'apartment') return -1;
          if (bInfo.type === 'apartment') return 1;
          if (aInfo.type === 'common') return -1;
          if (bInfo.type === 'common') return 1;
          return 0;
        }

        if (aInfo.type === 'apartment') {
          return aInfo.value - bInfo.value;
        } else if (aInfo.type === 'common') {
          return aInfo.value.localeCompare(bInfo.value);
        }
        return 0;
      });

      // Eksiklikleri ekle
      let currentDaire = '';
      let index = 1;

      siraliEksiklikler.forEach((eksiklik) => {
        const row = worksheet.getRow(currentRow);
        const daire = eksiklik.daire || 'Diğer';
        
        row.values = [
          daire !== currentDaire ? daire : '', // Daire numarasını sadece değiştiğinde göster
          index,
          eksiklik.aciklama || '-',
          eksiklik.oncelik || 'NORMAL',
          eksiklik.durum || 'YENİ',
          ''  // Not için boş sütun
        ];

        row.eachCell((cell, colNumber) => {
          cell.style = {
            ...dataStyle,
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
            alignment: {
              ...dataStyle.alignment,
              horizontal: colNumber === 3 ? 'left' : 'center'
            }
          };

          // Durum hücresine renk uygula
          if (colNumber === 5) {
            const durumRenk = durumRenkleri[eksiklik.durum];
            if (durumRenk) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: durumRenk }
              };
            }
          }
        });

        row.height = 25;
        currentRow++;
        
        if (daire !== currentDaire) {
          currentDaire = daire;
          index = 1;
        } else {
          index++;
        }
      });

      // Özet bilgiler
      worksheet.mergeCells(`A${currentRow}:F${currentRow}`);
      const summaryCell = worksheet.getCell(`A${currentRow}`);
      summaryCell.value = `Toplam: ${filtrelenmisEksiklikler.length} | ` +
        `Tamamlanan: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Tamamlandı').length} | ` +
        `Devam Eden: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Devam Ediyor').length} | ` +
        `Bekleyen: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Beklemede').length}`;
      summaryCell.style = {
        font: { bold: true },
        alignment: { horizontal: 'left' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      };

      // Sütun genişliklerini ayarla
      worksheet.getColumn(1).width = 10;  // Daire
      worksheet.getColumn(2).width = 5;   // No
      worksheet.getColumn(3).width = 50;  // Açıklama
      worksheet.getColumn(4).width = 10;  // Öncelik
      worksheet.getColumn(5).width = 15;  // Durum
      worksheet.getColumn(6).width = 20;  // Not

      // Excel dosyasını oluştur ve indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      
      // Dosya adını oluştur
      const tarih = new Date().toLocaleDateString('tr-TR').replace(/\./g, '-');
      const fileName = `${seciliSantiye?.ad || 'Santiye'}_${seciliBlok?.ad || 'Blok'}_Eksiklikler_${tarih}.xlsx`
        .replace(/\s+/g, '_') // Boşlukları alt çizgi yap
        .replace(/[^a-z0-9-_]/gi, '') // Özel karakterleri kaldır
        .toLowerCase();

      // Dosyayı kaydet
      if (window.navigator && window.navigator.msSaveOrOpenBlob) {
        // IE için
        window.navigator.msSaveOrOpenBlob(blob, fileName);
      } else {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.click();
        window.URL.revokeObjectURL(url);
      }

      enqueueSnackbar('Excel dosyası başarıyla oluşturuldu', { variant: 'success' });
    } catch (error) {
      console.error('Excel export hatası:', error);
      enqueueSnackbar('Excel dosyası oluşturulurken hata oluştu', { variant: 'error' });
    }
  };

  const handleEksiklikSil = async (eksiklikId) => {
    try {
      await binaService.eksiklikSil(seciliSantiye.id, seciliBlok.id, eksiklikId);
      setEksiklikler(prev => prev.filter(e => e.id !== eksiklikId));
      enqueueSnackbar('Eksiklik başarıyla silindi', { variant: 'success' });
    } catch (error) {
      console.error('Eksiklik silinirken hata:', error);
      enqueueSnackbar('Eksiklik silinirken hata oluştu', { variant: 'error' });
    }
  };

  const handleEksiklikKaydet = async (eksiklik) => {
    try {
      const eksiklikData = {
        daire: eksiklik.daire,
        aciklama: eksiklik.aciklama,
        durum: eksiklik.durum,
        oncelik: eksiklik.oncelik,
        taseron: eksiklik.taseron,
        kategori: eksiklik.kategori,
        resimler: eksiklik.resimler || []
      };

      if (eksiklik.id) {
        await binaService.eksiklikGuncelle(seciliSantiye.id, seciliBlok.id, {
          ...eksiklikData,
          id: eksiklik.id
        });
        setEksiklikler(prev => prev.map(e => e.id === eksiklik.id ? {
          ...eksiklikData,
          id: eksiklik.id,
          olusturmaTarihi: e.olusturmaTarihi
        } : e));
      } else {
        const yeniEksiklik = await binaService.eksiklikEkle(seciliSantiye.id, seciliBlok.id, eksiklikData);
        setEksiklikler(prev => [...prev, yeniEksiklik]);
      }
      setFormModalAcik(false);
      enqueueSnackbar('Eksiklik başarıyla kaydedildi', { variant: 'success' });
    } catch (error) {
      console.error('Eksiklik kaydedilirken hata:', error);
      enqueueSnackbar('Eksiklik kaydedilirken hata oluştu', { variant: 'error' });
    }
  };

  const istatistikler = {
    toplam: eksiklikler.length,
    yeni: eksiklikler.filter(e => e.durum === 'YENİ').length,
    devamEden: eksiklikler.filter(e => e.durum === 'DEVAM_EDIYOR').length,
    tamamlandi: eksiklikler.filter(e => e.durum === 'TAMAMLANDI').length,
    kritik: eksiklikler.filter(e => e.oncelik === 'KRITIK').length
  };

  const filtrelenmisEksiklikler = eksiklikler.filter(eksiklik => {
    // Taşeron filtresi için özel kontrol
    const taseronKontrol = () => {
      if (!filtreler.taseron) return true;
      
      const secilenTaseron = filtreler.taseron;
      const kayitliTaseron = eksiklik.taseron || '';
      
      // Seçilen ve kayıtlı taşeron adlarını normalize et
      const normalizeAd = (ad) => ad.toLowerCase().replace(/[_\s]+/g, ' ').trim();
      
      const normalSecilenTaseron = normalizeAd(secilenTaseron);
      const normalKayitliTaseron = normalizeAd(kayitliTaseron);
      
      return normalSecilenTaseron === normalKayitliTaseron;
    };

    return (
      (!filtreler.durum || eksiklik.durum === filtreler.durum) &&
      (!filtreler.oncelik || eksiklik.oncelik === filtreler.oncelik) &&
      taseronKontrol() &&
      (!filtreler.daire || eksiklik.daire === filtreler.daire)
    );
  });

  const handleDaireSecim = (daireNo) => {
    setSeciliDaire(daireNo);
    setFiltreler(prev => ({
      ...prev,
      daire: daireNo
    }));
  };

  // Blok listesini getir
  const fetchBloklar = async () => {
    if (!seciliSantiye?.id) return;

    try {
      const bloklar = await binaService.getBloklar(seciliSantiye.id);
      // Blok listesini güncelle
      // TODO: Blok listesini context'e ekle
    } catch (error) {
      console.error('Bloklar yüklenirken hata:', error);
      enqueueSnackbar('Bloklar yüklenirken hata oluştu', { variant: 'error' });
    }
  };

  // Bina yapısını getir
  const fetchBinaYapisi = async () => {
    if (!seciliSantiye?.id || !seciliBlok?.id) return;

    try {
      const binaYapisiData = await binaService.getBinaYapisi(seciliSantiye.id, seciliBlok.id);
      setBinaYapisi(null); // Önce null yaparak zorla yeniden render ettir
      setTimeout(() => {
        setBinaYapisi(binaYapisiData); // Sonra yeni veriyi set et
      }, 0);
      return binaYapisiData;
    } catch (error) {
      console.error('Bina yapısı yüklenirken hata:', error);
      enqueueSnackbar('Bina yapısı yüklenirken hata oluştu', { variant: 'error' });
      return null;
    }
  };

  // Seçili blok değiştiğinde bina yapısını güncelle
  useEffect(() => {
    if (seciliBlok?.id) {
      setSelectedBlokId(seciliBlok.id);
      fetchBinaYapisi();
    }
  }, [seciliBlok?.id]);

  const handleBinaYapisiGuncelle = async () => {
    try {
      setLoading(true);
      // Bina yapısını yeniden yükle
      const yeniBinaYapisi = await binaService.getBinaYapisi(seciliSantiye.id, seciliBlok.id);
      setBinaYapisi(yeniBinaYapisi);
      setBinaYapisiOpen(false);
      enqueueSnackbar('Bina yapısı başarıyla güncellendi', { variant: 'success' });
    } catch (error) {
      console.error('Bina yapısı güncellenirken hata:', error);
      enqueueSnackbar('Bina yapısı güncellenirken hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Üst Kısım - İstatistik Kartları */}
      <EksiklikIstatistikKartlari
        eksiklikler={eksiklikler}
        sx={{
          '& .MuiGrid-item': {
            width: {
              xs: '50%',
              sm: '25%'
            }
          }
        }}
      />

      {/* Ana Grid Container */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mt: 2 }}>
        {/* Sol Panel - Bina Görünümü */}
        <Grid item xs={12} md={binaGorunumuTamEkran ? 12 : 4}>
          <Paper sx={{ p: { xs: 1, sm: 2 }, height: '100%', minHeight: { xs: '300px', sm: '400px' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Bina Görünümü</Typography>
              {seciliSantiye?.id && seciliBlok?.id && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {/* Bina Yapısı Düzenleme Butonu */}
                  {canManageBinaYapisi && (
                    <Button
                      variant="contained"
                      onClick={() => setBinaYapisiOpen(true)}
                      startIcon={<EditIcon />}
                    >
                      BİNA YAPISI
                    </Button>
                  )}

                  {/* Blok Yönetimi Butonu */}
                  {canManageBloklar && (
                    <Button
                      variant="contained"
                      onClick={() => setBlokYonetimiOpen(true)}
                      startIcon={<EditIcon />}
                    >
                      BLOK YÖNETİMİ
                    </Button>
                  )}

                  {/* Yetki Yönetimi Butonu */}
                  {canManagePermissions && (
                    <Button
                      variant="contained"
                      onClick={() => setYetkiModalAcik(true)}
                      startIcon={<SecurityIcon />}
                    >
                      YETKİLER
                    </Button>
                  )}

                  {/* Tam Ekran Butonu */}
                  <IconButton
                    onClick={() => setBinaGorunumuTamEkran(true)}
                    sx={{ display: { xs: 'none', md: 'inline-flex' } }}
                  >
                    <FullscreenIcon />
                  </IconButton>
                </Box>
              )}
            </Box>
            {!seciliSantiye?.id || !seciliBlok?.id ? (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100%',
                minHeight: '200px'
              }}>
                <Typography color="textSecondary">
                  Lütfen şantiye ve blok seçimi yapınız
                </Typography>
              </Box>
            ) : (
              <BinaGorunumu
                binaYapisi={binaYapisi}
                onDaireClick={handleDaireSecim}
                eksiklikler={eksiklikler}
              />
            )}
          </Paper>
        </Grid>

        {/* Sağ Panel - Eksiklik Listesi */}
        <Grid 
          item 
          xs={12} 
          md={eksikliklerTamEkran || !binaGorunumuTamEkran ? 8 : 12}
          sx={{
            display: {
              xs: !binaGorunumuTamEkran ? 'block' : 'none',
              md: 'block'
            }
          }}
        >
          <Paper sx={{ p: { xs: 1, sm: 2 } }}>
            {/* Üst Toolbar */}
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 },
              mb: 2,
              alignItems: { xs: 'stretch', sm: 'center' },
              justifyContent: 'space-between'
            }}>
              {seciliSantiye?.id && seciliBlok?.id ? (
                <>
                  {/* Filtreler */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: 1,
                    flex: 1
                  }}>
                    <EksiklikFiltrele
                      filtreler={filtreler}
                      setFiltreler={setFiltreler}
                      taseronlar={taseronlar}
                      sx={{
                        '& .MuiFormControl-root': {
                          minWidth: { xs: '100%', sm: '150px' }
                        }
                      }}
                    />
                  </Box>

                  {/* Aksiyon Butonları */}
                  <Box sx={{ 
                    display: 'flex', 
                    gap: 1,
                    flexWrap: 'wrap',
                    justifyContent: { xs: 'flex-start', sm: 'flex-end' }
                  }}>
                    {canCreateEksiklik && (
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => {
                          setSeciliEksiklik(null);
                          setFormModalAcik(true);
                        }}
                        sx={{ flex: { xs: 1, sm: 'initial' } }}
                      >
                        Yeni Eksiklik
                      </Button>
                    )}
                    {canManageEksiklik && (
                      <Button
                        variant="outlined"
                        startIcon={<ExportIcon />}
                        onClick={handleExcelExport}
                        sx={{ flex: { xs: 1, sm: 'initial' } }}
                      >
                        Excel
                      </Button>
                    )}
                  </Box>
                </>
              ) : (
                <Box sx={{ width: '100%', textAlign: 'center', py: 2 }}>
                  <Typography color="textSecondary">
                    Eksiklik yönetimi için lütfen şantiye ve blok seçimi yapınız
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Eksiklik Listesi Başlık */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6">Eksiklikler</Typography>
              {seciliSantiye?.id && seciliBlok?.id && (
                <IconButton
                  onClick={() => setEksikliklerTamEkran(true)}
                  sx={{ display: { xs: 'none', md: 'inline-flex' } }}
                >
                  <FullscreenIcon />
                </IconButton>
              )}
            </Box>

            {/* Eksiklik Listesi */}
            {seciliSantiye?.id && seciliBlok?.id ? (
              <EksiklikListesi
                eksiklikler={filtrelenmisEksiklikler}
                onDuzenle={(eksiklik) => {
                  setSeciliEksiklik(eksiklik);
                  setFormModalAcik(true);
                }}
                onSil={handleEksiklikSil}
                sx={{
                  '& .MuiGrid-item': {
                    width: {
                      xs: '100%',
                      sm: '50%',
                      md: '33.33%',
                      lg: '25%'
                    }
                  }
                }}
              />
            ) : (
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                height: '200px'
              }}>
                <Typography color="textSecondary">
                  Eksiklikleri görüntülemek için şantiye ve blok seçimi yapınız
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Modaller */}
      <EksiklikFormModal
        open={formModalAcik}
        onClose={() => setFormModalAcik(false)}
        eksiklik={seciliEksiklik}
        onSave={handleEksiklikKaydet}
        taseronlar={taseronlar}
        binaYapisi={binaYapisi}
      />

      {/* Bina Görünümü Tam Ekran Dialog */}
      <Dialog
        fullScreen
        open={binaGorunumuTamEkran}
        onClose={() => setBinaGorunumuTamEkran(false)}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Bina Görünümü</Typography>
          <IconButton
            onClick={() => setBinaGorunumuTamEkran(false)}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <BinaGorunumu
            binaYapisi={binaYapisi}
            eksiklikler={eksiklikler}
            seciliDaire={seciliDaire}
            onDaireClick={handleDaireSecim}
          />
        </DialogContent>
      </Dialog>

      {/* Eksiklikler Tam Ekran Dialog */}
      <Dialog
        fullScreen
        open={eksikliklerTamEkran}
        onClose={() => setEksikliklerTamEkran(false)}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Eksiklikler</Typography>
          <IconButton
            onClick={() => setEksikliklerTamEkran(false)}
            sx={{ color: 'grey.500' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <EksiklikFiltrele
            filtreler={filtreler}
            setFiltreler={setFiltreler}
            taseronlar={taseronlar}
          />
          <EksiklikListesi
            eksiklikler={filtrelenmisEksiklikler}
            onDuzenle={(eksiklik) => {
              setSeciliEksiklik(eksiklik);
              setFormModalAcik(true);
            }}
            onSil={handleEksiklikSil}
            taseronlar={taseronlar}
          />
        </DialogContent>
      </Dialog>

      {/* Blok Yönetimi Modal */}
      <Dialog
        open={blokYonetimiOpen}
        onClose={() => setBlokYonetimiOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Blok Yönetimi
          <IconButton
            onClick={() => setBlokYonetimiOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <BlokYonetimi
            santiyeId={seciliSantiye?.id}
            onClose={() => setBlokYonetimiOpen(false)}
            onUpdate={() => {
              setBlokYonetimiOpen(false);
              fetchBloklar();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Bina Yapısı Düzenleme Modal */}
      {binaYapisiOpen && (
        <Modal
          open={binaYapisiOpen}
          onClose={() => setBinaYapisiOpen(false)}
          aria-labelledby="bina-yapisi-duzenle"
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2
          }}
        >
          <Box sx={{
            bgcolor: 'background.paper',
            borderRadius: 1,
            boxShadow: 24,
            maxWidth: '90vw',
            maxHeight: '90vh',
            width: '1200px',
            overflow: 'auto'
          }}>
            <BinaYapisiDuzenle
              santiyeId={seciliSantiye?.id}
              blokId={seciliBlok?.id}
              binaYapisi={binaYapisi}
              onClose={() => setBinaYapisiOpen(false)}
              onUpdate={handleBinaYapisiGuncelle}
            />
          </Box>
        </Modal>
      )}

      {/* Yetki Modal */}
      <RolYetkilendirme
        open={yetkiModalAcik}
        onClose={() => setYetkiModalAcik(false)}
        modul="EKSIKLIK"
        santiyeId={seciliSantiye?.id}
        showTeslimatEkip={showTeslimatEkip}
      />
    </Box>
  );
};

export default EksiklikYonetimi;