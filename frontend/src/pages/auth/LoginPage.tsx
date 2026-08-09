import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Link,
  Divider,
  InputAdornment,
  IconButton,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Spa,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import GoogleSignInButton from '../../components/common/GoogleSignInButton';
import type { LoginCredentials } from '../../types';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, isLoading, error, clearError } = useAuthContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<LoginCredentials>({
    defaultValues: {
      email: '',
      password: '',
      platform: 'patient',
    },
  });

  useEffect(() => {
    if (isAuthenticated && user) {
      const roleRoutes: { [key: string]: string } = {
        patient: '/patient',
        doctor: '/doctor',
        admin: '/admin',
      };
      navigate(roleRoutes[user.role] || '/patient', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    clearError();
    const savedEmail = localStorage.getItem('medicare_remember_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [clearError, setValue]);

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('medicare_remember_email', data.email);
      } else {
        localStorage.removeItem('medicare_remember_email');
      }
      await login(data);
    } catch (err) {
      // Handled in AuthContext
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh" bgcolor="#FDFCF8">
        <CircularProgress sx={{ color: '#5D7052' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#FDFCF8',
        position: 'relative',
        overflow: 'hidden',
        py: 6,
        px: 2,
      }}
    >
      {/* Background Organic Ambient Color Blobs */}
      <Box
        sx={{
          position: 'absolute',
          top: '-10%',
          left: '-5%',
          width: 500,
          height: 500,
          bgcolor: 'rgba(93, 112, 82, 0.12)',
          filter: 'blur(90px)',
          borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
          pointerEvents: 'none',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '-10%',
          right: '-5%',
          width: 550,
          height: 550,
          bgcolor: 'rgba(193, 140, 93, 0.12)',
          filter: 'blur(100px)',
          borderRadius: '40% 60% 70% 30% / 50% 60% 40% 50%',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Top Bar */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '50%',
                bgcolor: '#5D7052',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Spa sx={{ fontSize: 22 }} />
            </Box>
            <Typography variant="h6" fontWeight={700} sx={{ fontFamily: 'Fraunces, serif', color: '#2C2C24' }}>
              MediCare AI
            </Typography>
          </Box>
          <LanguageSelector />
        </Box>

        <Paper
          elevation={0}
          sx={{
            borderRadius: '2.5rem',
            padding: { xs: 3, md: 5 },
            maxWidth: 480,
            margin: '0 auto',
            bgcolor: '#FEFEFA',
            border: '1px solid rgba(222, 216, 207, 0.8)',
            boxShadow: '0 12px 40px -6px rgba(93, 112, 82, 0.15)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(93, 112, 82, 0.15)',
                color: '#5D7052',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Spa sx={{ fontSize: 36 }} />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#2C2C24', mb: 1 }}
            >
              Patient Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Access your medical records, prescription OCR scanner, and AI diagnostics
            </Typography>
          </Box>

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 9999 }} onClose={clearError}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Email Address"
              type="email"
              placeholder="patient@example.com"
              margin="normal"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email', {
                required: 'Please enter your email address',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#5D7052' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter password"
              margin="normal"
              autoComplete="current-password"
              disabled={isSubmitting}
              {...register('password', {
                required: 'Please enter password',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#5D7052' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePassword}
                      edge="end"
                      disabled={isSubmitting}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', my: 1.5 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isSubmitting}
                    sx={{ color: '#5D7052', '&.Mui-checked': { color: '#5D7052' } }}
                  />
                }
                label={<Typography variant="body2">Remember Me</Typography>}
              />
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                mt: 1,
                bgcolor: '#5D7052',
                color: '#F3F4F1',
                borderRadius: 9999,
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#44533C',
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </Button>

            <GoogleSignInButton
              role="patient"
              loading={isSubmitting}
              disabled={isSubmitting}
            />
            <Divider sx={{ my: 3, borderColor: '#DED8CF' }}>OR</Divider>

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  sx={{ color: '#5D7052', fontWeight: 700 }}
                >
                  Register Now
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;