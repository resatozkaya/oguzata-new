import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { storage, db } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { currentUser, setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    surname: currentUser?.surname || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    position: currentUser?.position || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError('');

      // Resmi base64'e çevir
      const base64Image = await convertToBase64(file);

      // Firestore'da kullanıcı bilgilerini güncelle
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        photoURL: base64Image
      });

      // Context'teki kullanıcı bilgilerini güncelle
      setCurrentUser(prev => ({
        ...prev,
        photoURL: base64Image
      }));

      setSuccess('Profil resmi başarıyla güncellendi');
    } catch (error) {
      console.error('Resim yükleme hatası:', error);
      setError('Profil resmi güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Firestore'da kullanıcı bilgilerini güncelle
      const userRef = doc(db, 'users', currentUser.id);
      await updateDoc(userRef, {
        name: formData.name,
        surname: formData.surname,
        phone: formData.phone,
        position: formData.position
      });

      // Context'teki kullanıcı bilgilerini güncelle
      setCurrentUser(prev => ({
        ...prev,
        ...formData,
        displayName: `${formData.name} ${formData.surname}`
      }));

      setSuccess('Profil bilgileri başarıyla güncellendi');
      
      // Kısa bir süre sonra ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/');
      }, 1500);

    } catch (error) {
      console.error('Güncelleme hatası:', error);
      setError('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
        <Typography variant="h5" gutterBottom>
          Profil Bilgileri
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
          Kişisel bilgilerinizi buradan güncelleyebilirsiniz
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={currentUser?.photoURL}
              sx={{ width: 120, height: 120 }}
            />
            <input
              accept="image/*"
              type="file"
              id="icon-button-file"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="icon-button-file">
              <IconButton
                color="primary"
                component="span"
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  bgcolor: 'background.paper'
                }}
              >
                <PhotoCamera />
              </IconButton>
            </label>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Ad"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            required
            fullWidth
            label="Soyad"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="E-posta"
            name="email"
            value={formData.email}
            disabled
          />
          <TextField
            margin="normal"
            fullWidth
            label="Telefon"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
          />
          <TextField
            margin="normal"
            fullWidth
            label="Pozisyon"
            name="position"
            value={formData.position}
            onChange={handleChange}
          />
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3 }}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'DEĞİŞİKLİKLERİ KAYDET'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
