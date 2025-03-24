import React, { useState } from 'react';
import { Box, Button, IconButton } from '@mui/material';
import { Add as AddIcon, Print as PrintIcon } from '@mui/icons-material';
import MasrafBeyanListesi from './MasrafBeyanListesi';
import MasrafBeyanForm from './components/MasrafBeyanForm';
import MasrafBeyanYazdir from './components/MasrafBeyanYazdir';
import PageTitle from '../../components/PageTitle';

const MasrafBeyan = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [yazdirModalAcik, setYazdirModalAcik] = useState(false);
  const [seciliMasrafBeyan, setSeciliMasrafBeyan] = useState(null);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <PageTitle>Masraf Beyan</PageTitle>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setFormOpen(true)}
        >
          Yeni Masraf Beyanı
        </Button>
      </Box>

      <MasrafBeyanListesi 
        onPrint={(masrafBeyan) => {
          setSeciliMasrafBeyan(masrafBeyan);
          setYazdirModalAcik(true);
        }}
      />

      <MasrafBeyanForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
      />

      {/* Masraf Beyan Yazdır Modal */}
      <MasrafBeyanYazdir
        open={yazdirModalAcik}
        onClose={() => {
          setSeciliMasrafBeyan(null);
          setYazdirModalAcik(false);
        }}
        masrafBeyan={seciliMasrafBeyan}
      />
    </Box>
  );
};

export default MasrafBeyan;