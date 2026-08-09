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
  InputAdornment,
  IconButton,
  Divider,
  Link,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  LocalHospital,
  ArrowBack,
  Phone,
  Person,
  Business,
  MedicalServices,
  School,
  Upload,
  Delete,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authApi } from '../../services/api';

interface DoctorRegisterData {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  license_number: string;
  hospital: string;
  department: string;
  title: string;
  specialty: string;
  terms: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const DoctorRegister: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [licenseFiles, setLicenseFiles] = useState<File[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<DoctorRegisterData>({
    defaultValues: {
      email: '',
      password: '',
      full_name: '',
      phone: '',
      license_number: '',
      hospital: '',
      department: '',
      title: '',
      specialty: '',
      terms: false,
    },
  });

  useEffect(() => {
    setError(null);
  }, []);

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const files = Array.from(event.target.files);
      const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        setError(`The following files exceed the 10MB limit: ${oversizedFiles.map((f) => f.name).join(', ')}`);
        return;
      }
      setLicenseFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setLicenseFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: DoctorRegisterData) => {
    setIsSubmitting(true);
    setIsLoading(true);
    try {
      const registerData = {
        email: data.email,
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
        title: data.title || 'Attending Physician',
        department: data.department || 'General Medicine',
        hospital: data.hospital || 'General Hospital',
        license_number: data.license_number || 'NPI-1049283710',
        specialty: data.specialty || 'Internal Medicine',
        professional_type: data.specialty || 'Internal Medicine',
      };

      await authApi.registerDoctor(registerData, licenseFiles);
      navigate('/doctor-login');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Box textAlign="center" mb={3}>
            <LocalHospital sx={{ fontSize: 48, color: '#11998e', mb: 1 }} />
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Doctor Registration
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Register for the MediCare AI Physician Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="full_name"
                  control={control}
                  rules={{ required: 'Please enter your full name' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Doctor Full Name"
                      placeholder="Dr. Sarah Jenkins"
                      error={!!errors.full_name}
                      helperText={errors.full_name?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="email"
                  control={control}
                  rules={{ required: 'Please enter email address' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Professional Email"
                      placeholder="doctor@hospital.org"
                      error={!!errors.email}
                      helperText={errors.email?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: 'Please enter password', minLength: { value: 6, message: 'At least 6 characters' } }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      error={!!errors.password}
                      helperText={errors.password?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock color="action" />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={handleTogglePassword} edge="end">
                              {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Phone Number"
                      placeholder="+1 555-0188"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Phone color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="hospital"
                  control={control}
                  rules={{ required: 'Please enter hospital name' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Hospital / Clinic Name"
                      placeholder="St. Jude General Hospital"
                      error={!!errors.hospital}
                      helperText={errors.hospital?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Business color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="specialty"
                  control={control}
                  rules={{ required: 'Please enter medical specialty' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Medical Specialty"
                      placeholder="Cardiology / Internal Medicine"
                      error={!!errors.specialty}
                      helperText={errors.specialty?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <MedicalServices color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="license_number"
                  control={control}
                  rules={{ required: 'Please enter NPI / Medical License Number' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Medical License / NPI Number"
                      placeholder="NPI-1049283710"
                      error={!!errors.license_number}
                      helperText={errors.license_number?.message}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <School color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      fullWidth
                      label="Professional Title"
                      placeholder="Chief Resident / MD"
                    />
                  )}
                />
              </Grid>

              {/* Upload License Document */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '2px dashed #cbd5e1',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    bgcolor: '#f8fafc',
                  }}
                >
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    id="license-upload-input"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    multiple
                  />
                  <label htmlFor="license-upload-input" style={{ cursor: 'pointer' }}>
                    <Upload sx={{ fontSize: 40, color: '#11998e', mb: 1 }} />
                    <Typography variant="body1" fontWeight={600}>
                      Upload Medical License / Credential Document
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      PDF, JPG, PNG (Max 10MB per file)
                    </Typography>
                  </label>
                </Box>

                {licenseFiles.length > 0 && (
                  <Box mt={2}>
                    {licenseFiles.map((file, idx) => (
                      <Box key={idx} display="flex" alignItems="center" justifyContent="space-between" p={1} bgcolor="#e2e8f0" borderRadius={1} mb={1}>
                        <Typography variant="body2">{file.name}</Typography>
                        <IconButton size="small" onClick={() => handleRemoveFile(idx)}>
                          <Delete fontSize="small" color="error" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </Grid>
            </Grid>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || isLoading}
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Doctor Credentials'}
            </Button>
          </form>

          <Divider sx={{ my: 2 }} />

          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have a doctor account?{' '}
              <Link component={RouterLink} to="/doctor-login">
                Log In
              </Link>
            </Typography>
            <Button component={RouterLink} to="/" startIcon={<ArrowBack />} sx={{ mt: 2 }}>
              Back to Portal Selection
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default DoctorRegister;