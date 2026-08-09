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
  Settings,
  ArrowBack,
} from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import LanguageSelector from '../../components/common/LanguageSelector';
import type { LoginCredentials } from '../../types';

const AdminLoginPage: React.FC = () => {
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
      platform: 'admin',
    },
  });

  useEffect(() => {
    if (isAuthenticated && user?.role === 'admin') {
      navigate('/admin', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    clearError();
    const savedEmail = localStorage.getItem('medicare_admin_remember_email');
    if (savedEmail) {
      setValue('email', savedEmail);
      setRememberMe(true);
    }
  }, [clearError, setValue]);

  const onSubmit = async (data: LoginCredentials) => {
    setIsSubmitting(true);
    try {
      if (rememberMe) {
        localStorage.setItem('medicare_admin_remember_email', data.email);
      } else {
        localStorage.removeItem('medicare_admin_remember_email');
      }
      await login(data);
    } catch (err: any) {
      console.error('Admin login error:', err);
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
        <CircularProgress sx={{ color: '#4A5D4E' }} />
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
          bgcolor: 'rgba(74, 93, 78, 0.12)',
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
          <Button
            component={RouterLink}
            to="/"
            startIcon={<ArrowBack />}
            sx={{ color: '#4A5D4E', fontWeight: 700 }}
          >
            Portal Select
          </Button>
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
            boxShadow: '0 12px 40px -6px rgba(74, 93, 78, 0.15)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                bgcolor: 'rgba(74, 93, 78, 0.15)',
                color: '#4A5D4E',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
              }}
            >
              <Settings sx={{ fontSize: 36 }} />
            </Box>
            <Typography
              variant="h3"
              component="h1"
              sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#2C2C24', mb: 1 }}
            >
              Admin Sign In
            </Typography>
            <Typography variant="body2" color="text.secondary">
              CMS Medicare provider fraud detection analytics & LEIE exclusion database
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 9999 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <TextField
              fullWidth
              label="Admin Email Address"
              type="email"
              placeholder="admin@medicare.gov"
              margin="normal"
              autoComplete="email"
              disabled={isSubmitting}
              {...register('email', {
                required: 'Please enter admin email address',
              })}
              error={!!errors.email}
              helperText={errors.email?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email sx={{ color: '#4A5D4E' }} />
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
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: '#4A5D4E' }} />
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
                    sx={{ color: '#4A5D4E', '&.Mui-checked': { color: '#4A5D4E' } }}
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
                bgcolor: '#4A5D4E',
                color: '#FFFFFF',
                borderRadius: 9999,
                fontWeight: 700,
                '&:hover': {
                  bgcolor: '#36453A',
                },
              }}
            >
              {isSubmitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Admin Console Sign In'
              )}
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default AdminLoginPage;
