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
import { usePermission } from '../../hooks/usePermission';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import BinaGorunumu from './components/BinaGorunumu';
import EksiklikIstatistikKartlari from './components/EksiklikIstatistikKartlari';
import EksiklikListesi from './components/EksiklikListesi';
import EksiklikFiltrele from './components/EksiklikFiltrele';
import EksiklikFormModal from './components/EksiklikFormModal';
import ExcelJS from 'exceljs';
import RolYetkilendirme from './components/RolYetkilendirme';

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
  // Tam ekran state'leri
  const [binaGorunumuTamEkran, setBinaGorunumuTamEkran] = useState(false);
  const [eksikliklerTamEkran, setEksikliklerTamEkran] = useState(false);

  // Yetki kontrolleri
  const canManageBinaYapisi = usePermission(PAGE_PERMISSIONS.EKSIKLIK.BINA_YAPISI);
  const canManageBlok = usePermission(PAGE_PERMISSIONS.EKSIKLIK.BLOK_YONETIMI);
  const canCreateEksiklik = usePermission(PAGE_PERMISSIONS.EKSIKLIK.CREATE);
  const canViewEksiklik = usePermission(PAGE_PERMISSIONS.EKSIKLIK.VIEW);
  const canManageEksiklik = usePermission(PAGE_PERMISSIONS.EKSIKLIK.MANAGE);

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
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } },
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

      // Başlık satırı
      worksheet.mergeCells('A1:E1');
      const titleCell = worksheet.getCell('A1');
      titleCell.value = `${seciliSantiye?.ad || ''} - ${seciliBlok?.ad || ''} Eksiklik Raporu`;
      titleCell.style = titleStyle;

      // Tarih satırı
      worksheet.mergeCells('A2:E2');
      const dateCell = worksheet.getCell('A2');
      dateCell.value = `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR')}`;
      dateCell.style = { ...headerStyle, alignment: { horizontal: 'right' } };

      // Daire numaralarını doğru sıralamak için yardımcı fonksiyon
      const parseDaireNo = (daireNo) => {
        if (!daireNo || daireNo === 'Diğer') return { type: 'other', value: Number.MAX_SAFE_INTEGER };
        
        // Ortak alan kontrolü
        const isOrtakAlan = /kat|hol|merdiven|toplantı|asansör|giriş/i.test(daireNo);
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

      // Verileri daire ve taşerona göre grupla
      const grupluVeriler = filtrelenmisEksiklikler.reduce((acc, eksiklik) => {
        const daireNo = eksiklik.daire || 'Diğer';
        const taseron = eksiklik.taseron || 'Belirtilmemiş';

        if (!acc[daireNo]) {
          acc[daireNo] = {};
        }
        if (!acc[daireNo][taseron]) {
          acc[daireNo][taseron] = [];
        }
        acc[daireNo][taseron].push(eksiklik);
        return acc;
      }, {});

      // Daire numaralarını akıllı sıralama ile düzenle
      const siraliDaireler = Object.keys(grupluVeriler).sort((a, b) => {
        const aInfo = parseDaireNo(a);
        const bInfo = parseDaireNo(b);

        // Farklı tipteki daireler için sıralama
        if (aInfo.type !== bInfo.type) {
          // Önce normal daireler
          if (aInfo.type === 'apartment') return -1;
          if (bInfo.type === 'apartment') return 1;
          // Sonra ortak alanlar
          if (aInfo.type === 'common') return -1;
          if (bInfo.type === 'common') return 1;
          // En son diğerleri
          return 0;
        }

        // Aynı tipteki daireler için sıralama
        if (aInfo.type === 'apartment') {
          // Normal daire numaralarını sayısal olarak sırala
          return aInfo.value - bInfo.value;
        } else if (aInfo.type === 'common') {
          // Ortak alanları alfabetik sırala
          return aInfo.value.localeCompare(bInfo.value);
        }
        
        // Diğer durumlar için varsayılan sıralama
        return 0;
      });

      // Excel'e eklenecek satırları oluştur
      let currentRow = 3;
      let currentSection = '';

      siraliDaireler.forEach(daireNo => {
        const daireInfo = parseDaireNo(daireNo);
        
        // Bölüm değişikliği kontrolü
        let yeniBolum = '';
        if (daireInfo.type === 'apartment' && currentSection !== 'Daireler') {
          yeniBolum = 'Daireler';
        } else if (daireInfo.type === 'common' && currentSection !== 'Ortak Alanlar') {
          yeniBolum = 'Ortak Alanlar';
        } else if (daireInfo.type === 'other' && currentSection !== 'Diğer') {
          yeniBolum = 'Diğer';
        }

        // Yeni bölüm başlığı ekle
        if (yeniBolum) {
          currentSection = yeniBolum;
          const bolumBaslik = worksheet.getRow(currentRow);
          worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
          bolumBaslik.getCell(1).value = yeniBolum;
          bolumBaslik.getCell(1).style = {
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
          bolumBaslik.height = 35;
          currentRow++;
        }

        // Daire başlığı
        const daireBaslik = worksheet.getRow(currentRow);
        worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
        daireBaslik.getCell(1).value = `${daireInfo.type === 'apartment' ? 'Daire' : ''} ${daireNo}`;
        daireBaslik.getCell(1).style = {
          font: { bold: true, size: 12 },
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4B5563' } },
          alignment: { horizontal: 'left', vertical: 'middle' },
          border: {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          }
        };
        daireBaslik.height = 30;
        currentRow++;

        // Her taşeron için eksiklikleri ekle
        const taseronlar = Object.keys(grupluVeriler[daireNo]).sort();
        taseronlar.forEach((taseron, taseronIndex) => {
          const eksiklikler = grupluVeriler[daireNo][taseron];
          
          // Taşeron başlığı
          const taseronBaslik = worksheet.getRow(currentRow);
          worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
          taseronBaslik.getCell(1).value = `${taseron} (${eksiklikler.length} iş)`;
          taseronBaslik.getCell(1).style = {
            font: { bold: true, italic: true },
            fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: taseronIndex % 2 === 0 ? 'FFF3F4F6' : 'FFE5E7EB' } },
            alignment: { horizontal: 'left', vertical: 'middle' },
            border: {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            }
          };
          taseronBaslik.height = 25;
          currentRow++;

          // Eksiklik başlıkları
          const headerRow = worksheet.getRow(currentRow);
          headerRow.values = ['No', 'Açıklama', 'Öncelik', 'Durum', 'Not'];
          headerRow.eachCell(cell => {
            cell.style = headerStyle;
          });
          currentRow++;

          // Eksiklikleri ekle
          eksiklikler.forEach((eksiklik, index) => {
            const row = worksheet.getRow(currentRow);
            row.values = [
              index + 1,
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
                  horizontal: colNumber === 2 ? 'left' : 'center'
                }
              };

              // Durum hücresine renk uygula
              if (colNumber === 4) {
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
          });

          // Taşeron bölümü sonunda boşluk
          if (taseronIndex < taseronlar.length - 1) {
            currentRow++;
          }
        });

        // Daire bölümü sonunda boşluk
        currentRow++;
      });

      // Özet bilgiler
      worksheet.mergeCells(`A${currentRow}:E${currentRow}`);
      const summaryCell = worksheet.getCell(`A${currentRow}`);
      summaryCell.value = `Toplam Eksiklik: ${filtrelenmisEksiklikler.length} | ` +
        `Tamamlanan: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Tamamlandı').length} | ` +
        `Devam Eden: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Devam Ediyor').length} | ` +
        `Bekleyen: ${filtrelenmisEksiklikler.filter(d => d.durum === 'Beklemede').length}`;
      summaryCell.style = {
        font: { bold: true },
        alignment: { horizontal: 'left' },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } }
      };

      // Sütun genişliklerini ayarla
      worksheet.getColumn(1).width = 5;  // No
      worksheet.getColumn(2).width = 50; // Açıklama
      worksheet.getColumn(3).width = 10; // Öncelik
      worksheet.getColumn(4).width = 15; // Durum
      worksheet.getColumn(5).width = 20; // Not

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

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Üst Kısım - İstatistik Kartları */}
      <EksiklikIstatistikKartlari
        eksiklikler={eksiklikler}
        sx={{
          '& .MuiGrid-item': {
            width: {
              xs: '50%', // Mobilde 2 kart yan yana
              sm: '25%'  // Tablet ve üstünde 4 kart yan yana
            }
          }
        }}
      />

      {/* Ana Grid Container */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mt: 2 }}>
        {/* Sol Panel - Bina Görünümü */}
        <Grid 
          item 
          xs={12} 
          md={binaGorunumuTamEkran ? 12 : 4} 
          sx={{
            display: { 
              xs: binaGorunumuTamEkran ? 'block' : 'none', // Mobilde tam ekran değilse gizle
              md: 'block' // Desktop'ta her zaman göster
            }
          }}
        >
          <Paper 
            sx={{ 
              p: { xs: 1, sm: 2 },
              height: '100%',
              minHeight: { xs: '300px', sm: '400px' }
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6">Bina Görünümü</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {/* Yetkileri Düzenle Butonu */}
                {canManageEksiklik && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    startIcon={<SecurityIcon />}
                    onClick={() => setYetkiModalAcik(true)}
                  >
                    YETKİLERİ DÜZENLE
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
            </Box>
            <BinaGorunumu
              binaYapisi={binaYapisi}
              onDaireClick={handleDaireSecim}
              eksiklikler={eksiklikler}
            />
          </Paper>
        </Grid>

        {/* Sağ Panel - Eksiklik Listesi */}
        <Grid 
          item 
          xs={12} 
          md={eksikliklerTamEkran || !binaGorunumuTamEkran ? 8 : 12}
          sx={{
            display: {
              xs: !binaGorunumuTamEkran ? 'block' : 'none', // Mobilde bina görünümü tam ekran değilse göster
              md: 'block' // Desktop'ta her zaman göster
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
            </Box>

            {/* Eksiklik Listesi Başlık */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6">Eksiklikler</Typography>
              <IconButton
                onClick={() => setEksikliklerTamEkran(true)}
                sx={{ display: { xs: 'none', md: 'inline-flex' } }}
              >
                <FullscreenIcon />
              </IconButton>
            </Box>

            {/* Eksiklik Listesi */}
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
                    xs: '100%',    // Mobilde tam genişlik
                    sm: '50%',     // Tablet'te 2 kolon
                    md: '33.33%',  // Desktop'ta 3 kolon
                    lg: '25%'      // Geniş ekranda 4 kolon
                  }
                }
              }}
            />
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