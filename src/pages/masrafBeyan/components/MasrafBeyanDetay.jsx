import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/format';
import { MASRAF_BEYAN_DURUMLARI } from '../../../types/masrafBeyan';

const MasrafBeyanDetay = ({ open, onClose, masrafBeyan }) => {
  if (!masrafBeyan) return null;

  console.log('Detay Modal - Masraf Beyan:', masrafBeyan);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Masraf Beyanı Detay
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Oluşturan</Typography>
              <Typography>{masrafBeyan.olusturanAdi}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Şantiye</Typography>
              <Typography>{masrafBeyan.santiyeAdi}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Oluşturma Tarihi</Typography>
              <Typography>{formatDate(masrafBeyan.createdAt)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Durum</Typography>
              <Typography>{masrafBeyan.durumu}</Typography>
            </Grid>

            {/* Red sebebi alanı */}
            {masrafBeyan.durumu === MASRAF_BEYAN_DURUMLARI.REDDEDILDI && (
              <Grid item xs={12}>
                <Box sx={{ mt: 1, p: 2, bgcolor: '#fff3f3', borderRadius: 1 }}>
                  <Typography variant="subtitle2" color="error" gutterBottom>
                    Red Sebebi:
                  </Typography>
                  <Typography color="error">
                    {masrafBeyan.redNedeni || 'Red sebebi belirtilmemiş'}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Açıklama</TableCell>
                  <TableCell align="right">Tutar</TableCell>
                  <TableCell align="right">Para Birimi</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(masrafBeyan.kalemler || masrafBeyan.masraflar)?.map((kalem, index) => (
                  <TableRow key={index}>
                    <TableCell>{kalem.aciklama}</TableCell>
                    <TableCell align="right">{formatCurrency(kalem.tutar)}</TableCell>
                    <TableCell align="right">TL</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell align="right">
                    <strong>TOPLAM:</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{formatCurrency(masrafBeyan.toplamTutar)}</strong>
                  </TableCell>
                  <TableCell align="right">TL</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MasrafBeyanDetay;