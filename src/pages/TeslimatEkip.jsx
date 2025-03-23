import React, { useState, useEffect } from 'react';
import { Box, Grid, Button, Typography, Paper, List, ListItem, ListItemText, IconButton } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import BinaYapisiDuzenle from '../components/bina/BinaYapisiDuzenle';
import BinaGorunumu from '../components/bina/BinaGorunumu';
import { useSantiye } from '../contexts/SantiyeContext';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermission } from '../contexts/PermissionContext';
import { PAGE_PERMISSIONS } from '../constants/permissions';
import PageTitle from '../components/PageTitle';
import { db } from '../lib/firebase/config';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { enqueueSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';

const TeslimatEkip = () => {
  const { seciliSantiye, seciliBlok, yenileVerileri } = useSantiye();
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const { hasPermission } = usePermission();
  const [eksiklikler, setEksiklikler] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [yapiDuzenleDialogAcik, setYapiDuzenleDialogAcik] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) {
      yenileVerileri().then(() => setLoading(false));
    }
  }, [loading, yenileVerileri]);

  useEffect(() => {
    if (!seciliSantiye?.id || !seciliBlok?.id) return;

    const q = query(
      collection(db, 'eksiklikler'),
      where('santiyeId', '==', seciliSantiye.id),
      where('blokId', '==', seciliBlok.id),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const eksiklikList = [];
      snapshot.forEach((doc) => {
        eksiklikList.push({ id: doc.id, ...doc.data() });
      });
      setEksiklikler(eksiklikList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [seciliSantiye?.id, seciliBlok?.id]);

  useEffect(() => {
    if (!hasPermission('teslimat_view')) {
      enqueueSnackbar('Bu sayfayı görüntüleme yetkiniz bulunmamaktadır.', { variant: 'error' });
      navigate('/');
    }
  }, [hasPermission, navigate]);

  const canEdit = hasPermission('teslimat_update');

  return (
    <Box sx={{ p: 2 }}>
      <PageTitle title="Teslimat Ekip" />
      
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
            borderRadius: 1,
            boxShadow: 1
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Bina Yapısı</Typography>
              {canEdit && (
                <Button
                  variant="contained"
                  startIcon={<EditIcon />}
                  size="small"
                  onClick={() => setYapiDuzenleDialogAcik(true)}
                >
                  Düzenle
                </Button>
              )}
            </Box>
            <BinaGorunumu 
              key={`${seciliBlok?.id}-${updateTrigger}`}
              blok={seciliBlok}
              santiye={seciliSantiye}
              onUpdate={async () => {
                setLoading(true);
                await yenileVerileri();
                setUpdateTrigger(prev => prev + 1);
                setLoading(false);
              }}
            />
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ 
            p: 2, 
            bgcolor: darkMode ? '#1e1e1e' : '#ffffff',
            borderRadius: 1,
            boxShadow: 1,
            minHeight: 400
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Eksiklikler</Typography>
              {hasPermission(PAGE_PERMISSIONS.EKSIKLIK.CREATE) && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  size="small"
                >
                  Yeni Eksiklik
                </Button>
              )}
            </Box>
            
            <List>
              {eksiklikler.map((eksiklik) => (
                <ListItem
                  key={eksiklik.id}
                  secondaryAction={
                    hasPermission(PAGE_PERMISSIONS.EKSIKLIK.UPDATE) && (
                      <>
                        <IconButton edge="end" aria-label="düzenle" sx={{ mr: 1 }}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="sil">
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )
                  }
                >
                  <ListItemText
                    primary={eksiklik.baslik}
                    secondary={eksiklik.aciklama}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      {canEdit && (
        <BinaYapisiDuzenle
          open={yapiDuzenleDialogAcik}
          onClose={() => setYapiDuzenleDialogAcik(false)}
        />
      )}
    </Box>
  );
};

export default TeslimatEkip;