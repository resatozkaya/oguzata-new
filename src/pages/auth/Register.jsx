import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Link,
  Alert,
  Container,
  MenuItem,
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../../services/auth';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    password: '',
    passwordConfirm: '',
    phone: '',
    department: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.passwordConfirm) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      await registerUser(
        formData.email,
        formData.password,
        formData.name,
        'PERSONEL',
        formData.phone,
        formData.surname
      );
      navigate('/login');
    } catch (err) {
      console.error('Kayıt hatası:', err);
      setError('Hesap oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const textFieldStyle = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: 'rgba(0, 0, 0, 0.23)',
        borderWidth: 2,
      },
      '&:hover fieldset': {
        borderColor: '#1a237e',
        borderWidth: 2,
      },
      '&.Mui-focused fieldset': {
        borderColor: '#1a237e',
        borderWidth: 2,
      },
      '& input, & .MuiSelect-select': {
        color: '#000000',
        backgroundColor: 'white',
      },
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(0, 0, 0, 0.7)',
      '&.Mui-focused': {
        color: '#1a237e',
      },
    },
    '& .MuiOutlinedInput-input': {
      backgroundColor: 'white',
    },
    '& .MuiSelect-icon': {
      color: '#000000',
    },
    mb: 2,
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1a237e',
        py: 4,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={8}
          sx={{
            p: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.95)',
            borderRadius: 2,
          }}
        >
          <img
            src="/logo.png"
            alt="OĞUZATA Logo"
            style={{ width: 180, marginBottom: 20 }}
          />

          <Typography
            variant="h4"
            sx={{
              color: '#1a237e',
              fontWeight: 600,
              mb: 1,
              textAlign: 'center',
            }}
          >
            Yeni Hesap Oluştur
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              required
              fullWidth
              label="Ad"
              name="name"
              value={formData.name}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              required
              fullWidth
              label="Soyad"
              name="surname"
              value={formData.surname}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              required
              fullWidth
              label="E-posta"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              required
              fullWidth
              label="Şifre"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              required
              fullWidth
              label="Şifre Tekrar"
              name="passwordConfirm"
              type="password"
              value={formData.passwordConfirm}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              required
              fullWidth
              label="Telefon"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              fullWidth
              label="Departman"
              name="department"
              value={formData.department}
              onChange={handleChange}
              sx={textFieldStyle}
              InputProps={{
                sx: { fontSize: '1rem' }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{
                mt: 2,
                mb: 2,
                py: 1.5,
                bgcolor: '#1a237e',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#0d47a1',
                },
              }}
            >
              KAYIT OL
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link
                component="button"
                variant="body1"
                onClick={() => navigate('/login')}
                sx={{
                  color: '#1a237e',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    textDecoration: 'underline',
                  },
                }}
              >
                Kayıtlı bir hesabınız varsa. Giriş yapın
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Register;
