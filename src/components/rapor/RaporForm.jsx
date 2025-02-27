import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button
} from '@mui/material';

const RaporForm = ({ onSubmit, initialData = null }) => {
  const [formData, setFormData] = useState({
    personelAdi: initialData?.personelAdi || '',
    santiye: initialData?.santiye || '',
    firma: initialData?.firma || '',
    tarih: initialData?.tarih || new Date().toISOString().split('T')[0],
    yapilanIs: initialData?.yapilanIs || ''
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <Box component="form" onSubmit={handleSubmit}>
      <TextField
        margin="normal"
        required
        fullWidth
        label="Personel Adı"
        name="personelAdi"
        value={formData.personelAdi}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        label="Şantiye"
        name="santiye"
        value={formData.santiye}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        fullWidth
        label="Firma"
        name="firma"
        value={formData.firma}
        onChange={handleChange}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        type="date"
        label="Tarih"
        name="tarih"
        value={formData.tarih}
        onChange={handleChange}
        InputLabelProps={{
          shrink: true,
        }}
      />
      <TextField
        margin="normal"
        required
        fullWidth
        multiline
        rows={4}
        label="Yapılan İş"
        name="yapilanIs"
        value={formData.yapilanIs}
        onChange={handleChange}
      />
      <Button
        type="submit"
        fullWidth
        variant="contained"
        sx={{ mt: 3, mb: 2 }}
      >
        {initialData ? 'Güncelle' : 'Kaydet'}
      </Button>
    </Box>
  );
};

export default RaporForm; 