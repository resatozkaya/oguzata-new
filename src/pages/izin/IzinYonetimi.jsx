import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  FormHelperText,
  IconButton,
  Switch,
  FormControlLabel,
  Autocomplete,
} from '@mui/material';
import { Add as AddIcon, Print as PrintIcon } from '@mui/icons-material';
import { Edit as EditIcon } from '@mui/icons-material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { Cancel as CancelIcon } from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import PageTitle from '../../components/PageTitle';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { personnelService } from '../../services/personnelService';
import { izinService } from '../../services/izinService';
import IzinFormu from './IzinFormu';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { app } from '../../firebase';

// Printable content component for leave requests
const PrintableContent = React.forwardRef(({ izin, personelListesi = [] }, ref) => {
  if (!izin) return null;

  const personelBilgileri = (personelListesi || []).find(p => p.id === izin.personelId) || {};

  // Güvenli tarih formatlama fonksiyonu
  const formatSafeDate = (dateString) => {
    try {
      if (!dateString) return '-';
      const date = new Date(dateString);
      // Geçerli tarih kontrolü
      if (isNaN(date.getTime())) return '-';
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      console.error('Tarih formatlama hatası:', error);
      return '-';
    }
  };

  return (
    <div ref={ref} style={{ padding: '20px', margin: '20px', backgroundColor: 'white', minWidth: '700px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>İzin Formu</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
        <tbody>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Personel Adı:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{personelBilgileri.ad} {personelBilgileri.soyad}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>İzin Türü:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{izin.izinTuru}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Başlangıç Tarihi:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatSafeDate(izin.baslangicTarihi)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Bitiş Tarihi:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{formatSafeDate(izin.bitisTarihi)}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>İzin Süresi:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{izin.izinSuresi || '-'} gün</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Açıklama:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{izin.aciklama || '-'}</td>
          </tr>
          <tr>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}><strong>Durum:</strong></td>
            <td style={{ padding: '8px', border: '1px solid #ddd' }}>{izin.durum || izin.status || '-'}</td>
          </tr>
        </tbody>
      </table>
      <div style={{ marginTop: '50px', display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ textAlign: 'center' }}>
          <p>İmza</p>
          <p>{personelBilgileri.ad} {personelBilgileri.soyad}</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p>Onaylayan</p>
          <p>Yönetim</p>
        </div>
      </div>
    </div>
  );
});

const IzinYonetimi = () => {
  const [izinler, setIzinler] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [personelListesi, setPersonelListesi] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPersonel, setSelectedPersonel] = useState(null);
  const { currentUser: user } = useAuth();
  const { hasPermission, userRole } = usePermission();
  const { enqueueSnackbar } = useSnackbar();
  const [sadeceAktifPersonel, setSadeceAktifPersonel] = useState(true);
  const [selectedIzin, setSelectedIzin] = useState(null);
  const printRef = useRef();
  const [kullanicilar, setKullanicilar] = useState({});

  const [formData, setFormData] = useState({
    personelId: '',
    izinTuru: '',
    baslangicTarihi: '',
    bitisTarihi: '',
    aciklama: '',
    tcNo: '',
    department: '',
    adres: ''
  });

  // Personel seçimi veya manuel giriş için state
  const [manuelPersonel, setManuelPersonel] = useState(null);

  // Form verilerini sıfırla
  const resetFormData = () => {
    setFormData({
      personelId: '',
      izinTuru: '',
      baslangicTarihi: '',
      bitisTarihi: '',
      aciklama: '',
      tcNo: '',
      department: '',
      adres: ''
    });
    setSelectedPersonel(null);
  };

  // Personel listesini getir
  const getPersonelListesi = async () => {
    try {
      setLoading(true);
      console.log('Personel listesi yükleniyor...');
      const personeller = await personnelService.getAllPersonnel();
      console.log('Tüm personeller:', personeller);
      // Sadece aktif ve maaşlı çalışanları filtrele
      // Önce sadece maaşlı çalışanları filtrele
      const maasliPersoneller = personeller.filter(p => 
        p.calismaSekli === 'MAAŞLI ÇALIŞAN'
      );
      
      // Sonra aktif/pasif durumuna göre filtrele
      const filtrelenmisPersoneller = maasliPersoneller.filter(p => 
        !sadeceAktifPersonel ? p.aktif === true : true
      )
      // İsme göre sırala
      .sort((a, b) => a.ad.localeCompare(b.ad, 'tr'));
      console.log('Filtrelenmiş personeller:', filtrelenmisPersoneller);
      setPersonelListesi(filtrelenmisPersoneller);
    } catch (error) {
      console.error('Personel listesi alınırken hata:', error);
      enqueueSnackbar('Personel listesi alınırken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getPersonelListesi();
    getIzinler();
    
    // Kullanıcı bilgilerini al
    console.log("useEffect: Kullanıcı bilgileri yükleniyor...");
    getKullaniciBilgileri().then(() => {
      console.log("useEffect: Kullanıcı bilgileri yüklendi");
    }).catch(err => {
      console.error("useEffect: Kullanıcı bilgileri yüklenirken hata:", err);
    });
  }, []);

  // Kullanıcı bilgilerini getir
  const getKullaniciBilgileri = async () => {
    try {
      console.log('Firestore kullanıcı bilgileri yükleniyor...');
      const db = getFirestore(app);
      
      // Önce users collection
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersMap = {};
      
      // Users koleksiyonunu işle
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        usersMap[doc.id] = {
          id: doc.id,
          ...userData
        };
        
        console.log(`User: ${doc.id}, Ad: ${userData.name || '-'}, Soyad: ${userData.surname || '-'}, Email: ${userData.email || '-'}`);
      });
      
      console.log(`${usersSnapshot.size} kullanıcı yüklendi`);
      
      // Personel koleksiyonundan veriler
      const personelSnapshot = await getDocs(collection(db, 'personeller'));
      console.log(`${personelSnapshot.size} personel yüklendi`);
      
      // Her personeli döngüyle işle
      personelSnapshot.forEach(doc => {
        const personelData = doc.data();
        
        // Personelin userId'si var mı kontrol et
        if (personelData.userId) {
          console.log(`Personel: ${doc.id}, Ad: ${personelData.ad || '-'}, Soyad: ${personelData.soyad || '-'}, UserId: ${personelData.userId}`);
          
          // Kullanıcı verisi oluştur veya güncelle
          if (!usersMap[personelData.userId]) {
            usersMap[personelData.userId] = {
              id: personelData.userId,
              ad: personelData.ad || '',
              soyad: personelData.soyad || '',
              fullName: `${personelData.ad || ''} ${personelData.soyad || ''}`.trim()
            };
            console.log(`Yeni kullanıcı oluşturuldu: ${personelData.userId}`);
          } else {
            // Mevcut kullanıcı bilgilerini güncelle
            usersMap[personelData.userId] = {
              ...usersMap[personelData.userId],
              ad: personelData.ad || usersMap[personelData.userId].ad || '',
              soyad: personelData.soyad || usersMap[personelData.userId].soyad || '',
              fullName: `${personelData.ad || ''} ${personelData.soyad || ''}`.trim()
            };
            console.log(`Kullanıcı güncellendi: ${personelData.userId}`);
          }
        } else {
          // UserId olmayan personel
          console.log(`UserId olmayan personel: ${doc.id}, Ad: ${personelData.ad || '-'}, Soyad: ${personelData.soyad || '-'}`);
        }
      });
      
      // Özel durum: Mevcut kullanıcının bilgilerini UserId'ye göre manuel ekle
      if (user?.uid && !usersMap[user.uid]) {
        usersMap[user.uid] = {
          id: user.uid,
          name: user.name || '',
          surname: user.surname || '',
          displayName: user.displayName || '',
          email: user.email || ''
        };
        console.log(`Mevcut kullanıcı eklendi: ${user.uid}`);
      }
      
      console.log('Tüm kullanıcılar:', Object.keys(usersMap).length);
      
      // İzinlerdeki createdBy alanlarını kontrol et
      const izinSnapshot = await getDocs(collection(db, 'izinler'));
      const createdByIds = new Set();
      
      izinSnapshot.forEach(doc => {
        const izinData = doc.data();
        if (izinData.createdBy) {
          createdByIds.add(izinData.createdBy);
        }
      });
      
      console.log('İzinlerdeki benzersiz createdBy ID\'leri:', Array.from(createdByIds));
      
      // Eksik kullanıcıları tespit et
      const eksikKullanicilar = Array.from(createdByIds).filter(id => !usersMap[id]);
      console.log('Eksik kullanıcılar:', eksikKullanicilar);
      
      // Eksik kullanıcı varsa tek tek yükle
      for (const eksikId of eksikKullanicilar) {
        try {
          const userDoc = await getDoc(doc(db, 'users', eksikId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            usersMap[eksikId] = {
              id: eksikId,
              ...userData
            };
            console.log(`Eksik kullanıcı yüklendi: ${eksikId}, Ad: ${userData.name || '-'}, Soyad: ${userData.surname || '-'}`);
          } else {
            // Kullanıcı bulunamadı, varsayılan bilgi ekle
            usersMap[eksikId] = { id: eksikId };
            console.log(`Eksik kullanıcı bulunamadı: ${eksikId}`);
          }
        } catch (error) {
          console.error(`Eksik kullanıcı yüklenirken hata: ${eksikId}`, error);
        }
      }
      
      setKullanicilar(usersMap);
      return usersMap;
    } catch (error) {
      console.error('Kullanıcı bilgileri alınırken hata:', error);
      throw error;
    }
  };

  const getIzinler = async () => {
    try {
      const izinListesi = await izinService.getAllIzinler();
      console.log('User Role:', userRole);
      console.log('User UID:', user?.uid);
      console.log('All izinler:', izinListesi);

      // İzinleri filtrele
      const filtrelenmisIzinler = izinListesi.filter(izin => {
        // YÖNETİM rolü tüm izinleri görebilir
        if (userRole === 'YÖNETİM') {
          return true;
        }

        // MUHASEBE rolü tüm izinleri görebilir
        if (userRole === 'MUHASEBE') {
          return true;
        }

        // VIEW_ALL yetkisi varsa tüm izinleri göster
        if (hasPermission('izin_view_all')) {
          return true;
        }

        // Kendi izni ise göster
        return izin.createdBy === user?.uid;
      });

      console.log('Filtered izinler:', filtrelenmisIzinler);
      setIzinler(filtrelenmisIzinler);
    } catch (error) {
      console.error('İzinler alınırken hata:', error);
      enqueueSnackbar('İzinler alınırken bir hata oluştu', { variant: 'error' });
    }
  };

  const izinTurleri = [
    { id: 'yillik', label: 'Yıllık İzin' },
    { id: 'mazeret', label: 'Mazeret İzni' },
    { id: 'ucretsiz', label: 'Ücretsiz İzin' }
  ];

  const handleOpenDialog = async () => {
    setOpenDialog(true);
    await getPersonelListesi();
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetFormData();
  };

  const handleDelete = async (id) => {
    try {
      await izinService.deleteIzin(id);
      enqueueSnackbar('İzin talebi silindi', { variant: 'success' });
      getIzinler();
    } catch (error) {
      enqueueSnackbar('İzin talebi silinirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleApprove = async (id) => {
    try {
      // Onaylayan kişi bilgilerini ekle
      const onaylayanKullanici = {
        id: user?.uid,
        name: user?.displayName || 'Yönetici', // Kullanıcının görünen adı veya varsayılan değer
        unvan: userRole // Kullanıcının rolü
      };
      
      await izinService.approveIzin(id, onaylayanKullanici);
      enqueueSnackbar('İzin talebi onaylandı', { variant: 'success' });
      getIzinler(); // Listeyi güncelle
    } catch (error) {
      console.error('İzin onaylanırken hata:', error);
      enqueueSnackbar('İzin onaylanırken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleReject = async (id) => {
    try {
      await izinService.rejectIzin(id, user?.uid, '');
      enqueueSnackbar('İzin talebi reddedildi', { variant: 'success' });
      getIzinler();
    } catch (error) {
      enqueueSnackbar('İzin talebi reddedilirken bir hata oluştu', { variant: 'error' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      // Form verilerini kontrol et
      if ((!selectedPersonel && !manuelPersonel) || !formData.izinTuru || !formData.baslangicTarihi || !formData.bitisTarihi) {
        enqueueSnackbar('Lütfen tüm zorunlu alanları doldurun', { variant: 'error' });
        return;
      }

      // İzin verisini hazırla
      const izinData = {
        ...formData,
        createdBy: user?.uid,
        status: 'BEKLEMEDE',
      };

      // Eğer mevcut personel seçildiyse
      if (selectedPersonel) {
        izinData.personelId = selectedPersonel.id;
        izinData.personelAdi = `${selectedPersonel.ad} ${selectedPersonel.soyad}`;
      } 
      // Manuel personel girişi yapıldıysa
      else if (manuelPersonel) {
        izinData.personelId = 'MANUEL_' + Date.now(); // Benzersiz bir ID oluştur
        izinData.personelAdi = manuelPersonel; // Manuel girilen ismi kullan
      }

      // Yeni izin oluştur
      await izinService.createIzin(izinData);
      enqueueSnackbar('İzin talebi oluşturuldu', { variant: 'success' });
      handleCloseDialog();
      getIzinler();
    } catch (error) {
      console.error('İzin oluşturulurken hata:', error);
      enqueueSnackbar('İzin talebi oluşturulurken bir hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Boş string yerine undefined kullan
    const newValue = value === '' ? undefined : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));

    // Personel seçildiğinde bilgileri güncelle
    if (name === 'personelId') {
      const selectedPerson = personelListesi.find(p => p.id === value);
      setSelectedPersonel(selectedPerson || null);
    }
  };

  const printComponentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => printComponentRef.current,
    onBeforePrint: () => {
      if (!selectedIzin || !personelListesi) {
        enqueueSnackbar('Yazdırma için gerekli bilgiler eksik', { variant: 'error' });
        return false;
      }
      return true;
    },
    onAfterPrint: () => {
      enqueueSnackbar('İzin formu yazdırıldı', { variant: 'success' });
      setSelectedIzin(null);
    },
    onPrintError: () => {
      enqueueSnackbar('Yazdırma sırasında bir hata oluştu', { variant: 'error' });
      setSelectedIzin(null);
    },
    removeAfterPrint: true
  });

  const handlePrintClick = (izin) => {
    if (!izin) {
      enqueueSnackbar('Yazdırılacak izin seçilmedi', { variant: 'error' });
      return;
    }
    if (!personelListesi || personelListesi.length === 0) {
      enqueueSnackbar('Personel listesi yüklenemedi', { variant: 'error' });
      return;
    }
    setSelectedIzin(izin);
    // Use requestAnimationFrame for better state sync
    requestAnimationFrame(() => {
      if (printComponentRef.current) {
        handlePrint();
      } else {
        enqueueSnackbar('Yazdırma hazırlığı yapılamadı', { variant: 'error' });
      }
    });
  };

  // Yazdırma butonu işleyicisini düzeltelim
  {selectedPersonel && (
    <IconButton onClick={() => {
      // Formdaki bilgilerden geçici bir izin objesi oluştur
      const geciciIzin = {
        personelId: selectedPersonel.id,
        personelAdi: `${selectedPersonel.ad} ${selectedPersonel.soyad}`,
        tcNo: formData.tcNo || '',
        department: formData.department || '',
        adres: formData.adres || '',
        izinTuru: formData.izinTuru || 'yillik',
        // Tarih bilgilerini kontrol et
        baslangicTarihi: formData.baslangicTarihi || '', 
        bitisTarihi: formData.bitisTarihi || '',
        status: 'BEKLEMEDE',
        aciklama: formData.aciklama || ''
      };
      // Geçici izin objesiyle yazdırma fonksiyonunu çağır
      printIzinFormu(geciciIzin);
    }} color="primary">
      <PrintIcon />
    </IconButton>
  )}

  // Tüm yazdırma işlemini tek bir yerde toplayan fonksiyon 
  const printIzinFormu = (izin) => {
    if (!izin) {
      enqueueSnackbar('Yazdırılacak izin seçilmedi', { variant: 'error' });
      return;
    }
    
    try {
      // Personel bilgisini al
      let personel;
      if (izin.personelId.startsWith('MANUEL_')) {
        // Manuel girilen personel için
        personel = {
          ad: izin.personelAdi?.split(' ')[0] || '',
          soyad: izin.personelAdi?.split(' ').slice(1).join(' ') || '',
          tcNo: izin.tcNo || '',
          department: izin.department || '',
          adres: izin.adres || ''
        };
      } else {
        // Mevcut personel listesinden
        personel = personelListesi.find(p => p.id === izin.personelId);
        if (!personel && !izin.personelAdi) {
          enqueueSnackbar('Personel bilgisi bulunamadı', { variant: 'error' });
          return;
        }
      }

      // Yazdırma penceresini açan kodu güncelleyelim
      const printWindow = window.open('', '', 'height=1000,width=1000');
      
      // Başlık ve stil ekleyelim
      printWindow.document.write('<html><head><title>İzin Formu</title>');
      printWindow.document.write('<style>');
      printWindow.document.write(`
        body { 
          font-family: Arial, sans-serif;
          padding: 40px;
          margin: 0;
          background-color: #f5f5f5;
        }
        .form-container {
          width: 210mm;
          margin: 0 auto;
          border: 1px solid #000;
          padding: 40px;
          background-color: white;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          margin-bottom: 60px;
        }
        h1 {
          text-align: center;
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          width: 200px;
          text-align: left;
        }
        .izin-turleri {
          display: flex;
          align-items: center;
        }
        .checkbox {
          width: 20px;
          height: 20px;
          border: 1px solid #000;
          display: inline-block;
          margin-right: 5px;
          text-align: center;
          line-height: 20px;
        }
        .imza-alani {
          margin-top: 40px;
        }
        .imza-row {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
        }
        .imza-alan {
          width: 30%;
        }
        .imza-alan p {
          margin-bottom: 5px;
        }
        .imza-cizgi {
          border-bottom: 1px solid #000;
          height: 24px;
          margin-top: 5px;
        }
        @media print {
          body { 
            padding: 0;
            background-color: white;
          }
          .form-container {
            border: none;
            box-shadow: none;
            padding: 20px;
            margin-bottom: 0;
          }
          .no-print {
            display: none !important;
          }
        }
      `);
      printWindow.document.write('</style></head><body>');
      
      // İçerik ekleme
      printWindow.document.write('<div class="form-container">');
      printWindow.document.write('<h1>İZİN FORMU</h1>');
      
      // Kişisel Bilgiler
      printWindow.document.write('<table>');
      printWindow.document.write('<tr><th>T.C. KİMLİK NO</th><td>' + (izin.tcNo || '') + '</td></tr>');
      printWindow.document.write('<tr><th>ADI SOYADI</th><td>' + (izin.personelAdi || `${personel.ad} ${personel.soyad}`) + '</td></tr>');
      printWindow.document.write('<tr><th>BRANŞI VE GÖREVİ</th><td>' + (izin.department || personel.department || '') + '</td></tr>');
      printWindow.document.write('<tr><th>İKAMETGAH ADRESİ</th><td>' + (izin.adres || personel.adres || '') + '</td></tr>');
      printWindow.document.write('</table>');
      
      // İzin Detayları
      printWindow.document.write('<table>');
      
      // Tarihleri güvenli bir şekilde formatla
      let baslangicTarihi = '';
      if (izin.baslangicTarihi) {
        try {
          const date = new Date(izin.baslangicTarihi);
          if (!isNaN(date.getTime())) { // Geçerli tarih kontrolü
            baslangicTarihi = date.toLocaleDateString('tr-TR');
          }
        } catch (e) {
          console.error('Tarih formatında hata:', e);
        }
      }
      
      let bitisTarihi = '';
      if (izin.bitisTarihi) {
        try {
          const date = new Date(izin.bitisTarihi);
          if (!isNaN(date.getTime())) { // Geçerli tarih kontrolü
            bitisTarihi = date.toLocaleDateString('tr-TR');
          }
        } catch (e) {
          console.error('Tarih formatında hata:', e);
        }
      }
      
      // İzin süresi hesaplama - sadece her iki tarih de geçerliyse
      let izinSuresi = '';
      if (izin.baslangicTarihi && izin.bitisTarihi) {
        try {
          const start = new Date(izin.baslangicTarihi);
          const end = new Date(izin.bitisTarihi);
          if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
            const diffTime = Math.abs(end - start);
            // +1 kaldırıldı - aynı gün için 0 yerine 1 gün çıkmasına neden oluyordu
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            // Eğer başlangıç ve bitiş günü aynıysa 1 gün olarak say
            const gunSayisi = diffDays === 0 ? 1 : diffDays;
            izinSuresi = gunSayisi + ' GÜN';
          }
        } catch (e) {
          console.error('Süre hesaplamada hata:', e);
        }
      }
      
      printWindow.document.write('<tr><th>İZİN BAŞLAMA TARİHİ</th><td>' + baslangicTarihi + '</td></tr>');
      printWindow.document.write('<tr><th>İZİN SONRASI İŞBAŞI TARİHİ</th><td>' + bitisTarihi + '</td></tr>');
      printWindow.document.write('<tr><th>İZİNLİ OLACAĞI GÜN SAYISI</th><td>' + izinSuresi + '</td></tr>');
      printWindow.document.write('</table>');
      
      // İzin Türü
      printWindow.document.write('<table>');
      printWindow.document.write('<tr><th>İZİN TÜRÜ</th><td>');
      
      // Yıllık İzin
      printWindow.document.write('<div class="izin-turleri">');
      printWindow.document.write('<div class="checkbox">' + (izin.izinTuru === 'yillik' ? '✓' : '') + '</div>');
      printWindow.document.write('<span>YILLIK İZİN</span>');
      printWindow.document.write('</div>');
      
      // Ücretsiz İzin
      printWindow.document.write('<div class="izin-turleri" style="margin-top: 10px;">');
      printWindow.document.write('<div class="checkbox">' + (izin.izinTuru === 'ucretsiz' ? '✓' : '') + '</div>');
      printWindow.document.write('<span>ÜCRETSİZ İZİN</span>');
      printWindow.document.write('</div>');
      
      // Mazeret İzni
      printWindow.document.write('<div class="izin-turleri" style="margin-top: 10px;">');
      printWindow.document.write('<div class="checkbox">' + (izin.izinTuru === 'mazeret' ? '✓' : '') + '</div>');
      printWindow.document.write('<span>MAZERET İZNİ</span>');
      printWindow.document.write('</div>');
      
      printWindow.document.write('</td></tr>');
      printWindow.document.write('</table>');
      
      // İmza Alanları
      printWindow.document.write('<div class="imza-alani">');
      printWindow.document.write('<h3>TALEP / İŞÇİ</h3>');
      printWindow.document.write('<div class="imza-row">');
      
      // İşçi imza alanı
      printWindow.document.write('<div class="imza-alan">');
      printWindow.document.write('<p>ADI SOYADI:</p>');
      printWindow.document.write('<div class="imza-cizgi">' + (izin.personelAdi || `${personel.ad} ${personel.soyad}`) + '</div>');
      printWindow.document.write('</div>');
      
      // İmza alanı
      printWindow.document.write('<div class="imza-alan">');
      printWindow.document.write('<p>İMZA:</p>');
      printWindow.document.write('<div class="imza-cizgi"></div>');
      printWindow.document.write('</div>');
      
      // Tarih alanı
      const bugun = new Date().toLocaleDateString('tr-TR');
      printWindow.document.write('<div class="imza-alan">');
      printWindow.document.write('<p>TARİH:</p>');
      printWindow.document.write('<div class="imza-cizgi">' + bugun + '</div>');
      printWindow.document.write('</div>');
      
      printWindow.document.write('</div>'); // imza-row sonu
      printWindow.document.write('</div>'); // imza-alani sonu
      
      // İşveren Onay
      printWindow.document.write('<div class="imza-alani">');
      printWindow.document.write('<h3>TALEP ONAY / İŞVEREN</h3>');
      printWindow.document.write('<div class="imza-row">');
      
      // İşveren adı alanı
      printWindow.document.write('<div class="imza-alan" style="width: 50%">');
      printWindow.document.write('<p>ADI SOYADI / UNVANI:</p>');
      printWindow.document.write('<div class="imza-cizgi">' + (izin.status === 'ONAYLANDI' ? izin.approvedByName || '' : '') + '</div>');
      printWindow.document.write('</div>');
      
      // Tarih alanı
      printWindow.document.write('<div class="imza-alan" style="width: 25%">');
      printWindow.document.write('<p>TARİH:</p>');
      printWindow.document.write('<div class="imza-cizgi">' + (izin.status === 'ONAYLANDI' && izin.approvedAt ? new Date(izin.approvedAt.seconds * 1000).toLocaleDateString('tr-TR') : '') + '</div>');
      printWindow.document.write('</div>');
      
      // Kaşe/İmza alanı
      printWindow.document.write('<div class="imza-alan" style="width: 25%">');
      printWindow.document.write('<p>KAŞE/İMZA:</p>');
      printWindow.document.write('<div class="imza-cizgi"></div>');
      printWindow.document.write('</div>');
      
      printWindow.document.write('</div>'); // imza-row sonu
      printWindow.document.write('</div>'); // imza-alani sonu
      
      // Yazdır butonunun stilini güncelleyelim
      printWindow.document.write('<div class="no-print" style="text-align: center; margin: 30px 0; position: sticky; bottom: 20px;">');
      printWindow.document.write(`
        <button onclick="window.print()" style="
          padding: 15px 30px; 
          font-size: 18px; 
          background-color: #1976d2; 
          color: white; 
          border: none; 
          border-radius: 4px; 
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.3s ease;
        ">
          Yazdır
        </button>
      `);
      printWindow.document.write('</div>');
      
      printWindow.document.write('</div>'); // form-container sonu
      printWindow.document.write('</body></html>');
      
      printWindow.document.close();
      printWindow.focus();
      
      // Direkt yazdırma
      //printWindow.print();
      //setTimeout(() => printWindow.close(), 1000);
    } catch (error) {
      console.error('Yazdırma hatası:', error);
      enqueueSnackbar('Yazdırma sırasında bir hata oluştu', { variant: 'error' });
    }
  };

  // İzni oluşturan kullanıcı adını alma fonksiyonu
  const getIzinOlusturanKullanici = (userId) => {
    if (!userId) return '-';
    
    try {
      console.log(`Kullanıcı adı isteniyor: ${userId}`);
      
      // Kullanıcı listesinde var mı?
      const kullanici = kullanicilar[userId];
      
      if (!kullanici) {
        console.log(`Kullanıcı bulunamadı: ${userId}`);
        return userId.substring(0, 8);
      }
      
      console.log(`Bulunan kullanıcı:`, kullanici);
      
      // Sırasıyla farklı alan kombinasyonlarını dene
      
      // 1. Personel ad-soyad
      if (kullanici.ad && kullanici.soyad) {
        return `${kullanici.ad} ${kullanici.soyad}`;
      }
      
      // 2. User name-surname
      if (kullanici.name && kullanici.surname) {
        return `${kullanici.name} ${kullanici.surname}`;
      }
      
      // 3. DisplayName
      if (kullanici.displayName) {
        return kullanici.displayName;
      }
      
      // 4. Email
      if (kullanici.email) {
        return kullanici.email;
      }
      
      // 5. UserId
      return userId.substring(0, 8);
    } catch (error) {
      console.error(`Kullanıcı bilgisi çekilirken hata: ${userId}`, error);
      return userId.substring(0, 8);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PageTitle title="İzin Yönetimi" />

        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Yeni İzin Talebi
        </Button>
      </Box>

      {/* Yazdırma içeriği */}
      <div style={{ display: 'none' }}>
        <PrintableContent 
          ref={printComponentRef}
          izin={selectedIzin} 
          personelListesi={personelListesi} 
        />
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Personel</TableCell>
              <TableCell>İzin Türü</TableCell>
              <TableCell>Başlangıç Tarihi</TableCell>
              <TableCell>Bitiş Tarihi</TableCell>
              <TableCell>Durum</TableCell>
              <TableCell>Oluşturan</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {izinler.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body1">Henüz izin kaydı bulunmamaktadır.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              izinler.map((izin) => (
                <TableRow key={izin.id}>
                  <TableCell>{izin.personelAdi || izin.personelId}</TableCell>
                  <TableCell>
                    {izinTurleri.find(t => t.id === izin.izinTuru)?.label || izin.izinTuru}
                  </TableCell>
                  <TableCell>{izin.baslangicTarihi}</TableCell>
                  <TableCell>{izin.bitisTarihi}</TableCell>
                  <TableCell>
                    <Box sx={{ 
                      display: 'inline-block', 
                      px: 1.5, 
                      py: 0.5, 
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      fontWeight: 'medium',
                      backgroundColor: 
                        izin.status === 'ONAYLANDI' ? 'success.light' :
                        izin.status === 'BEKLEMEDE' ? 'warning.light' :
                        izin.status === 'REDDEDİLDİ' ? 'error.light' : 
                        'grey.200',
                      color: 
                        izin.status === 'ONAYLANDI' ? 'success.dark' :
                        izin.status === 'BEKLEMEDE' ? 'warning.dark' :
                        izin.status === 'REDDEDİLDİ' ? 'error.dark' : 
                        'grey.800',
                    }}>
                      {izin.status}
                    </Box>
                  </TableCell>
                  <TableCell>{getIzinOlusturanKullanici(izin.createdBy)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {/* Onay/Red butonları - YÖNETİM rolü için */}
                      {userRole === 'YÖNETİM' && izin.status === 'BEKLEMEDE' && (
                        <>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(izin.id)}
                            title="İzni Onayla"
                          >
                            <CheckCircleIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleReject(izin.id)}
                            title="İzni Reddet"
                          >
                            <CancelIcon />
                          </IconButton>
                        </>
                      )}

                      {/* Düzenleme butonu - Kendi oluşturduğu izin için */}
                      {((userRole === 'YÖNETİM' && izin.createdBy === user?.uid) || 
                        (hasPermission('izin_update') && izin.createdBy === user?.uid) ||
                        (userRole === 'MUHASEBE' && izin.createdBy === user?.uid)) && 
                        izin.status === 'BEKLEMEDE' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleEdit(izin)}
                          title="İzni Düzenle"
                        >
                          <EditIcon />
                        </IconButton>
                      )}

                      {/* Silme butonu - Kendi oluşturduğu izin için */}
                      {((userRole === 'YÖNETİM' && izin.createdBy === user?.uid) || 
                        (hasPermission('izin_delete') && izin.createdBy === user?.uid) ||
                        (userRole === 'MUHASEBE' && izin.createdBy === user?.uid)) && 
                        izin.status === 'BEKLEMEDE' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(izin.id)}
                          title="İzni Sil"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}

                      {/* Yazdırma butonu - Her durumda görünür */}
                      {(userRole === 'YÖNETİM' || hasPermission('izin_yazdir') || userRole === 'MUHASEBE') && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => printIzinFormu(izin)}
                          title="İzin Formunu Yazdır"
                        >
                          <PrintIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni İzin Talebi</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={sadeceAktifPersonel}
                        onChange={(e) => setSadeceAktifPersonel(e.target.checked)}
                        color="primary"
                      />
                    }
                    label="Sadece Aktif Personel"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    freeSolo
                    options={personelListesi}
                    getOptionLabel={(option) => {
                      // Eğer option bir string ise (manuel giriş)
                      if (typeof option === 'string') return option;
                      // Eğer option bir personel objesi ise
                      return option ? `${option.ad} ${option.soyad}` : '';
                    }}
                    value={selectedPersonel || manuelPersonel || null}
                    onChange={(event, newValue) => {
                      // Eğer newValue bir personel objesi ise
                      if (newValue && typeof newValue === 'object') {
                        setSelectedPersonel(newValue);
                        setManuelPersonel(null);
                        setFormData(prev => ({
                          ...prev,
                          personelId: newValue.id,
                          tcNo: newValue.tcNo || '',
                          department: newValue.department || '',
                          adres: newValue.adres || ''
                        }));
                      } else {
                        // Manuel giriş yapılmışsa
                        setSelectedPersonel(null);
                        setManuelPersonel(newValue || ''); // null yerine boş string kullan
                        setFormData(prev => ({
                          ...prev,
                          personelId: newValue ? 'MANUEL_' + Date.now() : '',
                          tcNo: '',
                          department: '',
                          adres: ''
                        }));
                      }
                    }}
                    onInputChange={(event, newInputValue) => {
                      // Input değiştiğinde
                      if (!event) return; // Event yoksa işlem yapma
                      
                      if (!newInputValue) {
                        // Input boşsa
                        setSelectedPersonel(null);
                        setManuelPersonel(null);
                        setFormData(prev => ({
                          ...prev,
                          personelId: '',
                          tcNo: '',
                          department: '',
                          adres: ''
                        }));
                      } else if (!selectedPersonel) {
                        // Seçili personel yoksa ve input değeri varsa (manuel giriş)
                        setManuelPersonel(newInputValue);
                        setFormData(prev => ({
                          ...prev,
                          personelId: 'MANUEL_' + Date.now()
                        }));
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        required
                        label="Personel"
                        error={!selectedPersonel && !manuelPersonel}
                        helperText={!selectedPersonel && !manuelPersonel ? 'Personel seçiniz veya yazınız' : ''}
                      />
                    )}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required error={!formData.izinTuru}>
                    <InputLabel>İzin Türü</InputLabel>
                    <Select
                      name="izinTuru"
                      value={formData.izinTuru}
                      onChange={handleInputChange}
                      label="İzin Türü"
                    >
                      <MenuItem value="yillik">Yıllık İzin</MenuItem>
                      <MenuItem value="ucretsiz">Ücretsiz İzin</MenuItem>
                      <MenuItem value="mazeret">Mazeret İzni</MenuItem>
                    </Select>
                    {!formData.izinTuru && (
                      <FormHelperText>İzin türü seçiniz</FormHelperText>
                    )}
                  </FormControl>
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    name="baslangicTarihi"
                    label="Başlangıç Tarihi"
                    value={formData.baslangicTarihi}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!formData.baslangicTarihi}
                    helperText={!formData.baslangicTarihi ? 'Başlangıç tarihi seçiniz' : ''}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    name="bitisTarihi"
                    label="Bitiş Tarihi"
                    value={formData.bitisTarihi}
                    onChange={handleInputChange}
                    InputLabelProps={{ shrink: true }}
                    error={!formData.bitisTarihi}
                    helperText={!formData.bitisTarihi ? 'Bitiş tarihi seçiniz' : ''}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="TC No"
                    name="tcNo"
                    value={formData.tcNo}
                    onChange={handleInputChange}
                    placeholder="TC Kimlik No"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Branş/Görev"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="Branş ve Görev"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="İkametgah Adresi"
                    name="adres"
                    value={formData.adres}
                    onChange={handleInputChange}
                    placeholder="İkametgah Adresi"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    name="aciklama"
                    label="Açıklama"
                    value={formData.aciklama}
                    onChange={handleInputChange}
                  />
                </Grid>
              </Grid>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>İptal</Button>
            <Button type="submit" variant="contained" color="primary">
              Kaydet
            </Button>
            {/* Yazdırma butonu - hem seçili hem manuel personel için */}
            <IconButton onClick={() => {
              // Formdaki bilgilerden geçici bir izin objesi oluştur
              const geciciIzin = {
                personelId: selectedPersonel ? selectedPersonel.id : 'MANUEL_' + Date.now(),
                personelAdi: selectedPersonel ? 
                  `${selectedPersonel.ad} ${selectedPersonel.soyad}` : 
                  manuelPersonel,
                tcNo: formData.tcNo || '',
                department: formData.department || '',
                adres: formData.adres || '',
                izinTuru: formData.izinTuru || 'yillik',
                baslangicTarihi: formData.baslangicTarihi || '', 
                bitisTarihi: formData.bitisTarihi || '',
                status: 'BEKLEMEDE',
                aciklama: formData.aciklama || ''
              };
              
              // Personel bilgisini oluştur
              const personelBilgisi = selectedPersonel ? selectedPersonel : {
                id: 'MANUEL_' + Date.now(),
                ad: manuelPersonel?.split(' ')[0] || '',
                soyad: manuelPersonel?.split(' ').slice(1).join(' ') || '',
                tcNo: formData.tcNo || '',
                department: formData.department || '',
                adres: formData.adres || ''
              };
              
              // Yazdırma fonksiyonunu çağır
              printIzinFormu({
                ...geciciIzin,
                personelBilgileri: personelBilgisi
              });
            }} 
            color="primary"
            disabled={!selectedPersonel && !manuelPersonel}
            title="İzin formunu yazdır">
              <PrintIcon />
            </IconButton>
          </DialogActions>
        </form>
      </Dialog>

      <div style={{ display: 'none' }} ref={printRef}>
        <PrintableContent izin={selectedIzin} />
      </div>
    </Box>
  );
};

export default IzinYonetimi;
