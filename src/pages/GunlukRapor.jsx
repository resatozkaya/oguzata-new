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
import RaporCard from '../components/rapor/RaporCard';
import RaporForm from '../components/rapor/RaporForm';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const GunlukRapor = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useAuth();
  
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
      filtered = filtered.filter(rapor => rapor.santiye === filterSantiye);
    }

    if (filterFirma) {
      filtered = filtered.filter(rapor => rapor.firma === filterFirma);
    }

    if (filterDateStart && filterDateEnd) {
      filtered = filtered.filter(rapor => {
        const raporDate = new Date(rapor.createdAt);
        const startDate = new Date(filterDateStart);
        const endDate = new Date(filterDateEnd);
        return raporDate >= startDate && raporDate <= endDate;
      });
    }

    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(rapor =>
        rapor.yapilanIs.toLowerCase().includes(searchLower) ||
        rapor.personelAdi.toLowerCase().includes(searchLower) ||
        rapor.santiyeAdi.toLowerCase().includes(searchLower) ||
        (rapor.firma || '').toLowerCase().includes(searchLower)
      );
    }

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

      const allRaporlar = raporlarSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      allRaporlar.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

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
      alert("Düzenleme moduna geçerken bir hata oluştu!");
    }
  };

  const handleUpdateRapor = async () => {
    if (!selectedPersonel || !selectedSantiye || !yapilanIs) { 
      alert("Lütfen tüm alanları doldurunuz!");
      return;
    }
  
    try {
      const secilenPersonel = personelList.find((p) => p.id === selectedPersonel);
      const tarih = selectedDate || rapor.createdAt;
  
      const updatedRapor = {
        personelId: selectedPersonel,
        personelAdi: secilenPersonel?.adSoyad || "",
        statu: personelDetails.statu || "",
        firma: personelDetails.firma,
        calismaSekli: personelDetails.calismaSekli,
        santiye: selectedSantiye,
        yapilanIs,
        raporYazan: "Bilinmiyor",
        updatedAt: new Date(),
        updatedBy: currentUser.email
      };
  
      const raporRef = doc(db, "gunlukRaporlar", tarih, "raporlar", editRaporId);
      await updateDoc(raporRef, updatedRapor);
  
      setRaporList((prevList) =>
        prevList.map((rapor) =>
          rapor.id === editRaporId ? { ...rapor, ...updatedRapor } : rapor
        )
      );
  
      setEditMode(false);
      setEditRaporId(null);
      setSelectedPersonel("");
      setPersonelDetails({
        adSoyad: "",
        statu: "",
        firma: "",
        calismaSekli: ""
      });
      setSelectedSantiye("");
      setYapilanIs("");
  
      alert("Rapor başarıyla güncellendi!");
      
      if (selectedDate) {
        await fetchRaporlarByDate(selectedDate);
      } else {
        await fetchAllRaporlar();
      }
    } catch (error) {
      console.error("Rapor güncelleme hatası:", error);
      alert("Rapor güncellenirken bir hata oluştu!");
    }
  };

  const handleKaydet = async () => {
    if (!selectedPersonel || !selectedSantiye || !yapilanIs || !selectedDate) {
      alert("Lütfen tüm alanları doldurunuz!");
      return;
    }
  
    try {
      const secilenPersonel = personelList.find((p) => p.id === selectedPersonel);
      const tarih = selectedDate; 
  
      const newRapor = {
        personelId: selectedPersonel,
        personelAdi: secilenPersonel?.adSoyad || "",
        statu: personelDetails.statu || "",
        firma: personelDetails.firma,
        calismaSekli: personelDetails.calismaSekli,
        santiye: selectedSantiye,
        yapilanIs,
        raporYazan: "Bilinmiyor",
        createdAt: tarih, 
        createdBy: currentUser.email,
        userId: currentUser.id
      };
  
      await addDoc(collection(db, "gunlukRaporlar", tarih, "raporlar"), newRapor);
  
      setRaporList((prev) => [
        { id: new Date().getTime(), ...newRapor },
        ...prev,
      ]);
  
      setSelectedPersonel("");
      setSelectedSantiye("");
      setYapilanIs("");
      alert("Rapor başarıyla kaydedildi!");
    } catch (error) {
      console.error("Rapor kaydetme hatası:", error);
      alert("Rapor kaydedilirken bir hata oluştu!");
    }
  };

  const handleDelete = async (rapor) => {
    if (!window.confirm("Bu raporu silmek istediğinizden emin misiniz?")) {
      return;
    }
  
    try {
      const tarih = rapor.createdAt; 
      const raporId = rapor.id; 
  
      const raporRef = doc(db, "gunlukRaporlar", tarih, "raporlar", raporId);
  
      await deleteDoc(raporRef);
  
      setRaporList((prevList) =>
        prevList.filter((item) => item.id !== raporId)
      );
  
      alert("Rapor başarıyla silindi!");
  
      if (selectedDate) {
        await fetchRaporlarByDate(selectedDate);
      } else {
        await fetchAllRaporlar();
      }
    } catch (error) {
      console.error("Rapor silme hatası:", error.message); 
      alert("Rapor silinirken bir hata oluştu! Hata: " + error.message);
    }
  };

  const handleExcelExport = async () => {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Günlük Raporlar');

      // Stil tanımlamaları
      const headerStyle = {
        font: { bold: true, color: { argb: 'FFFFFF' } },
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A237E' } },
        alignment: { horizontal: 'center', vertical: 'middle' },
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      };

      const cellStyle = {
        border: {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        },
        alignment: { vertical: 'middle', wrapText: true }
      };

      // Sütun başlıkları
      worksheet.columns = [
        { header: 'Tarih', key: 'tarih', width: 15 },
        { header: 'Personel', key: 'personel', width: 20 },
        { header: 'Şantiye', key: 'santiye', width: 20 },
        { header: 'Firma', key: 'firma', width: 20 },
        { header: 'Yapılan İş', key: 'yapilanIs', width: 50 }
      ];

      // Başlık stillerini uygula
      worksheet.getRow(1).eachCell((cell) => {
        cell.style = headerStyle;
        cell.height = 30;
      });

      // Verileri tarihe ve firmaya göre sırala
      const sortedRaporlar = [...filteredRaporList].sort((a, b) => {
        // Önce tarihe göre sırala (yeniden eskiye)
        const dateA = new Date(a.tarih || a.createdAt);
        const dateB = new Date(b.tarih || b.createdAt);
        if (dateB - dateA !== 0) return dateB - dateA;

        // Aynı tarihte olanları firmaya göre sırala
        const firmaA = (a.firma || '').toLowerCase();
        const firmaB = (b.firma || '').toLowerCase();
        return firmaA.localeCompare(firmaB);
      });

      // Gruplandırılmış verileri ekle
      let currentDate = null;
      let currentFirma = null;

      sortedRaporlar.forEach((rapor) => {
        const raporDate = format(new Date(rapor.tarih || rapor.createdAt), 'dd.MM.yyyy');
        
        // Yeni tarih başladığında boş satır ekle
        if (currentDate !== raporDate) {
          if (currentDate !== null) {
            worksheet.addRow([]); // Tarihler arası boş satır
          }
          currentDate = raporDate;
          currentFirma = null;
        }

        // Aynı tarihte farklı firma başladığında hafif boşluk bırak
        if (currentFirma !== rapor.firma && currentFirma !== null) {
          const spacerRow = worksheet.addRow([]);
          spacerRow.height = 10;
        }
        currentFirma = rapor.firma;

        const row = worksheet.addRow({
          tarih: raporDate,
          personel: rapor.personelAdi,
          santiye: rapor.santiye,
          firma: rapor.firma || '-',
          yapilanIs: rapor.yapilanIs
        });

        // Her hücreye stil uygula
        row.eachCell((cell) => {
          cell.style = cellStyle;
        });
        row.height = 25;
      });

      // Özet bilgiler
      worksheet.addRow([]);
      worksheet.addRow([]);
      
      const summaryStyle = {
        font: { bold: true },
        alignment: { horizontal: 'left' }
      };

      const summaryRow = worksheet.addRow(['Rapor Özeti']);
      summaryRow.getCell(1).style = summaryStyle;
      
      worksheet.addRow([`Toplam Rapor: ${filteredRaporList.length}`]);
      worksheet.addRow([`Oluşturulma Tarihi: ${format(new Date(), 'dd.MM.yyyy HH:mm')}`]);

      if (filterPersonel || filterSantiye || filterFirma || filterDateStart || filterDateEnd) {
        worksheet.addRow(['']);
        const filterRow = worksheet.addRow(['Uygulanan Filtreler:']);
        filterRow.getCell(1).style = summaryStyle;

        if (filterPersonel) {
          const personel = personelList.find(p => p.id === filterPersonel);
          worksheet.addRow([`Personel: ${personel?.adSoyad || ''}`]);
        }
        if (filterSantiye) {
          const santiye = santiyeList.find(s => s.id === filterSantiye);
          worksheet.addRow([`Şantiye: ${santiye?.ad || ''}`]);
        }
        if (filterFirma) {
          worksheet.addRow([`Firma: ${filterFirma}`]);
        }
        if (filterDateStart && filterDateEnd) {
          worksheet.addRow([`Tarih Aralığı: ${filterDateStart} - ${filterDateEnd}`]);
        }
      }

      // Excel dosyasını oluştur ve indir
      const buffer = await workbook.xlsx.writeBuffer();
      const fileName = `Gunluk_Raporlar_${format(new Date(), 'dd_MM_yyyy')}.xlsx`;
      saveAs(new Blob([buffer]), fileName);

    } catch (error) {
      console.error('Excel export hatası:', error);
      alert('Excel dosyası oluşturulurken bir hata oluştu!');
    }
  };

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
                  onChange={(e) => setFilterSantiye(e.target.value)}
                  label="Şantiye Filtresi"
                >
                  <MenuItem value="">Tümü</MenuItem>
                  {santiyeList.map((santiye) => (
                    <MenuItem key={santiye.id} value={santiye.id}>
                      {santiye.ad}
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
              <Button
                variant="contained"
                onClick={editMode ? handleUpdateRapor : handleKaydet}
                startIcon={<AddIcon />}
              >
                {editMode ? "Güncelle" : "Kaydet"}
              </Button>
              
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
            <RaporCard
              rapor={rapor}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
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
          {editingRapor ? 'Raporu Düzenle' : 'Yeni Rapor'}
        </DialogTitle>
        <DialogContent>
          <RaporForm
            onSubmit={editMode ? handleUpdateRapor : handleKaydet}
            initialData={editingRapor}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default GunlukRapor;