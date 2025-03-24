import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Print as PrintIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useSnackbar } from 'notistack';
import { useAuth } from '../../contexts/AuthContext';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { MASRAF_BEYAN_DURUMLARI } from '../../types/masrafBeyan';
import { masrafBeyanService } from '../../services/masrafBeyanService';
import { formatDate, formatCurrency } from '../../utils/format';
import MasrafBeyanForm from './components/MasrafBeyanForm';
import MasrafBeyanYazdir from './components/MasrafBeyanYazdir';
import MasrafBeyanDetay from './components/MasrafBeyanDetay';
import PageTitle from '../../components/PageTitle';

const MasrafBeyan = () => {
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();
  const { enqueueSnackbar } = useSnackbar();

  const [masrafBeyanlar, setMasrafBeyanlar] = useState([]);
  const [seciliMasrafBeyan, setSeciliMasrafBeyan] = useState(null);
  const [formModalAcik, setFormModalAcik] = useState(false);
  const [yazdirModalAcik, setYazdirModalAcik] = useState(false);
  const [detayModalAcik, setDetayModalAcik] = useState(false);
  const [loading, setLoading] = useState(false);

  // Yetki kontrolleri
  const canCreate = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.CREATE);
  const canUpdate = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.UPDATE);
  const canDelete = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.DELETE);
  const canManage = hasPermission(PAGE_PERMISSIONS.MASRAF_BEYAN.MANAGE);

  useEffect(() => {
    if (currentUser?.uid) {
      masrafBeyanlariniYukle();
    }
  }, [currentUser]);

  const masrafBeyanlariniYukle = async () => {
    if (!currentUser?.uid) {
      console.warn('Kullanıcı ID bulunamadı');
      return;
    }

    try {
      setLoading(true);
      const data = await masrafBeyanService.getByUserId(currentUser.uid);
      setMasrafBeyanlar(data);
    } catch (error) {
      console.error('Masraf beyanları yüklenirken hata:', error);
      enqueueSnackbar('Masraf beyanları yüklenirken hata oluştu', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleYeniMasrafBeyan = () => {
    setSeciliMasrafBeyan(null);
    setFormModalAcik(true);
  };

  const handleDuzenle = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setFormModalAcik(true);
  };

  const handleSil = async (id) => {
    if (!window.confirm('Bu masraf beyanını silmek istediğinize emin misiniz?')) {
      return;
    }

    try {
      await masrafBeyanService.delete(id);
      enqueueSnackbar('Masraf beyanı başarıyla silindi', { variant: 'success' });
      masrafBeyanlariniYukle();
    } catch (error) {
      console.error('Masraf beyanı silinirken hata:', error);
      enqueueSnackbar(error.message || 'Masraf beyanı silinirken hata oluştu', { variant: 'error' });
    }
  };

  const handleFormKapat = () => {
    setSeciliMasrafBeyan(null);
    setFormModalAcik(false);
  };

  const handleFormKaydet = async (yeniMasrafBeyan) => {
    try {
      if (seciliMasrafBeyan) {
        await masrafBeyanService.update(seciliMasrafBeyan.id, yeniMasrafBeyan);
        enqueueSnackbar('Masraf beyanı başarıyla güncellendi', { variant: 'success' });
      } else {
        await masrafBeyanService.create({
          ...yeniMasrafBeyan,
          olusturanId: currentUser.uid,
          olusturanAdi: currentUser.displayName
        });
        enqueueSnackbar('Masraf beyanı başarıyla oluşturuldu', { variant: 'success' });
      }
      handleFormKapat();
      masrafBeyanlariniYukle();
    } catch (error) {
      console.error('Masraf beyanı kaydedilirken hata:', error);
      enqueueSnackbar('Masraf beyanı kaydedilirken hata oluştu', { variant: 'error' });
    }
  };

  const handleDetayGoster = (masrafBeyan) => {
    setSeciliMasrafBeyan(masrafBeyan);
    setDetayModalAcik(true);
  };

  const getDurumChip = (durum) => {
    let color = 'default';
    switch (durum) {
      case MASRAF_BEYAN_DURUMLARI.BEKLEMEDE:
        color = 'warning';
        break;
      case MASRAF_BEYAN_DURUMLARI.ONAYLANDI:
        color = 'success';
        break;
      case MASRAF_BEYAN_DURUMLARI.REDDEDILDI:
        color = 'error';
        break;
    }
    return <Chip label={durum} color={color} size="small" />;
  };

  return (
    <Box>
      <PageTitle title="Masraf Beyan" />

      {/* Üst Toolbar */}
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
        {canCreate && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleYeniMasrafBeyan}
          >
            Yeni Masraf Beyanı
          </Button>
        )}
      </Box>

      {/* Masraf Beyanları Tablosu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tarih</TableCell>
              <TableCell>Şantiye</TableCell>
              <TableCell>Toplam Tutar (TL)</TableCell>
              <TableCell>Durumu</TableCell>
              <TableCell>Ödeme Durumu</TableCell>
              <TableCell>İşlemler</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {masrafBeyanlar.map((masrafBeyan) => (
              <TableRow key={masrafBeyan.id}>
                <TableCell>{formatDate(masrafBeyan.tarih)}</TableCell>
                <TableCell>{masrafBeyan.santiyeAdi}</TableCell>
                <TableCell>
                  {formatCurrency(
                    masrafBeyan.masraflar.reduce((toplam, masraf) => toplam + (parseFloat(masraf.tutar) || 0), 0),
                    'TL'
                  )}
                </TableCell>
                <TableCell>{getDurumChip(masrafBeyan.durumu)}</TableCell>
                <TableCell>
                  {masrafBeyan.odendi ? (
                    <Chip 
                      label="Ödendi" 
                      color="success" 
                      size="small"
                      title={`${formatDate(masrafBeyan.odemeTarihi)} tarihinde ${masrafBeyan.odeyenAdi} tarafından ödendi`}
                    />
                  ) : (
                    <Chip 
                      label="Ödenmedi" 
                      color="default" 
                      size="small" 
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDetayGoster(masrafBeyan)}
                      title="Detay"
                    >
                      <InfoIcon fontSize="small" />
                    </IconButton>

                    <IconButton
                      size="small"
                      onClick={() => {
                        setSeciliMasrafBeyan(masrafBeyan);
                        setYazdirModalAcik(true);
                      }}
                      title="Yazdır"
                    >
                      <PrintIcon fontSize="small" />
                    </IconButton>

                    {masrafBeyan.durumu !== MASRAF_BEYAN_DURUMLARI.ONAYLANDI && canUpdate && (
                      <IconButton
                        size="small"
                        onClick={() => handleDuzenle(masrafBeyan)}
                        title="Düzenle"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )}

                    {masrafBeyan.durumu !== MASRAF_BEYAN_DURUMLARI.ONAYLANDI && canDelete && (
                      <IconButton
                        size="small"
                        onClick={() => handleSil(masrafBeyan.id)}
                        title="Sil"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {masrafBeyanlar.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Masraf beyanı bulunamadı
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Detay Modal */}
      <MasrafBeyanDetay
        open={detayModalAcik}
        onClose={() => setDetayModalAcik(false)}
        masrafBeyan={seciliMasrafBeyan}
      />

      {/* Form Modal */}
      <MasrafBeyanForm
        open={formModalAcik}
        onClose={handleFormKapat}
        onSave={handleFormKaydet}
        masrafBeyan={seciliMasrafBeyan}
      />

      {/* Yazdırma Modal */}
      <MasrafBeyanYazdir
        open={yazdirModalAcik}
        onClose={() => setYazdirModalAcik(false)}
        masrafBeyan={seciliMasrafBeyan}
      />
    </Box>
  );
};

export default MasrafBeyan;