import React, { useState, useEffect, useRef } from "react";
import { collection, getDoc, getDocs, doc, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";
import { Box, CircularProgress, Button, Select, MenuItem, FormControl, InputLabel, Dialog, DialogTitle, DialogContent, Typography, TextField, useTheme } from "@mui/material";
import { enqueueSnackbar } from 'notistack';
import { useTheme as useCustomTheme } from "../contexts/ThemeContext";
import { usePermission } from "../contexts/PermissionContext";
import html2pdf from 'html2pdf.js';

const Puantaj = () => {
  const { hasPermission } = usePermission();
  const pdfRef = useRef();
  const theme = useTheme();
  const { sidebarColor } = useCustomTheme();
  const isDarkMode = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 20 }, (_, i) => currentYear + i);
  const months = [
    "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
    "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"
  ];

  // State tanımlamaları
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedSantiye, setSelectedSantiye] = useState("");
  const [selectedCalismaSekli, setSelectedCalismaSekli] = useState("TÜMÜ");
  const [santiyeler, setSantiyeler] = useState([]);
  const [daysInMonth, setDaysInMonth] = useState([]);
  const [personelList, setPersonelList] = useState([]);
  const [filteredPersonelList, setFilteredPersonelList] = useState([]);
  const [allPuantajData, setAllPuantajData] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPersonelName, setSelectedPersonelName] = useState("");

  // Yetki kontrolleri
  const canView = hasPermission('puantaj_view');
  const canEdit = hasPermission('puantaj_update');
  const canCreate = hasPermission('puantaj_create');
  const canDelete = hasPermission('puantaj_delete');

  // Puantaj durumları
  const PUANTAJ_DURUMLARI = {
    "bos": {
      color: "bg-white",
      textColor: "text-gray-700",
      description: "Boş",
      value: 0,
      buttonColor: "#FFFFFF"
    },
    "tam": { 
      color: "bg-green-500", 
      textColor: "text-white", 
      description: "Tam Gün", 
      value: 1,
      buttonColor: "#4CAF50"
    },
    "yarim": { 
      color: "bg-yellow-500", 
      textColor: "text-white", 
      description: "Yarım Gün", 
      value: 0.5,
      buttonColor: "#FFC107"
    },
    "mesai": { 
      color: "bg-red-500", 
      textColor: "text-white", 
      description: "Mesai", 
      value: 1.5,
      buttonColor: "#F44336"
    },
    "pazar": { 
      color: "bg-gray-500", 
      textColor: "text-white", 
      description: "Pazar", 
      value: 1,
      buttonColor: "#757575"
    },
    "izinli": { 
      color: "bg-cyan-500", 
      textColor: "text-white", 
      description: "İzinli", 
      value: 0,
      buttonColor: "#00BCD4"
    },
    "raporlu": { 
      color: "bg-purple-500", 
      textColor: "text-white", 
      description: "Raporlu", 
      value: 0,
      buttonColor: "#9C27B0"
    },
    "resmiTatil": { 
      color: "bg-pink-500", 
      textColor: "text-white", 
      description: "Resmi Tatil", 
      value: 1,
      buttonColor: "#E91E63"
    },
    "temizle": {
      color: "bg-white",
      textColor: "text-gray-700",
      description: "Temizle",
      value: 0,
      buttonColor: "#FFFFFF"
    }
  };

  // Pazar günlerini kontrol et
  const isPazarGunu = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0; // 0 = Pazar
  };

  // Şantiyeleri çek
  useEffect(() => {
    const fetchSantiyeler = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "santiyeler"));
        const fetchedSantiyeler = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
        setSantiyeler(fetchedSantiyeler);
        if (fetchedSantiyeler.length > 0 && !selectedSantiye) {
          setSelectedSantiye(fetchedSantiyeler[0].id);
        }
      } catch (error) {
        console.error("Şantiye verileri çekilirken hata:", error);
        enqueueSnackbar("Şantiye verileri çekilirken hata oluştu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchSantiyeler();
  }, []);

  // Personel verilerini çek
  useEffect(() => {
    const fetchPersonel = async () => {
      setLoading(true);
      try {
        const querySnapshot = await getDocs(collection(db, "personeller"));
        const fetchedData = querySnapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data()
          }))
          .filter(personel => personel.aktif === true); // Sadece aktif personelleri al
        
        const sortedData = fetchedData.sort((a, b) => 
          (a.ad + ' ' + a.soyad).localeCompare(b.ad + ' ' + b.soyad)
        );
        setPersonelList(sortedData);
        setFilteredPersonelList(sortedData);
      } catch (error) {
        console.error("Personel verileri çekilirken hata:", error);
        enqueueSnackbar("Personel verileri çekilirken hata oluştu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    fetchPersonel();
  }, []);

  // Gün sayısını hesapla
  useEffect(() => {
    const days = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    setDaysInMonth(Array.from({ length: days }, (_, i) => i + 1));
  }, [selectedYear, selectedMonth]);

  // Puantaj verilerini çek
  useEffect(() => {
    const fetchAllPuantaj = async () => {
      if (!selectedSantiye) return;
      
      setLoading(true);
      try {
        const allData = {};
        for (const santiye of santiyeler) {
          const currentDocId = `${selectedYear}-${selectedMonth + 1}-${santiye.ad}`;
          const puantajDoc = await getDoc(doc(db, "puantaj", currentDocId));
          
          if (puantajDoc.exists()) {
            const santiyeData = puantajDoc.data();
            Object.entries(santiyeData).forEach(([personelName, gunler]) => {
              if (!allData[personelName]) {
                allData[personelName] = {};
              }
              Object.entries(gunler).forEach(([gun, deger]) => {
                allData[personelName][gun] = {
                  ...deger,
                  santiyeKod: santiye.kod
                };
              });
            });
          }
        }
        setAllPuantajData(allData);
      } catch (error) {
        console.error("Puantaj verileri çekilirken hata:", error);
        enqueueSnackbar("Puantaj verileri çekilirken hata oluştu", { variant: "error" });
      } finally {
        setLoading(false);
      }
    };

    if (santiyeler.length > 0) {
      fetchAllPuantaj();
    }
  }, [selectedSantiye, selectedYear, selectedMonth, santiyeler]);

  // Personel filtreleme
  useEffect(() => {
    const filteredList = personelList.filter((personel) => {
      const calismaSekliUygun = selectedCalismaSekli === "TÜMÜ" || personel.calismaSekli === selectedCalismaSekli;
      const isimUygun = searchTerm === "" || 
        `${personel.ad} ${personel.soyad}`.toLowerCase().includes(searchTerm.toLowerCase());
      return calismaSekliUygun && isimUygun;
    });

    setFilteredPersonelList(filteredList);
  }, [personelList, selectedCalismaSekli, searchTerm]);

  // Hücre tıklama işleyicisi
  const handleCellClick = (personelName, day) => {
    if (!canEdit) {
      enqueueSnackbar('Puantaj düzenleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }
    setSelectedPersonelName(personelName);
    setSelectedDay(day);
    setDialogOpen(true);
  };

  // Puantaj kaydetme işleyicisi
  const handleSavePuantaj = async (status) => {
    if (!canEdit) {
      enqueueSnackbar('Puantaj düzenleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      return;
    }

    try {
      if (!selectedSantiye) {
        enqueueSnackbar("Lütfen şantiye seçimi yapın", { variant: "warning" });
        return;
      }

      const selectedSantiyeInfo = santiyeler.find(s => s.id === selectedSantiye);
      const docId = `${selectedYear}-${selectedMonth + 1}-${selectedSantiyeInfo.ad}`;

      // Temizle seçeneği için tüm şantiyelerden veriyi sil
      if (status === 'temizle') {
        for (const santiye of santiyeler) {
          const santiyeDocId = `${selectedYear}-${selectedMonth + 1}-${santiye.ad}`;
          const puantajDoc = await getDoc(doc(db, "puantaj", santiyeDocId));
          
          if (puantajDoc.exists()) {
            const santiyeData = puantajDoc.data();
            if (santiyeData[selectedPersonelName]?.[selectedDay]) {
              const updatedData = { ...santiyeData };
              delete updatedData[selectedPersonelName][selectedDay];
              await setDoc(doc(db, "puantaj", santiyeDocId), updatedData);
            }
          }
        }
        setDialogOpen(false);
        enqueueSnackbar("Puantaj temizlendi", { variant: "success" });
      } else {
        // Diğer durumlar için normal kayıt işlemi
        // Önceki kayıtları temizle
        for (const santiye of santiyeler) {
          const santiyeDocId = `${selectedYear}-${selectedMonth + 1}-${santiye.ad}`;
          const puantajDoc = await getDoc(doc(db, "puantaj", santiyeDocId));
          
          if (puantajDoc.exists()) {
            const santiyeData = puantajDoc.data();
            if (santiyeData[selectedPersonelName]?.[selectedDay]) {
              const updatedData = { ...santiyeData };
              delete updatedData[selectedPersonelName][selectedDay];
              await setDoc(doc(db, "puantaj", santiyeDocId), updatedData);
            }
          }
        }

        // Yeni veriyi kaydet
        const puantajDoc = await getDoc(doc(db, "puantaj", docId));
        const currentSantiyeData = puantajDoc.exists() ? puantajDoc.data() : {};
        
        const updatedSantiyeData = { ...currentSantiyeData };
        if (!updatedSantiyeData[selectedPersonelName]) {
          updatedSantiyeData[selectedPersonelName] = {};
        }

        updatedSantiyeData[selectedPersonelName][selectedDay] = {
          status: status,
          santiyeKod: selectedSantiyeInfo.kod
        };

        await setDoc(doc(db, "puantaj", docId), updatedSantiyeData);
        setDialogOpen(false);
        enqueueSnackbar("Puantaj kaydedildi", { variant: "success" });
      }

      // Tüm puantaj verilerini yeniden yükle
      const allData = {};
      for (const santiye of santiyeler) {
        const currentDocId = `${selectedYear}-${selectedMonth + 1}-${santiye.ad}`;
        const puantajDoc = await getDoc(doc(db, "puantaj", currentDocId));
        
        if (puantajDoc.exists()) {
          const santiyeData = puantajDoc.data();
          Object.entries(santiyeData).forEach(([personelName, gunler]) => {
            if (!allData[personelName]) {
              allData[personelName] = {};
            }
            Object.entries(gunler).forEach(([gun, deger]) => {
              allData[personelName][gun] = {
                ...deger,
                santiyeKod: santiye.kod
              };
            });
          });
        }
      }
      setAllPuantajData(allData);

    } catch (error) {
      console.error("Puantaj güncellenirken hata:", error);
      enqueueSnackbar("Puantaj güncellenirken hata oluştu", { variant: "error" });
    }
  };

  // Hücre render fonksiyonu
  const renderCell = (personelName, day) => {
    const data = allPuantajData[personelName]?.[day];
    const status = data?.status || "bos";
    const santiyeKod = data?.santiyeKod || "";
    const durum = PUANTAJ_DURUMLARI[status] || PUANTAJ_DURUMLARI.bos;

    return (
      <td
        key={day}
        onClick={() => handleCellClick(personelName, day)}
        className={`border p-2 text-center ${!canEdit ? '' : 'cursor-pointer'} ${
          isDarkMode ? 'border-gray-700' : 'border'
        } ${durum.color} ${durum.textColor}`}
        style={{
          backgroundColor: isDarkMode && status !== 'bos' ? durum.buttonColor : undefined
        }}
      >
        {santiyeKod}
      </td>
    );
  };

  const calculateTotal = (personelName) => {
    return Object.entries(allPuantajData[personelName] || {})
      .reduce((total, [day, { status }]) => {
        // Pazar günü kontrolü
        const isPazar = isPazarGunu(selectedYear, selectedMonth, parseInt(day));
        
        switch (status) {
          case "tam":
            return total + 1;
          case "yarim":
            return total + 0.5;
          case "mesai":
            // Eğer pazar günü mesai yapıldıysa 2.5 (1 + 1.5) puan
            if (isPazar) {
              return total + 2.5;
            }
            return total + 1.5;
          case "pazar":
            return total + 1;
          case "resmiTatil":
            return total + 1;
          case "izinli":
            return total + 0;
          case "raporlu":
            return total + 0;
          case "bos":
          case "temizle":
          default:
            return total + 0;
        }
      }, 0);
  };

  // PDF kaydetme fonksiyonu
  const handleSavePDF = () => {
    const element = pdfRef.current;
    const opt = {
      margin: [10, 5, 10, 5],
      filename: `puantaj_${selectedYear}_${months[selectedMonth]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'landscape',
        compress: true
      }
    };

    // PDF oluşturmadan önce yazdırma stillerini uygula
    element.classList.add('printing');
    
    html2pdf().set(opt).from(element).save().then(() => {
      element.classList.remove('printing');
      enqueueSnackbar('PDF başarıyla kaydedildi', { variant: "success" });
    }).catch(err => {
      element.classList.remove('printing');
      enqueueSnackbar('PDF kaydedilirken bir hata oluştu', { variant: "error" });
    });
  };

  // Yazdırma fonksiyonu
  const handlePrint = () => {
    // Yazdırma stillerini ekle
    const style = document.createElement('style');
    style.textContent = `
      @media print {
        @page {
          size: landscape;
          margin: 15mm;
        }
        body {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          background-color: white !important;
          color: black !important;
        }
        .no-print {
          display: none !important;
        }
        .print-only {
          display: block !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Yazdır
    window.print();

    // Stili kaldır
    document.head.removeChild(style);
  };

  // Sayfa yetkisi kontrolü
  useEffect(() => {
    if (!canView) {
      enqueueSnackbar('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      navigate('/');
    }
  }, [canView, navigate]);

  return (
    <Box 
      className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
      sx={{ color: isDarkMode ? 'text.primary' : 'inherit' }}
    >
      <Box>
        {/* Üst Kısım */}
        <Box className="flex justify-between items-center mb-6 no-print">
          <Box className="flex gap-4">
          </Box>

          <Box className="flex gap-2">
          </Box>
        </Box>

        {/* PDF'e Aktarılacak Alan */}
        <Box 
          ref={pdfRef} 
          className={`pdf-content ${isDarkMode ? 'dark' : 'light'}`}
        >
          {/* Başlık */}
          <Box className="mb-4 text-center">
            <Typography variant="h5" className="font-bold" style={{ fontSize: '16px' }}>
              {selectedYear} - {months[selectedMonth]} Puantaj Tablosu
            </Typography>
            {selectedSantiye && (
              <Typography variant="subtitle1" className="mt-1" style={{ fontSize: '13px' }}>
                {santiyeler.find(s => s.id === selectedSantiye)?.ad}
              </Typography>
            )}
          </Box>

          {/* Açıklamalar */}
          <Box className="mb-4">
            {/* Durum Açıklamaları */}
            <Box className={`flex flex-wrap gap-2 mb-2 p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <Typography variant="subtitle1" className="w-full mb-1 font-bold" style={{ fontSize: '13px' }}>
                Durum Açıklamaları:
              </Typography>
              <Box className="flex flex-wrap gap-1">
                {Object.entries(PUANTAJ_DURUMLARI).map(([key, value]) => (
                  <Box 
                    key={key} 
                    className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                    }}
                  >
                    <Box 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      sx={{
                        backgroundColor: value.buttonColor,
                        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)'}`,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                    />
                    <span className="text-xs">{value.description}</span>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Şantiye Kodları Açıklamaları */}
            <Box className={`flex flex-wrap gap-2 p-2 rounded ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <Typography variant="subtitle1" className="w-full mb-1 font-bold" style={{ fontSize: '13px' }}>
                Şantiye Kodları:
              </Typography>
              <Box className="flex flex-wrap gap-1">
                {santiyeler.map((santiye) => (
                  <Box 
                    key={santiye.id} 
                    className="flex items-center gap-1 cursor-pointer transition-all duration-200 hover:scale-105 px-2 py-0.5 rounded-lg text-xs"
                    onClick={() => setSelectedSantiye(santiye.id)}
                    sx={{
                      backgroundColor: selectedSantiye === santiye.id 
                        ? isDarkMode ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'
                        : isDarkMode ? 'rgba(55, 65, 81, 0.5)' : 'rgba(243, 244, 246, 0.8)'
                    }}
                  >
                    <Box 
                      className={`w-4 h-4 rounded-full flex items-center justify-center font-medium text-xs transition-all duration-200 ${
                        selectedSantiye === santiye.id
                          ? isDarkMode 
                            ? 'bg-blue-600 text-white ring-1 ring-blue-400'
                            : 'bg-blue-500 text-white ring-1 ring-blue-300'
                          : isDarkMode
                            ? 'bg-gray-700 text-white hover:bg-gray-600'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      }`}
                    >
                      {santiye.kod}
                    </Box>
                    <span className="text-xs">{santiye.ad}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>

          {/* Filtreler */}
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Yıl</InputLabel>
              <Select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} label="Yıl">
                {years.map((year) => (
                  <MenuItem key={year} value={year}>{year}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Ay</InputLabel>
              <Select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} label="Ay">
                {months.map((month, index) => (
                  <MenuItem key={month} value={index}>{month}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Çalışma Ş.</InputLabel>
              <Select value={selectedCalismaSekli} onChange={(e) => setSelectedCalismaSekli(e.target.value)} label="Çalışma Ş.">
                <MenuItem value="TÜMÜ">TÜMÜ</MenuItem>
                <MenuItem value="MAAŞLI ÇALIŞAN">MAAŞLI ÇALIŞAN</MenuItem>
                <MenuItem value="YEVMİYE ÇALIŞAN">YEVMİYE ÇALIŞAN</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Personel Ara"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-w-[200px]"
            />

            <Box sx={{ flexGrow: 1 }} /> {/* Boşluk bırakır */}

            <Button
              variant="contained"
              onClick={handleSavePDF}
              sx={{ 
                bgcolor: '#4caf50',
                '&:hover': {
                  bgcolor: '#388e3c'
                }
              }}
            >
              PDF Kaydet
            </Button>

            <Button
              variant="contained"
              onClick={handlePrint}
              sx={{ 
                bgcolor: '#2196f3',
                '&:hover': {
                  bgcolor: '#1976d2'
                }
              }}
            >
              Yazdır
            </Button>
          </Box>

          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
              <CircularProgress />
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <table className={`w-full border-collapse ${isDarkMode ? 'border-gray-700' : 'border'}`}>
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                    <td colSpan={daysInMonth.length + 3} className={`border p-2 font-bold ${isDarkMode ? 'border-gray-700 text-white' : 'border'}`}>
                      Maaşlı Çalışanlar
                    </td>
                  </tr>
                  <tr>
                    <th className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>SN</th>
                    <th className={`border p-2 ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>Ad Soyad</th>
                    {daysInMonth.map((day) => (
                      <th key={day} className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>{day}</th>
                    ))}
                    <th className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonelList
                    .filter(p => p.calismaSekli === "MAAŞLI ÇALIŞAN")
                    .map((personel, index) => (
                      <tr key={personel.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>{index + 1}</td>
                        <td className={`border p-2 ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>{personel.ad} {personel.soyad}</td>
                        {daysInMonth.map((day) => renderCell(`${personel.ad} ${personel.soyad}`, day))}
                        <td className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>
                          {calculateTotal(`${personel.ad} ${personel.soyad}`)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              <table className={`w-full border-collapse ${isDarkMode ? 'border-gray-700' : 'border'} mt-8`}>
                <thead>
                  <tr className={isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}>
                    <td colSpan={daysInMonth.length + 3} className={`border p-2 font-bold ${isDarkMode ? 'border-gray-700 text-white' : 'border'}`}>
                      Yevmiye Çalışanlar
                    </td>
                  </tr>
                  <tr>
                    <th className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>SN</th>
                    <th className={`border p-2 ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>Ad Soyad</th>
                    {daysInMonth.map((day) => (
                      <th key={day} className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>{day}</th>
                    ))}
                    <th className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-white bg-gray-800' : 'border'}`}>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPersonelList
                    .filter(p => p.calismaSekli === "YEVMİYE ÇALIŞAN")
                    .map((personel, index) => (
                      <tr key={personel.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                        <td className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>{index + 1}</td>
                        <td className={`border p-2 ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>{personel.ad} {personel.soyad}</td>
                        {daysInMonth.map((day) => renderCell(`${personel.ad} ${personel.soyad}`, day))}
                        <td className={`border p-2 text-center ${isDarkMode ? 'border-gray-700 text-gray-300' : 'border'}`}>
                          {calculateTotal(`${personel.ad} ${personel.soyad}`)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </Box>
          )}

          {/* Puantaj Durumu Seçme Dialog'u */}
          <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
            <DialogTitle>Puantaj Durumu Seç</DialogTitle>
            <DialogContent>
              <Box className="flex flex-col gap-4 mt-4">
                {Object.entries(PUANTAJ_DURUMLARI).map(([key, value]) => (
                  <Button
                    key={key}
                    onClick={() => {
                      handleSavePuantaj(key);
                      setDialogOpen(false);
                    }}
                    sx={{
                      backgroundColor: value.buttonColor,
                      color: value.textColor.includes('white') ? '#fff' : '#000',
                      border: key === 'bos' ? '1px solid #ccc' : 'none',
                      '&:hover': {
                        backgroundColor: value.buttonColor,
                        opacity: 0.9
                      }
                    }}
                  >
                    {value.description}
                  </Button>
                ))}
              </Box>
            </DialogContent>
          </Dialog>
        </Box>
      </Box>
    </Box>
  );
};

export default Puantaj;

<style jsx global>{`
  @media print, .printing {
    .pdf-content.dark, .pdf-content.light {
      background-color: white !important;
      color: black !important;
    }
    .pdf-content {
      font-size: 11px !important;
    }
    .pdf-content h5 {
      font-size: 16px !important;
      margin-bottom: 8px !important;
    }
    .pdf-content .subtitle1 {
      font-size: 13px !important;
      margin-bottom: 4px !important;
    }
    .pdf-content table {
      font-size: 10px !important;
      border-collapse: collapse !important;
    }
    .pdf-content table th,
    .pdf-content table td {
      padding: 2px 4px !important;
      border: 1px solid #999 !important;
      background-color: white !important;
      color: black !important;
    }
    .pdf-content table td[style*="background-color"] {
      opacity: 0.9 !important;
    }
    .pdf-content table th {
      background-color: #f3f4f6 !important;
      font-weight: bold !important;
    }
    .pdf-content table tr:nth-child(even) td {
      background-color: #fafafa !important;
    }
    .pdf-content table tr[class*="hover"]:hover {
      background-color: transparent !important;
    }
    .pdf-content .mb-6 {
      margin-bottom: 12px !important;
    }
    .pdf-content .p-4 {
      padding: 8px !important;
    }
    .pdf-content .gap-4 {
      gap: 8px !important;
    }
    .pdf-content .gap-2 {
      gap: 4px !important;
    }
    .pdf-content [class*="bg-gray"] {
      background-color: #f9fafb !important;
      border: 1px solid #e5e7eb !important;
    }
    .pdf-content .w-4, .pdf-content .w-5 {
      width: 16px !important;
      height: 16px !important;
      border: 1px solid rgba(0,0,0,0.2) !important;
      box-shadow: 0 1px 2px rgba(0,0,0,0.1) !important;
    }
    .no-print {
      display: none !important;
    }
    .print-only {
      display: block !important;
    }
    @page {
      size: landscape;
      margin: 10mm 5mm;
    }
  }
`}</style>
