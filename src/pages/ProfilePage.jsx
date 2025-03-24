import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Avatar,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import PageTitle from '../components/PageTitle';

const ProfilePage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileData, setProfileData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || '',
    position: currentUser?.position || ''
  });

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Dosya boyutu kontrolü (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Resmi base64'e çevir
      const base64Image = await convertToBase64(file);
      
      // Sadece Firestore güncellemesi yap
      await updateUserProfile({ photoURL: base64Image });
      
      setSuccess('Profil resmi başarıyla güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Profil resmi yükleme hatası:', error);
      setError('Profil resmi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Firestore'daki kullanıcı dokümanını güncelle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        displayName: profileData.displayName,
        phone: profileData.phone,
        department: profileData.department,
        position: profileData.position
      });

      // Auth profilini güncelle
      await updateUserProfile({
        displayName: profileData.displayName
      });

      setSuccess('Profil bilgileri başarıyla güncellendi');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Profil güncelleme hatası:', error);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <PageTitle title="Profil" />
      
      <Paper sx={{ p: 4, mb: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={currentUser?.photoURL}
              sx={{
                width: 120,
                height: 120,
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            />
            <input
              accept="image/*"
              type="file"
              id="profile-image-upload"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              disabled={loading}
            />
            <label htmlFor="profile-image-upload">
              <IconButton
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : <PhotoCamera />}
              </IconButton>
            </label>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Ad Soyad"
            name="displayName"
            value={profileData.displayName}
            onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            label="E-posta"
            name="email"
            value={profileData.email}
            disabled
          />
          <TextField
            margin="normal"
            fullWidth
            label="Telefon"
            name="phone"
            value={profileData.phone}
            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Departman"
            name="department"
            value={profileData.department}
            onChange={(e) => setProfileData({ ...profileData, department: e.target.value })}
            disabled={loading}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Pozisyon"
            name="position"
            value={profileData.position}
            onChange={(e) => setProfileData({ ...profileData, position: e.target.value })}
            disabled={loading}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? 'Güncelleniyor...' : 'Profili Güncelle'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
