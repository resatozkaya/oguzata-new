import React, { useState, useEffect } from 'react';
import { personelOdemeService } from '../services/personelOdemeService';
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  Tab,
  Tabs,
  Typography,
  IconButton
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import tr from 'date-fns/locale/tr';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PersonelOdeme = () => {
  const [personelOdemeleri, setPersonelOdemeleri] = useState({ maaslar: [], avanslar: [], mesailer: [] });
  const [selectedPersonel, setSelectedPersonel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [maasModalOpen, setMaasModalOpen] = useState(false);
  const [avansModalOpen, setAvansModalOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState({
    personelId: '',
    brutMaas: '',
    netMaas: '',
    donem: null,
    miktar: '',
    aciklama: ''
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const loadPersonelDetay = async (personelId, donem) => {
    try {
      setLoading(true);
      const detay = await personelOdemeService.getPersonelMaasDetay(personelId, donem);
      setPersonelOdemeleri(detay);
    } catch (error) {
      console.error('Personel detayları yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMaasOdeme = async (maasId) => {
    try {
      await personelOdemeService.updateMaasDurum(maasId, 'odendi');
      loadPersonelDetay(selectedPersonel?.id, formData.donem);
    } catch (error) {
      console.error('Maaş ödemesi yapılırken hata:', error);
    }
  };

  const handleSubmit = async (type) => {
    try {
      if (type === 'maas') {
        await personelOdemeService.createMaas(formData);
        setMaasModalOpen(false);
      } else if (type === 'avans') {
        await personelOdemeService.createAvans(formData);
        setAvansModalOpen(false);
      }
      loadPersonelDetay(selectedPersonel?.id, formData.donem);
      setFormData({ personelId: '', brutMaas: '', netMaas: '', donem: null, miktar: '', aciklama: '' });
    } catch (error) {
      console.error('Kayıt oluşturulurken hata:', error);
    }
  };

  const maasColumns = [
    { field: 'donem', headerName: 'Dönem' },
    { field: 'brutMaas', headerName: 'Brüt Maaş' },
    { field: 'netMaas', headerName: 'Net Maaş' },
    { field: 'durum', headerName: 'Durum' },
    { 
      field: 'actions',
      headerName: 'İşlemler',
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleMaasOdeme(params.row.id)}
            disabled={params.row.durum === 'odendi'}
          >
            <EditIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const avansColumns = [
    { field: 'tarih', headerName: 'Tarih' },
    { field: 'miktar', headerName: 'Miktar' },
    { field: 'aciklama', headerName: 'Açıklama' },
    { field: 'durum', headerName: 'Durum' },
    { 
      field: 'actions',
      headerName: 'İşlemler',
      renderCell: (params) => (
        <Box>
          <IconButton
            onClick={() => handleMaasOdeme(params.row.id)}
            disabled={params.row.durum === 'odendi'}
          >
            <EditIcon />
          </IconButton>
        </Box>
      )
    }
  ];

  const fazlaMesaiColumns = [
    { field: 'tarih', headerName: 'Tarih' },
    { field: 'saat', headerName: 'Saat' },
    { field: 'oran', headerName: 'Oran' },
    { field: 'onayDurumu', headerName: 'Onay Durumu' }
  ];

  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Personel Ödemeleri
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setMaasModalOpen(true)}
          >
            Yeni Maaş Kaydı
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setAvansModalOpen(true)}
          >
            Yeni Avans
          </Button>
        </Box>
      </Box>

      <Tabs value={tabValue} onChange={handleTabChange}>
        <Tab label="Maaş Ödemeleri" />
        <Tab label="Avanslar" />
        <Tab label="Fazla Mesailer" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {maasColumns.map((column) => (
                  <TableCell key={column.field}>{column.headerName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {personelOdemeleri.maaslar.map((row) => (
                <TableRow key={row.id}>
                  {maasColumns.map((column) => (
                    <TableCell key={column.field}>
                      {column.renderCell ? column.renderCell({ row }) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {avansColumns.map((column) => (
                  <TableCell key={column.field}>{column.headerName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {personelOdemeleri.avanslar.map((row) => (
                <TableRow key={row.id}>
                  {avansColumns.map((column) => (
                    <TableCell key={column.field}>
                      {column.renderCell ? column.renderCell({ row }) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                {fazlaMesaiColumns.map((column) => (
                  <TableCell key={column.field}>{column.headerName}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {personelOdemeleri.mesailer.map((row) => (
                <TableRow key={row.id}>
                  {fazlaMesaiColumns.map((column) => (
                    <TableCell key={column.field}>
                      {column.renderCell ? column.renderCell({ row }) : row[column.field]}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <Dialog open={maasModalOpen} onClose={() => setMaasModalOpen(false)}>
        <DialogTitle>Yeni Maaş Kaydı</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Personel</InputLabel>
              <Select
                value={formData.personelId}
                onChange={(e) => setFormData({ ...formData, personelId: e.target.value })}
              >
                <MenuItem value="">Seçiniz</MenuItem>
                {/* Personel listesi buraya gelecek */}
              </Select>
            </FormControl>
            <TextField
              label="Brüt Maaş"
              type="number"
              value={formData.brutMaas}
              onChange={(e) => setFormData({ ...formData, brutMaas: e.target.value })}
            />
            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
              <DatePicker
                label="Dönem"
                value={formData.donem}
                onChange={(newValue) => setFormData({ ...formData, donem: newValue })}
                renderInput={(params) => <TextField {...params} />}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMaasModalOpen(false)}>İptal</Button>
          <Button onClick={() => handleSubmit('maas')} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={avansModalOpen} onClose={() => setAvansModalOpen(false)}>
        <DialogTitle>Yeni Avans Kaydı</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Personel</InputLabel>
              <Select
                value={formData.personelId}
                onChange={(e) => setFormData({ ...formData, personelId: e.target.value })}
              >
                <MenuItem value="">Seçiniz</MenuItem>
                {/* Personel listesi buraya gelecek */}
              </Select>
            </FormControl>
            <TextField
              label="Miktar"
              type="number"
              value={formData.miktar}
              onChange={(e) => setFormData({ ...formData, miktar: e.target.value })}
            />
            <TextField
              label="Açıklama"
              multiline
              rows={4}
              value={formData.aciklama}
              onChange={(e) => setFormData({ ...formData, aciklama: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAvansModalOpen(false)}>İptal</Button>
          <Button onClick={() => handleSubmit('avans')} variant="contained">
            Kaydet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonelOdeme;
