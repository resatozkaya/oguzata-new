import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  GetApp as ExportIcon
} from '@mui/icons-material';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useSantiye } from '../../contexts/SantiyeContext';
import { binaService } from '../../services/binaService';
import BinaGorunumu from './components/BinaGorunumu';
import EksiklikIstatistikKartlari from './components/EksiklikIstatistikKartlari';
import EksiklikListesi from './components/EksiklikListesi';
import EksiklikFiltrele from './components/EksiklikFiltrele';
import EksiklikFormModal from './components/EksiklikFormModal';
import ExcelJS from 'exceljs';

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
  const { showSnackbar } = useSnackbar();
  const { seciliSantiye, seciliBlok, setSeciliSantiye, setSeciliBlok } = useSantiye(); 
  const [seciliDaire, setSeciliDaire] = useState(null);
  const [taseronlar, setTaseronlar] = useState([]);
  const [yukleniyor, setYukleniyor] = useState(false);

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
        showSnackbar('Veriler yüklenirken hata oluştu', 'error');
      } finally {
        setYukleniyor(false);
      }
    };

    yukle();
  }, [seciliSantiye?.id, seciliBlok?.id, showSnackbar]);

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
          font: { bold: true, size: 12, color: { argb: 'FFFFFFFF' } },
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

      showSnackbar('Excel dosyası başarıyla oluşturuldu', 'success');
    } catch (error) {
      console.error('Excel export hatası:', error);
      showSnackbar('Excel dosyası oluşturulurken hata oluştu', 'error');
    }
  };

  const handleEksiklikSil = async (eksiklikId) => {
    try {
      await binaService.eksiklikSil(seciliSantiye.id, seciliBlok.id, eksiklikId);
      setEksiklikler(prev => prev.filter(e => e.id !== eksiklikId));
      showSnackbar('Eksiklik başarıyla silindi', 'success');
    } catch (error) {
      console.error('Eksiklik silinirken hata:', error);
      showSnackbar('Eksiklik silinirken hata oluştu', 'error');
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
        fotograflar: eksiklik.fotograflar || []
      };

      if (eksiklik.id) {
        await binaService.eksiklikGuncelle(seciliSantiye.id, seciliBlok.id, {
          ...eksiklikData,
          id: eksiklik.id
        });
        setEksiklikler(prev => prev.map(e => e.id === eksiklik.id ? {
          ...eksiklikData,
          id: eksiklik.id
        } : e));
      } else {
        const yeniEksiklik = await binaService.eksiklikEkle(seciliSantiye.id, seciliBlok.id, eksiklikData);
        setEksiklikler(prev => [...prev, yeniEksiklik]);
      }
      setFormModalAcik(false);
      showSnackbar('Eksiklik başarıyla kaydedildi', 'success');
    } catch (error) {
      console.error('Eksiklik kaydedilirken hata:', error);
      showSnackbar('Eksiklik kaydedilirken hata oluştu', 'error');
    }
  };

  const istatistikler = {
    toplam: eksiklikler.length,
    yeni: eksiklikler.filter(e => e.durum === 'YENI').length,
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
    <Box sx={{ p: 3 }}>
      {!seciliSantiye || !seciliBlok ? (
        <Typography variant="body1" color="text.secondary" align="center">
          Lütfen önce bir şantiye ve blok seçin
        </Typography>
      ) : yukleniyor ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <EksiklikIstatistikKartlari istatistikler={istatistikler} />
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                height: '80vh',
                display: 'flex', 
                flexDirection: 'column' 
              }}>
                <Typography variant="h6" gutterBottom>
                  Bina Görünümü
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Box sx={{ 
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'scroll',
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '8px',
                    '&:hover': {
                      background: '#666',
                    },
                  },
                }}>
                  <BinaGorunumu
                    binaYapisi={binaYapisi}
                    eksiklikler={eksiklikler}
                    seciliDaire={seciliDaire}
                    onDaireClick={handleDaireSecim}
                  />
                </Box>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Paper sx={{ 
                p: 2, 
                height: '80vh',
                display: 'flex', 
                flexDirection: 'column' 
              }}>
                <Typography variant="h6" gutterBottom>
                  Eksiklikler
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <EksiklikFiltrele
                  filtreler={filtreler}
                  setFiltreler={setFiltreler}
                  taseronlar={taseronlar}
                />

                <Box sx={{ 
                  flex: 1,
                  minHeight: 0,
                  overflowY: 'scroll',
                  mt: 2,
                  pr: 1,
                  '&::-webkit-scrollbar': {
                    width: '10px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '8px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '8px',
                    '&:hover': {
                      background: '#666',
                    },
                  },
                }}>
                  <EksiklikListesi
                    eksiklikler={filtrelenmisEksiklikler}
                    onDuzenle={(eksiklik) => {
                      setSeciliEksiklik(eksiklik);
                      setFormModalAcik(true);
                    }}
                    onSil={handleEksiklikSil}
                    taseronlar={taseronlar}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h4">
              {seciliBlok.ad} Blok - Eksiklik Yönetimi
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={() => {
                  setSeciliEksiklik(null);
                  setFormModalAcik(true);
                }}
              >
                Yeni Eksiklik
              </Button>
              <Button
                variant="outlined"
                startIcon={<ExportIcon />}
                onClick={handleExcelExport}
              >
                Excel'e Aktar
              </Button>
            </Box>
          </Box>

          <EksiklikFormModal
            open={formModalAcik}
            onClose={() => setFormModalAcik(false)}
            eksiklik={seciliEksiklik}
            onSave={handleEksiklikKaydet}
            taseronlar={taseronlar}
            binaYapisi={binaYapisi}
          />
        </>
      )}
    </Box>
  );
};

export default EksiklikYonetimi; 