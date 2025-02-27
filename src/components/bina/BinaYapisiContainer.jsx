import React from 'react';
import { Box, CircularProgress, Typography, Button } from '@mui/material';
import BinaYapisi from './BinaYapisi';
import { binaService } from '../../services/binaService';
import { useSnackbar } from '../../contexts/SnackbarContext';
import { useSantiye } from '../../contexts/SantiyeContext';

const BinaYapisiContainer = ({ santiyeId, blokId, onDaireSelect }) => {
  const [loading, setLoading] = React.useState(true);
  const [binaData, setBinaData] = React.useState(null);
  const { showSnackbar } = useSnackbar();
  const { seciliSantiye, seciliBlok } = useSantiye();

  const loadBinaYapisi = React.useCallback(async () => {
    if (!santiyeId || !blokId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Bina yapısı yükleniyor:", { santiyeId, blokId });
      const data = await binaService.getBlokBilgileri(santiyeId, blokId);
      console.log("Yüklenen bina yapısı:", data);
      setBinaData(data);
    } catch (error) {
      console.error('Bina yapısı yüklenirken hata:', error);
      showSnackbar('Bina yapısı yüklenirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  }, [santiyeId, blokId, showSnackbar]);

  React.useEffect(() => {
    loadBinaYapisi();
  }, [loadBinaYapisi]);

  const handleBinaYapisiKaydet = async (yeniYapi) => {
    try {
      setLoading(true);
      await binaService.setBinaYapisi(santiyeId, blokId, yeniYapi);
      await loadBinaYapisi();
      showSnackbar('Bina yapısı başarıyla kaydedildi', 'success');
    } catch (error) {
      console.error('Bina yapısı kaydedilirken hata:', error);
      showSnackbar('Bina yapısı kaydedilirken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleYeniYapiOlustur = async () => {
    try {
      setLoading(true);
      const yeniYapi = await binaService.blokYapisiOlustur(santiyeId, blokId);
      setBinaData(yeniYapi);
      showSnackbar('Bina yapısı oluşturuldu', 'success');
    } catch (error) {
      console.error('Bina yapısı oluşturulurken hata:', error);
      showSnackbar('Bina yapısı oluşturulurken hata oluştu', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!santiyeId || !blokId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Lütfen şantiye ve blok seçin</Typography>
      </Box>
    );
  }

  if (!binaData || !binaData.bloklar?.[0]?.katlar?.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
        <Typography gutterBottom>Bu blok için bina yapısı bulunamadı</Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={handleYeniYapiOlustur}
        >
          Bina Yapısını Oluştur
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <BinaYapisi
        data={binaData}
        onSave={handleBinaYapisiKaydet}
        onDaireClick={onDaireSelect}
        seciliSantiye={seciliSantiye}
        seciliBlok={seciliBlok}
      />
    </Box>
  );
};

export default BinaYapisiContainer; 