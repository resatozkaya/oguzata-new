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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../../config/firebase';

const Login = () => {
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setCurrentUser({
          id: userCredential.user.uid,
          email: userData.email,
          name: userData.displayName,
          role: userData.role
        });
        navigate('/');
      } else {
        setError('Kullanıcı bilgileri bulunamadı.');
      }
    } catch (err) {
      console.error('Giriş hatası:', err);
      setError('Giriş yapılamadı. E-posta veya şifre hatalı.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError('Lütfen e-posta adresinizi girin.');
      return;
    }
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(resetEmail);
      setResetSuccess(true);
      setError('');
    } catch (err) {
      setError('Şifre sıfırlama e-postası gönderilemedi.');
      console.error('Şifre sıfırlama hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#1a237e'
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
            borderRadius: 2
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
              textAlign: 'center'
            }}
          >
            OĞUZATA
          </Typography>
          
          <Typography
            variant="h6"
            sx={{
              color: '#455a64',
              mb: 4,
              fontWeight: 500,
              textAlign: 'center'
            }}
          >
            Şantiye Takip Programı
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          {resetSuccess && (
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="E-posta"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              sx={{ 
                mb: 2,
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
                  '& input': {
                    color: '#000000',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)',
                  '&.Mui-focused': {
                    color: '#1a237e',
                  },
                },
              }}
              InputProps={{
                sx: { 
                  fontSize: '1rem',
                  backgroundColor: 'white',
                }
              }}
              InputLabelProps={{
                sx: { fontSize: '1rem' }
              }}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              label="Şifre"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              sx={{ 
                mb: 3,
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
                  '& input': {
                    color: '#000000',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: 'rgba(0, 0, 0, 0.7)',
                  '&.Mui-focused': {
                    color: '#1a237e',
                  },
                },
              }}
              InputProps={{
                sx: { 
                  fontSize: '1rem',
                  backgroundColor: 'white',
                }
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
                mt: 1,
                mb: 2,
                py: 1.5,
                bgcolor: '#1a237e',
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#0d47a1'
                }
              }}
            >
              GİRİŞ YAP
            </Button>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Link
                component="button"
                variant="body1"
                onClick={() => navigate('/register')}
                sx={{
                  color: '#1a237e',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Hesap Oluştur
              </Link>

              <Link
                component="button"
                variant="body1"
                onClick={handleResetPassword}
                sx={{
                  color: '#1a237e',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}
              >
                Şifremi Unuttum
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
