import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import { Close as CloseIcon, Print as PrintIcon } from '@mui/icons-material';
import { formatDate, formatCurrency } from '../../../utils/format';

const MasrafBeyanYazdir = ({ open, onClose, masrafBeyan }) => {
  const handlePrint = () => {
    if (!masrafBeyan) {
      console.error('Masraf beyanı bulunamadı');
      return;
    }

    console.log('Yazdırılacak masraf beyanı:', masrafBeyan);
    
    // Yazdırma içeriğini hazırla
    const printContent = document.createElement('div');
    printContent.innerHTML = `
      <div style="font-family: Arial, sans-serif; margin: 10mm; font-size: 11px; max-height: 277mm; overflow: hidden;">
        <div style="text-align: center; font-weight: bold; font-size: 14px; margin-bottom: 10px;">
          MASRAF BEYAN FORMU
        </div>

        <table style="width: 100%; margin-bottom: 15px; border: none;">
          <tr>
            <td style="font-weight: bold; width: 100px; border: none;">AÇIKLAMA:</td>
            <td style="border: none;">${masrafBeyan.olusturanAdi || ''}</td>
          </tr>
        </table>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 15px;">
          <tr>
            <th style="border: 1px solid black; padding: 4px; width: 5%;">S.NO</th>
            <th style="border: 1px solid black; padding: 4px; width: 15%;">TARİH</th>
            <th style="border: 1px solid black; padding: 4px; width: 60%;">AÇIKLAMA</th>
            <th style="border: 1px solid black; padding: 4px; width: 10%;">TL</th>
            <th style="border: 1px solid black; padding: 4px; width: 10%;">USD</th>
          </tr>
          ${(masrafBeyan.masraflar || []).map((masraf, index) => `
            <tr>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">${index + 1}</td>
              <td style="border: 1px solid black; padding: 4px;">${masraf.tarih ? formatDate(new Date(masraf.tarih)) : '-'}</td>
              <td style="border: 1px solid black; padding: 4px;">${masraf.aciklama || ''}</td>
              <td style="border: 1px solid black; padding: 4px; text-align: right;">${formatCurrency(masraf.tutar || 0)}</td>
              <td style="border: 1px solid black; padding: 4px;"></td>
            </tr>
          `).join('')}
          ${Array(Math.max(0, 20 - (masrafBeyan.masraflar || []).length)).fill(null).map((_, index) => `
            <tr>
              <td style="border: 1px solid black; padding: 4px; text-align: center;">${(masrafBeyan.masraflar || []).length + index + 1}</td>
              <td style="border: 1px solid black; padding: 4px;"></td>
              <td style="border: 1px solid black; padding: 4px;"></td>
              <td style="border: 1px solid black; padding: 4px;"></td>
              <td style="border: 1px solid black; padding: 4px;"></td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">TOPLAM:</td>
            <td style="border: 1px solid black; padding: 4px; text-align: right; font-weight: bold;">${formatCurrency((masrafBeyan.masraflar || []).reduce((toplam, masraf) => toplam + (parseFloat(masraf.tutar) || 0), 0))}</td>
            <td style="border: 1px solid black; padding: 4px;"></td>
          </tr>
        </table>

        <div style="margin-top: 30px; display: flex; justify-content: space-between;">
          <div style="width: 45%;">
            <div style="font-size: 11px;">DÜZENLEYEN</div>
            <div style="margin-top: 20px;">
              <div>${masrafBeyan.hazirlayan?.ad || masrafBeyan.olusturanAdi || ''}</div>
              <div style="font-size: 10px; color: #666; margin-top: 4px;">${masrafBeyan.createdAt ? formatDate(masrafBeyan.createdAt) : ''}</div>
              <div style="margin-top: 15px; border-top: 1px solid black;"></div>
            </div>
          </div>
          <div style="width: 45%;">
            <div style="font-size: 11px;">ONAYLAYAN</div>
            <div style="margin-top: 20px;">
              <div>${masrafBeyan.onaylayanAdi || masrafBeyan.onaylayan?.ad || ''}</div>
              <div style="font-size: 10px; color: #666; margin-top: 4px;">${masrafBeyan.onayTarihi ? formatDate(masrafBeyan.onayTarihi) : ''}</div>
              <div style="margin-top: 15px; border-top: 1px solid black;"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Mevcut sayfayı temizle ve yazdırma içeriğini ekle
    document.body.innerHTML = '';
    document.body.appendChild(printContent);

    // Yazdırma işlemini başlat
    window.print();

    // Sayfayı yenile
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Masraf Beyanı Yazdır
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            fullWidth
          >
            Yazdır
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default MasrafBeyanYazdir;