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

const MasrafBeyanDetay = ({ open, onClose, masrafBeyan }) => {
  if (!masrafBeyan) return null;

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
              <Typography>{masrafBeyan.hazirlayan?.ad || masrafBeyan.olusturanAdi}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Şantiye</Typography>
              <Typography>{masrafBeyan.santiye || masrafBeyan.santiyeAdi}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Oluşturma Tarihi</Typography>
              <Typography>{formatDate(masrafBeyan.createdAt)}</Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="subtitle2" color="textSecondary">Durum</Typography>
              <Typography>{masrafBeyan.durumu || 'BEKLEMEDE'}</Typography>
            </Grid>
            {(masrafBeyan.onaylayanAdi || masrafBeyan.onaylayan?.ad) && (
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">Onaylayan</Typography>
                <Typography>{masrafBeyan.onaylayanAdi || masrafBeyan.onaylayan?.ad}</Typography>
              </Grid>
            )}
            {masrafBeyan.onayTarihi && (
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="textSecondary">Onay Tarihi</Typography>
                <Typography>{formatDate(masrafBeyan.onayTarihi)}</Typography>
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