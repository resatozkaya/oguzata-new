import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { Print as PrintIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import MasrafBeyanYazdir from './components/MasrafBeyanYazdir';

const MasrafBeyanListesi = ({ onPrint }) => {
  const [masraflar, setMasraflar] = useState([]);
  const [selectedMasraf, setSelectedMasraf] = useState(null);
  const [yazdirModalAcik, setYazdirModalAcik] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'masrafBeyanlar'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const yeniMasraflar = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          tarih: data.tarih?.toDate?.() || data.tarih,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          onayTarihi: data.onayTarihi?.toDate?.() || data.onayTarihi,
          kalemler: data.kalemler || []
        };
      });
      setMasraflar(yeniMasraflar);
    });
    return () => unsubscribe();
  }, []);

  const handlePrint = (masraf) => {
    setSelectedMasraf(masraf);
    setYazdirModalAcik(true);
    onPrint(masraf);
  };

  const getDurumChip = (durum) => {
    let color = 'default';
    switch (durum) {
      case 'BEKLEMEDE':
        color = 'warning';
        break;
      case 'ONAYLANDI':
        color = 'success';
        break;
      case 'REDDEDILDI':
        color = 'error';
        break;
      default:
        color = 'default';
    }
    return <Chip label={durum} color={color} size="small" />;
  };

  const getOdemeDurumuChip = (durum) => {
    return <Chip 
      label={durum} 
      color={durum === 'Ödendi' ? 'success' : 'default'} 
      size="small" 
    />;
  };

  const formatTarih = (tarih) => {
    if (!tarih) return '-';
    try {
      if (tarih instanceof Date) {
        return format(tarih, 'dd.MM.yyyy', { locale: tr });
      } else if (tarih.seconds) {
        return format(new Date(tarih.seconds * 1000), 'dd.MM.yyyy', { locale: tr });
      }
      return '-';
    } catch (error) {
      console.error('Tarih formatlanırken hata:', error);
      return '-';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Tarih</TableCell>
            <TableCell>Oluşturan</TableCell>
            <TableCell>Şantiye</TableCell>
            <TableCell align="right">Toplam Tutar (TL)</TableCell>
            <TableCell>Durumu</TableCell>
            <TableCell>Onay Tarihi</TableCell>
            <TableCell>Ödeme Durumu</TableCell>
            <TableCell align="center">İşlemler</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {masraflar.map((masraf) => (
            <TableRow key={masraf.id}>
              <TableCell>{formatTarih(masraf.tarih)}</TableCell>
              <TableCell>{masraf.hazirlayan?.ad || '-'}</TableCell>
              <TableCell>{masraf.santiye}</TableCell>
              <TableCell align="right">
                {Number(masraf.toplamTutar).toLocaleString('tr-TR', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })} ₺
              </TableCell>
              <TableCell>{getDurumChip(masraf.durumu)}</TableCell>
              <TableCell>{formatTarih(masraf.onayTarihi)}</TableCell>
              <TableCell>{getOdemeDurumuChip(masraf.odemeDurumu)}</TableCell>
              <TableCell align="center">
                <Tooltip title="Yazdır">
                  <IconButton onClick={() => handlePrint(masraf)}>
                    <PrintIcon />
                  </IconButton>
                </Tooltip>
                {masraf.durumu === 'REDDEDILDI' && (
                  <Tooltip title="Sil">
                    <IconButton color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <MasrafBeyanYazdir
        open={yazdirModalAcik}
        onClose={() => setYazdirModalAcik(false)}
        masrafBeyan={selectedMasraf}
      />
    </TableContainer>
  );
};

export default MasrafBeyanListesi; 