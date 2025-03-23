import React, { useState, useEffect, useMemo, useCallback } from "react";
import { collection, getDocs, addDoc, query, orderBy, where, doc, updateDoc, deleteDoc, serverTimestamp, collectionGroup } from "firebase/firestore";
import { db } from "../config/firebase";
import { useNavigate } from 'react-router-dom';
import { saveAs } from "file-saver";
import ExcelJS from 'exceljs';
import {
  Box,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Card,
  CardContent,
  CardActions,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import SearchIcon from '@mui/icons-material/Search';
import { useTheme } from '@mui/material/styles';
import RaporForm from '../components/rapor/RaporForm';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import { enqueueSnackbar } from 'notistack';
import { format } from 'date-fns';

const GunlukRapor = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();
  
  // Yetki kontrolleri
  const canView = hasPermission('gunluk_rapor_view');
  const canEdit = hasPermission('gunluk_rapor_update');
  const canCreate = hasPermission('gunluk_rapor_create');
  const canDelete = hasPermission('gunluk_rapor_delete');
  const isYonetim = hasPermission('YONETIM');

  // Rapor yetki kontrolü için yardımcı fonksiyon
  const canManageReport = (rapor) => {
    if (isYonetim) return true; // YÖNETİM rolü tüm raporları yönetebilir
    return rapor.createdBy === currentUser.email; // Diğer kullanıcılar sadece kendi raporlarını
  };

  // Sayfa yetkisi kontrolü
  useEffect(() => {
    if (!canView) {
      enqueueSnackbar('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      navigate('/');
      return;
    }
  }, [canView, navigate]);

  const [personelList, setPersonelList] = useState([]);
  const [santiyeList, setSantiyeList] = useState([]);
  const [selectedPersonel, setSelectedPersonel] = useState("");
  const [personelDetails, setPersonelDetails] = useState({
    adSoyad: "",
    statu: "",
    firma: "",
    calismaSekli: "",
  });
  const [selectedSantiye, setSelectedSantiye] = useState("");
  const [yapilanIs, setYapilanIs] = useState("");
  const [raporList, setRaporList] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editRaporId, setEditRaporId] = useState(null);

  const [filterPersonel, setFilterPersonel] = useState("");
  const [filterSantiye, setFilterSantiye] = useState("");
  const [filterFirma, setFilterFirma] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [searchText, setSearchText] = useState("");
  const [filteredRaporList, setFilteredRaporList] = useState([]);

  const [open, setOpen] = useState(false);
  const [editingRapor, setEditingRapor] = useState(null);

  const [firmaList, setFirmaList] = useState([]);

  const applyFilters = useCallback(() => {
    let filtered = [...raporList];

    if (filterPersonel) {
      filtered = filtered.filter(rapor => rapor.personelId === filterPersonel);
    }

    if (filterSantiye) {
      filtered = filtered.filter(rapor => {
        const santiyeValue = String(filterSantiye).toLowerCase().trim();
        const santiyeAdi = String(rapor.santiyeAdi || '').toLowerCase().trim();
        const santiye = String(rapor.santiye || '').toLowerCase().trim();
        return santiyeAdi === santiyeValue || 
               (!rapor.santiyeAdi && !santiye.includes('_') && santiye === santiyeValue);
      });
    }

    if (filterFirma) {
      filtered = filtered.filter(rapor => rapor.firma === filterFirma);
    }

    if (filterDateStart && filterDateEnd) {
      filtered = filtered.filter(rapor => {
        const raporDate = new Date(rapor.createdAt);
        raporDate.setHours(0, 0, 0, 0);
        
        const startDate = new Date(filterDateStart);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(filterDateEnd);
        endDate.setHours(23, 59, 59, 999);
        
        return raporDate >= startDate && raporDate <= endDate;
      });
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(rapor =>
        (rapor.yapilanIs || '').toLowerCase().includes(searchLower) ||
        (rapor.personelAdi || '').toLowerCase().includes(searchLower) ||
        (rapor.santiyeAdi || rapor.santiye || '').toLowerCase().includes(searchLower) ||
        (rapor.firma || '').toLowerCase().includes(searchLower)
      );
    }

    // Tarihe göre sırala - en yeniden eskiye
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    setFilteredRaporList(filtered);
  }, [raporList, filterPersonel, filterSantiye, filterFirma, filterDateStart, filterDateEnd, searchText]);

  const clearFilters = () => {
    setFilterPersonel("");
    setFilterSantiye("");
    setFilterFirma("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setSearchText("");
  };

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    setFilteredRaporList(raporList);
  }, [raporList]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const personelSnapshot = await getDocs(collection(db, "personeller"));
        const personelData = personelSnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
            adSoyad: `${doc.data().ad} ${doc.data().soyad}`
          }))
          .sort((a, b) => a.adSoyad.localeCompare(b.adSoyad));
  
        setPersonelList(personelData);
  
        const santiyeSnapshot = await getDocs(collection(db, "santiyeler"));
        const santiyeData = santiyeSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setSantiyeList(santiyeData);
  
        await fetchAllRaporlar();
      } catch (error) {
        console.error("Veri çekme hatası:", error);
      }
    };
  
    fetchData();
  }, []);

  useEffect(() => {
    const firmalar = [...new Set(personelList.map(p => p.firma).filter(Boolean))];
    setFirmaList(firmalar.sort());
  }, [personelList]);

  // Benzersiz şantiye adlarını al
  const santiyeAdlari = useMemo(() => {
    const adlar = new Set();
    raporList.forEach(rapor => {
      // Öncelikle santiyeAdi'ni kontrol et
      if (rapor.santiyeAdi && rapor.santiyeAdi.trim()) {
        adlar.add(rapor.santiyeAdi.trim());
      }
      // Eğer santiyeAdi yoksa ve santiye bir ID değilse, santiye'yi kullan
      else if (rapor.santiye && !rapor.santiye.includes('_') && rapor.santiye.trim()) {
        adlar.add(rapor.santiye.trim());
      }
    });
    return Array.from(adlar).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [raporList]);

  const fetchRaporlarByDate = async (date) => {
    try {
      const raporlarRef = collection(db, "gunlukRaporlar", date, "raporlar");
      const raporlarSnapshot = await getDocs(raporlarRef);
  
      const raporlar = raporlarSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      setRaporList(raporlar);
    } catch (error) {
      console.error("Tarihli rapor çekme hatası:", error);
      alert("Seçilen tarihe ait raporlar alınırken hata oluştu!");
    }
  };

  const generateRandomColor = () => {
    const colors = [
      "bg-red-200",
      "bg-blue-200",
      "bg-green-200",
      "bg-yellow-200",
      "bg-purple-200",
      "bg-teal-200",
      "bg-pink-200",
      "bg-orange-200",
      "bg-indigo-200",
      "bg-gray-200",
      "bg-lime-200",
      "bg-cyan-200",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const colorMap = useMemo(() => {
    const map = {};
    raporList.forEach((rapor) => {
      if (!map[rapor.firma]) {
        map[rapor.firma] = generateRandomColor();
      }
    });
    return map;
  }, [raporList]);

  const fetchAllRaporlar = async () => {
    try {
      const gunlukRaporlarRef = collectionGroup(db, "raporlar");
      const raporlarSnapshot = await getDocs(gunlukRaporlarRef);

      const allRaporlar = raporlarSnapshot.docs.map((doc) => {
        const data = doc.data();
        // Firestore timestamp'i varsa Date objesine çevir
        if (data.createdAt && typeof data.createdAt === 'object' && data.createdAt.toDate) {
          data.createdAt = data.createdAt.toDate();
        }
        return {
          id: doc.id,
          ...data
        };
      });

      // Tarihe göre sırala - en yeniden eskiye
      allRaporlar.sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateB - dateA;
      });

      setRaporList(allRaporlar);
    } catch (error) {
      console.error("Tüm raporları çekme hatası:", error);
      alert("Raporları alırken bir hata oluştu!");
    }
  };

  const handlePersonelChange = (e) => {
    const personelId = e.target.value;
    const personel = personelList.find((p) => p.id === personelId);
    setSelectedPersonel(personelId);
    if (personel) {
      setPersonelDetails({
        adSoyad: personel.adSoyad,
        statu: personel["statü"] || personel["statu"] || "", 
        firma: personel.firma || "",
        calismaSekli: personel.calismaSekli || "",
      });
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value; 
    setSelectedDate(date);
    if (date) {
      fetchRaporlarByDate(date); 
    } else {
      fetchAllRaporlar(); 
    }
  };

  const handleEdit = (rapor) => {
    if (!canEdit) {
      enqueueSnackbar('Rapor düzenleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }

    if (!canManageReport(rapor)) {
      enqueueSnackbar('Sadece kendi raporlarınızı düzenleyebilirsiniz.', { variant: 'error' });
      return;
    }

    try {
      setEditMode(true);
      setEditRaporId(rapor.id);

      setSelectedPersonel(rapor.personelId);
      setSelectedSantiye(rapor.santiye);
      setYapilanIs(rapor.yapilanIs);

      if (rapor.createdAt) {
        const tarihObj = new Date(rapor.createdAt);
        const formattedDate = tarihObj.toISOString().split('T')[0];
        setSelectedDate(formattedDate);
      }

      setPersonelDetails({
        adSoyad: rapor.personelAdi || '',
        statu: rapor.statu || '',
        firma: rapor.firma || '',
        calismaSekli: rapor.calismaSekli || ''
      });

    } catch (error) {
      console.error("Düzenleme hatası:", error);
      enqueueSnackbar("Düzenleme moduna geçerken bir hata oluştu!", { variant: "error" });
    }
  };

  const handleSave = async () => {
    if (!canCreate) {
      enqueueSnackbar('Rapor oluşturma yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }

    if (!selectedPersonel || !selectedSantiye || !yapilanIs || !selectedDate) {
      enqueueSnackbar("Lütfen tüm alanları doldurun!", { variant: 'warning' });
      return;
    }
  
    try {
      const secilenPersonel = personelList.find((p) => p.id === selectedPersonel);
      const secilenSantiye = santiyeList.find((s) => s.id === selectedSantiye);
      
      const tarih = new Date(selectedDate);
      tarih.setHours(12, 0, 0, 0); // Saat farkı sorunlarını önlemek için saati 12:00'ye ayarla
  
      const newRapor = {
        personelId: selectedPersonel,
        personelAdi: secilenPersonel?.adSoyad || "",
        statu: personelDetails.statu || "",
        firma: personelDetails.firma,
        calismaSekli: personelDetails.calismaSekli,
        santiye: selectedSantiye,
        santiyeAdi: secilenSantiye?.ad || selectedSantiye,
        yapilanIs,
        raporYazan: "Bilinmiyor",
        createdAt: tarih,
        createdBy: currentUser.email,
        userId: currentUser.id
      };
  
      const raporRef = collection(db, "gunlukRaporlar", format(tarih, 'yyyy-MM-dd'), "raporlar");
      await addDoc(raporRef, newRapor);
  
      setSelectedPersonel("");
      setSelectedSantiye("");
      setYapilanIs("");
      setPersonelDetails({
        adSoyad: "",
        statu: "",
        firma: "",
        calismaSekli: ""
      });
      enqueueSnackbar("Rapor başarıyla kaydedildi!", { variant: 'success' });
      
      // Yeni raporu ekledikten sonra listeyi güncelle
      await fetchAllRaporlar();
    } catch (error) {
      console.error("Rapor kaydetme hatası:", error);
      enqueueSnackbar("Rapor kaydedilirken hata oluştu", { variant: "error" });
    }
  };

  const handleUpdate = async () => {
    if (!canEdit) {
      enqueueSnackbar('Rapor düzenleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }

    if (!editRaporId || !selectedPersonel || !selectedSantiye || !yapilanIs) {
      enqueueSnackbar("Lütfen tüm alanları doldurun!", { variant: 'warning' });
      return;
    }
  
    try {
      const secilenPersonel = personelList.find((p) => p.id === selectedPersonel);
      const secilenSantiye = santiyeList.find((s) => s.id === selectedSantiye);
      
      const tarih = new Date(selectedDate);
      tarih.setHours(12, 0, 0, 0); // Saat farkı sorunlarını önlemek için saati 12:00'ye ayarla
  
      const updatedRapor = {
        personelId: selectedPersonel,
        personelAdi: secilenPersonel?.adSoyad || "",
        statu: personelDetails.statu || "",
        firma: personelDetails.firma,
        calismaSekli: personelDetails.calismaSekli,
        santiye: selectedSantiye,
        santiyeAdi: secilenSantiye?.ad || selectedSantiye,
        yapilanIs,
        raporYazan: "Bilinmiyor",
        updatedAt: new Date(),
      };
  
      const raporRef = doc(db, "gunlukRaporlar", format(tarih, 'yyyy-MM-dd'), "raporlar", editRaporId);
      await updateDoc(raporRef, updatedRapor);
  
      setEditMode(false);
      setEditRaporId(null);
      setSelectedPersonel("");
      setSelectedSantiye("");
      setYapilanIs("");
      setPersonelDetails({
        adSoyad: "",
        statu: "",
        firma: "",
        calismaSekli: ""
      });
      enqueueSnackbar("Rapor başarıyla güncellendi!", { variant: 'success' });
      
      // Güncellemeden sonra listeyi yenile
      await fetchAllRaporlar();
    } catch (error) {
      console.error("Rapor güncelleme hatası:", error);
      enqueueSnackbar("Rapor güncellenirken hata oluştu", { variant: "error" });
    }
  };

  const handleDelete = async (rapor) => {
    if (!canDelete) {
      enqueueSnackbar('Rapor silme yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }

    if (!canManageReport(rapor)) {
      enqueueSnackbar('Sadece kendi raporlarınızı silebilirsiniz.', { variant: 'error' });
      return;
    }

    if (!window.confirm("Bu raporu silmek istediğinizden emin misiniz?")) {
      return;
    }
  
    try {
      // Tarih kontrolü ve formatlaması
      let tarihStr;
      if (rapor.createdAt) {
        const tarih = new Date(rapor.createdAt);
        if (isNaN(tarih.getTime())) {
          throw new Error('Geçersiz tarih');
        }
        tarihStr = format(tarih, 'yyyy-MM-dd');
      } else {
        throw new Error('Rapor tarihi bulunamadı');
      }

      // Silme işlemi
      const raporRef = doc(db, "gunlukRaporlar", tarihStr, "raporlar", rapor.id);
      await deleteDoc(raporRef);

      // UI'dan kaldır
      setRaporList(prevList => prevList.filter(r => r.id !== rapor.id));
      
      enqueueSnackbar("Rapor başarıyla silindi!", { variant: 'success' });
    } catch (error) {
      console.error("Rapor silme hatası:", error);
      enqueueSnackbar("Rapor silinirken hata oluştu", { variant: "error" });
    }
  };

  const handleExcelExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Raporlar');

      // Başlıkları ayarla
      worksheet.columns = [
        { header: 'Tarih', key: 'tarih', width: 15 },
        { header: 'Personel', key: 'personel', width: 20 },
        { header: 'Şantiye', key: 'santiye', width: 20 },
        { header: 'Firma', key: 'firma', width: 20 },
        { header: 'Yapılan İş', key: 'yapilanIs', width: 50 }
      ];

      // Filtre bilgilerini ekle
      worksheet.addRow(['Filtre Bilgileri:']);
      if (filterPersonel) {
        const personel = personelList.find(p => p.id === filterPersonel);
        worksheet.addRow([`Personel: ${personel?.adSoyad || ''}`]);
      }
      if (filterSantiye) {
        worksheet.addRow([`Şantiye: ${filterSantiye}`]);
      }
      if (filterFirma) {
        worksheet.addRow([`Firma: ${filterFirma}`]);
      }
      if (filterDateStart && filterDateEnd) {
        worksheet.addRow([`Tarih Aralığı: ${format(new Date(filterDateStart), 'dd.MM.yyyy')} - ${format(new Date(filterDateEnd), 'dd.MM.yyyy')}`]);
      }
      worksheet.addRow([]);

      // Verileri ekle
      filteredRaporList.forEach(rapor => {
        const raporDate = formatDate(rapor.createdAt);
        worksheet.addRow({
          tarih: raporDate,
          personel: rapor.personelAdi,
          santiye: rapor.santiyeAdi || rapor.santiye,
          firma: rapor.firma || '-',
          yapilanIs: rapor.yapilanIs
        });
      });

      // Excel dosyasını oluştur ve indir
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Raporlar_${format(new Date(), 'dd.MM.yyyy')}.xlsx`);

    } catch (error) {
      console.error("Excel export hatası:", error);
      enqueueSnackbar("Excel dosyası oluşturulurken hata oluştu", { variant: "error" });
    }
  };

  // Tarih formatlama yardımcı fonksiyonu
  const formatDate = (dateValue) => {
    try {
      if (!dateValue) return 'Tarih belirtilmemiş';
      
      let date;
      // Firestore Timestamp kontrolü
      if (dateValue && typeof dateValue === 'object' && dateValue.toDate) {
        date = dateValue.toDate();
      } 
      // String veya Date objesi kontrolü
      else if (typeof dateValue === 'string' || dateValue instanceof Date) {
        date = new Date(dateValue);
      }
      
      if (!date || isNaN(date.getTime())) {
        console.error('Geçersiz tarih değeri:', dateValue);
        return 'Geçersiz tarih';
      }
      
      // Türkçe ay isimleri
      const aylar = [
        'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
        'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
      ];
      
      return `${date.getDate()} ${aylar[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error, dateValue);
      return 'Geçersiz tarih';
    }
  };

  // Ay bazlı gruplandırma için yardımcı fonksiyon
  const groupByMonth = useMemo(() => {
    const groups = {};
    filteredRaporList.forEach((rapor) => {
      try {
        if (!rapor.createdAt) return;
        
        const date = new Date(rapor.createdAt);
        if (isNaN(date.getTime())) return;
        
        const monthYear = format(date, 'MMMM yyyy');
        if (!groups[monthYear]) {
          groups[monthYear] = [];
        }
        groups[monthYear].push(rapor);
      } catch (error) {
        console.error('Rapor gruplandırılırken hata:', error, rapor);
      }
    });
    return groups;
  }, [filteredRaporList]);

  return (
    <Box sx={{ p: 3 }}>
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 3, 
          backgroundColor: theme.palette.mode === 'dark' ? 'background.paper' : 'grey.50',
          borderRadius: 2
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
          Günlük Rapor
        </Typography>

        {/* Filtreleme Bölümü */}
        <Paper 
          sx={{ 
            p: 2, 
            mb: 3, 
            bgcolor: 'background.paper',
            borderRadius: 1
          }}
        >
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Filtreler
              </Typography>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Personel Filtresi</InputLabel>
                <Select
                  value={filterPersonel}
                  onChange={(e) => setFilterPersonel(e.target.value)}
                  label="Personel Filtresi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {personelList.map((personel) => (
                    <MenuItem key={personel.id} value={personel.id}>
                      {personel.adSoyad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Şantiye Filtresi</InputLabel>
                <Select
                  value={filterSantiye}
                  label="Şantiye"
                  onChange={(e) => setFilterSantiye(e.target.value)}
                >
                  <MenuItem value="">
                    <em>Hepsi</em>
                  </MenuItem>
                  {santiyeAdlari.map((ad) => (
                    <MenuItem key={ad} value={ad}>
                      {ad}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Firma Filtresi</InputLabel>
                <Select
                  value={filterFirma}
                  onChange={(e) => setFilterFirma(e.target.value)}
                  label="Firma Filtresi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {firmaList.map((firma) => (
                    <MenuItem key={firma} value={firma}>
                      {firma}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Başlangıç Tarihi"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="Bitiş Tarihi"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={clearFilters}
                  size="medium"
                >
                  Temizle
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Rapor içeriğinde ara..."
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        </Paper>

        {/* Form Bölümü */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Personel</InputLabel>
              <Select
                value={selectedPersonel}
                onChange={handlePersonelChange}
                label="Personel"
                sx={{ bgcolor: 'background.paper' }}
              >
                {personelList.map((personel) => (
                  <MenuItem key={personel.id} value={personel.id}>
                    {personel.adSoyad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Şantiye</InputLabel>
              <Select
                value={selectedSantiye}
                onChange={(e) => setSelectedSantiye(e.target.value)}
                label="Şantiye"
                sx={{ bgcolor: 'background.paper' }}
              >
                {santiyeList.map((santiye) => (
                  <MenuItem key={santiye.id} value={santiye.id}>
                    {santiye.ad}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              label="Tarih"
              InputLabelProps={{ shrink: true }}
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={yapilanIs}
              onChange={(e) => setYapilanIs(e.target.value)}
              label="Yapılan İş"
              sx={{ bgcolor: 'background.paper' }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {canCreate && (
                <Button
                  variant="contained"
                  onClick={editMode ? handleUpdate : handleSave}
                  startIcon={<AddIcon />}
                >
                  {editMode ? "Güncelle" : "Kaydet"}
                </Button>
              )}
              
              {editMode && (
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditMode(false);
                    setEditRaporId(null);
                    setSelectedPersonel("");
                    setSelectedSantiye("");
                    setYapilanIs("");
                  }}
                  color="secondary"
                >
                  İptal
                </Button>
              )}

              <Button
                variant="contained"
                onClick={handleExcelExport}
                startIcon={<FileDownloadIcon />}
                color="success"
              >
                Excel'e Aktar
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={2}>
        {filteredRaporList.map((rapor) => (
          <Grid item xs={12} md={6} key={rapor.id}>
            <Card sx={{ mb: 2, bgcolor: 'background.paper' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {rapor.personelAdi}
                  </Typography>
                  <Typography color="text.secondary">
                    {formatDate(rapor.createdAt)}
                  </Typography>
                </Box>

                <Typography color="text.secondary" gutterBottom>
                  {rapor.santiyeAdi || rapor.santiye || 'Şantiye belirtilmemiş'}
                </Typography>

                <Typography variant="body1">
                  {rapor.yapilanIs}
                </Typography>

                {rapor.firma && (
                  <Typography color="text.secondary" sx={{ mt: 1 }}>
                    Firma: {rapor.firma}
                  </Typography>
                )}
              </CardContent>
              <CardActions sx={{ justifyContent: 'flex-end' }}>
                {canEdit && canManageReport(rapor) && (
                  <IconButton 
                    size="small" 
                    onClick={() => handleEdit(rapor)}
                  >
                    <EditIcon />
                  </IconButton>
                )}
                {canDelete && canManageReport(rapor) && (
                  <IconButton 
                    size="small" 
                    onClick={() => handleDelete(rapor)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditingRapor(null);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editMode ? 'Raporu Düzenle' : 'Yeni Rapor'}
        </DialogTitle>
        <DialogContent>
          <RaporForm
            onSubmit={editMode ? handleUpdate : handleSave}
            initialData={editingRapor}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GunlukRapor;