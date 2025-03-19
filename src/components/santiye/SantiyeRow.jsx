import React from 'react';
import {
  TableRow,
  TableCell,
  IconButton,
  Chip,
  Box,
  Tooltip,
  Avatar
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { usePermission } from '../../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../../constants/permissions';
import { useTheme } from '../../contexts/ThemeContext';

const SantiyeRow = ({ santiye, onEdit, onDelete, onPermissionClick }) => {
  const { isDarkMode } = useTheme();
  const { hasPermission } = usePermission();
  const canEdit = hasPermission(PAGE_PERMISSIONS.SANTIYE.UPDATE, santiye.id);
  const canDelete = hasPermission(PAGE_PERMISSIONS.SANTIYE.DELETE, santiye.id);
  const canManage = hasPermission(PAGE_PERMISSIONS.SANTIYE.MANAGE, santiye.id);

  const getDurumColor = (durum) => {
    switch (durum) {
      case 'aktif': return 'success';
      case 'tamamlandi': return 'info';
      case 'beklemede': return 'warning';
      case 'iptal': return 'error';
      default: return 'default';
    }
  };

  return (
    <TableRow
      sx={{
        cursor: 'pointer',
        '&:hover': { bgcolor: isDarkMode ? 'grey.800' : 'grey.100' }
      }}
    >
      <TableCell>{santiye.kod}</TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={santiye.resimUrl}
            alt={santiye.ad}
            sx={{ width: 40, height: 40 }}
            variant="rounded"
          />
          {santiye.ad}
        </Box>
      </TableCell>
      <TableCell>{santiye.adres}</TableCell>
      <TableCell>{santiye.santiyeSefi}</TableCell>
      <TableCell>{santiye.projeMuduru}</TableCell>
      <TableCell>
        <Chip
          label={santiye.durum}
          color={getDurumColor(santiye.durum)}
          size="small"
        />
      </TableCell>
      <TableCell>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
          {canEdit && (
            <Tooltip title="Düzenle">
              <IconButton
                size="small"
                onClick={() => onEdit(santiye)}
                sx={{ color: 'primary.main' }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
          
          {canDelete && (
            <Tooltip title="Sil">
              <IconButton
                size="small"
                onClick={() => onDelete(santiye.id)}
                sx={{ color: 'error.main' }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          )}

          {canManage && (
            <Tooltip title="Yetkilendirme">
              <IconButton
                size="small"
                onClick={() => onPermissionClick(santiye)}
                sx={{ color: 'info.main' }}
              >
                <SecurityIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </TableCell>
    </TableRow>
  );
};

export default SantiyeRow;
