import React from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography
} from '@mui/material';
import { useSantiye } from '../../contexts/SantiyeContext';
import { useDepo } from '../../contexts/DepoContext';

const DepoSantiyeSecici = () => {
  const { santiyeler } = useSantiye();
  const { seciliSantiye, setSeciliSantiye } = useDepo();

  if (!santiyeler.length) {
    return (
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Henüz şantiye bulunmuyor...
      </Typography>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <FormControl fullWidth variant="outlined">
        <InputLabel id="santiye-secici-label">Şantiye Seçin</InputLabel>
        <Select
          labelId="santiye-secici-label"
          id="santiye-secici"
          value={seciliSantiye?.id || ''}
          label="Şantiye Seçin"
          onChange={(e) => {
            const santiye = santiyeler.find(s => s.id === e.target.value);
            setSeciliSantiye(santiye);
          }}
        >
          {santiyeler.map((santiye) => (
            <MenuItem key={santiye.id} value={santiye.id}>
              {santiye.ad}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default DepoSantiyeSecici; 