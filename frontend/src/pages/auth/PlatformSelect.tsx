import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Fade,
  Stack,
  Chip,
} from '@mui/material';
import {
  Person,
  LocalHospital,
  Settings,
  CheckCircle,
  ArrowForward,
  Spa,
  Translate,
  Security,
  DocumentScanner,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import LanguageSelector from '../../components/common/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';

interface Platform {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  bgTint: string;
  borderRadius: string;
}

const PlatformSelect: React.FC = () => {
  const { t } = useLanguage();
  const [visible, setVisible] = useState(false);

  const platforms: Platform[] = [
    {
      id: 'patient',
      title: 'Patient Portal',
      subtitle: 'Triage, OCR & Translator',
      description: 'AI Symptom Diagnostic Triage, Prescription OCR Scan, & Multilingual Translator',
      icon: <Person sx={{ fontSize: 42 }} />,
      features: [
        'AI Symptom Triage & Diagnostic Assessment',
        'Prescription OCR & Handwriting Digitizer',
        'Medical Translator (15+ Regional & Global Languages)',
        'Decoded Medical Abbreviations (b.i.d, p.o, q4h)',
      ],
      color: '#5D7052', // Moss Green
      bgTint: '#F3F5F1',
      borderRadius: '60% 40% 30% 70% / 50% 30% 70% 50%',
    },
    {
      id: 'doctor',
      title: 'Doctor Portal',
      subtitle: 'Clinical Case Suite',
      description: 'Patient Case Management, Digital Prescription Suite, & Fraud Risk Indicators',
      icon: <LocalHospital sx={{ fontSize: 42 }} />,
      features: [
        'AI Triage Case Review & Doctor Direct Notes',
        'Digitized Prescription Scanner & Validation',
        'Translated Prescription Card Exporter',
        'Medicare Provider Fraud Compliance Check',
      ],
      color: '#C18C5D', // Terracotta Clay
      bgTint: '#FAF4EF',
      borderRadius: '40% 60% 70% 30% / 60% 40% 50% 50%',
    },
    {
      id: 'admin',
      title: 'Admin & Fraud AI Suite',
      subtitle: 'CMS Compliance & Fraud AI',
      description: 'CMS Medicare Fraud Detection, LEIE Exclusion Checker, & System Audit',
      icon: <Settings sx={{ fontSize: 42 }} />,
      features: [
        'CMS Medicare Part D Claim Anomaly Engine',
        'LEIE Excluded Provider Federal Blacklist Matcher',
        'Schedule II/III Opioid Prescribing Ratio Analytics',
        'AI Diagnostics & Knowledge Base Control',
      ],
      color: '#4A5D4E', // Deep Forest
      bgTint: '#F2F6F3',
      borderRadius: '70% 30% 50% 50% / 30% 60% 40% 70%',
    },
  ];

  useEffect(() => {
    setVisible(true);
  }, []);

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
          bgcolor: 'rgba(93, 112, 82, 0.12)', // Soft Moss
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
          bgcolor: 'rgba(193, 140, 93, 0.12)', // Soft Terracotta
          filter: 'blur(100px)',
          borderRadius: '40% 60% 70% 30% / 50% 60% 40% 50%',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Top Header Navigation Bar with Language Switcher */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={6}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                bgcolor: '#5D7052',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(93, 112, 82, 0.25)',
              }}
            >
              <Spa />
            </Box>
            <Typography variant="h5" fontWeight={700} sx={{ fontFamily: 'Fraunces, serif', color: '#2C2C24' }}>
              MediCare AI
            </Typography>
          </Stack>

          <LanguageSelector />
        </Box>

        {/* Hero Title Banner */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            label="🌱 Natural Wabi-Sabi Healthcare AI Suite"
            sx={{
              bgcolor: 'rgba(93, 112, 82, 0.12)',
              color: '#5D7052',
              fontWeight: 700,
              fontSize: '0.9rem',
              py: 2,
              px: 1,
              mb: 2,
              border: '1px solid rgba(93, 112, 82, 0.3)',
            }}
          />
          <Typography
            variant="h2"
            component="h1"
            sx={{
              fontFamily: 'Fraunces, serif',
              fontWeight: 700,
              color: '#2C2C24',
              fontSize: { xs: '2.5rem', md: '3.75rem' },
              mb: 2,
              letterSpacing: '-0.02em',
            }}
          >
            Intelligent AI Medical Care Suite
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: '#78786C',
              maxWidth: 680,
              mx: 'auto',
              fontWeight: 400,
              fontSize: { xs: '1rem', md: '1.2rem' },
              lineHeight: 1.6,
            }}
          >
            Select your clinical portal to access AI Diagnostic Triage, Prescription OCR Scanning, Multilingual Translation, and CMS Medicare Fraud Risk Analytics.
          </Typography>
        </Box>

        {/* Portal Selection Grid */}
        <Grid container spacing={4} justifyContent="center" mb={8}>
          {platforms.map((platform, index) => (
            <Grid item xs={12} md={4} key={platform.id}>
              <Fade in={visible} timeout={1000} style={{ transitionDelay: `${index * 180}ms` }}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '2.5rem',
                    bgcolor: '#FEFEFA',
                    border: '1px solid rgba(222, 216, 207, 0.8)',
                    boxShadow: '0 8px 32px -4px rgba(93, 112, 82, 0.12)',
                    transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: '0 16px 40px -6px rgba(93, 112, 82, 0.2)',
                      borderColor: platform.color,
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                      <Box
                        sx={{
                          width: 64,
                          height: 64,
                          borderRadius: platform.borderRadius,
                          bgcolor: platform.bgTint,
                          color: platform.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: `1.5px solid ${platform.color}`,
                        }}
                      >
                        {platform.icon}
                      </Box>
                      <Chip
                        label={platform.subtitle}
                        size="small"
                        sx={{
                          bgcolor: platform.bgTint,
                          color: platform.color,
                          fontWeight: 700,
                          fontSize: '0.75rem',
                        }}
                      />
                    </Box>

                    <Typography
                      variant="h4"
                      sx={{
                        fontFamily: 'Fraunces, serif',
                        fontWeight: 700,
                        color: '#2C2C24',
                        mb: 1,
                      }}
                    >
                      {platform.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#78786C', mb: 3, minHeight: 48, lineHeight: 1.6 }}>
                      {platform.description}
                    </Typography>

                    <List sx={{ mb: 3, flex: 1 }}>
                      {platform.features.map((feature, idx) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.75 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircle sx={{ color: platform.color, fontSize: 18 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: '#4A4A40',
                              fontWeight: 600,
                              fontSize: '0.875rem',
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    <Button
                      component={RouterLink}
                      to={
                        platform.id === 'patient'
                          ? '/login'
                          : platform.id === 'doctor'
                          ? '/doctor-login'
                          : '/admin-login'
                      }
                      fullWidth
                      variant="contained"
                      size="large"
                      endIcon={<ArrowForward />}
                      sx={{
                        py: 1.5,
                        bgcolor: platform.color,
                        color: '#fff',
                        borderRadius: 9999,
                        fontWeight: 700,
                        '&:hover': {
                          bgcolor: platform.color,
                          opacity: 0.9,
                          transform: 'scale(1.02)',
                        },
                      }}
                    >
                      Enter Portal
                    </Button>

                    {platform.id === 'patient' && (
                      <Button
                        component={RouterLink}
                        to="/register"
                        fullWidth
                        variant="text"
                        size="small"
                        sx={{ mt: 1.5, color: '#5D7052', fontWeight: 700 }}
                      >
                        Register New Patient
                      </Button>
                    )}

                    {platform.id === 'doctor' && (
                      <Button
                        component={RouterLink}
                        to="/doctor-register"
                        fullWidth
                        variant="text"
                        size="small"
                        sx={{ mt: 1.5, color: '#C18C5D', fontWeight: 700 }}
                      >
                        Register Doctor Account
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          ))}
        </Grid>

        {/* Feature Highlights Grid */}
        <Grid container spacing={3} mb={6}>
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '2rem',
                bgcolor: '#FEFEFA',
                border: '1px solid #DED8CF',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <DocumentScanner sx={{ fontSize: 36, color: '#5D7052' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Fraunces, serif' }}>
                  Prescription OCR
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  TrOCR vision extraction & digitizer
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '2rem',
                bgcolor: '#FEFEFA',
                border: '1px solid #DED8CF',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Translate sx={{ fontSize: 36, color: '#C18C5D' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Fraunces, serif' }}>
                  Medical Shorthand AI
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Decodes b.i.d, p.o, q4h to native scripts
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: '2rem',
                bgcolor: '#FEFEFA',
                border: '1px solid #DED8CF',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
              }}
            >
              <Security sx={{ fontSize: 36, color: '#4A5D4E' }} />
              <Box>
                <Typography variant="subtitle1" fontWeight={700} sx={{ fontFamily: 'Fraunces, serif' }}>
                  CMS Medicare Fraud AI
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  LEIE blacklist & Opioid ratio analytics
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box
          sx={{
            py: 4,
            px: 3,
            borderRadius: '2rem',
            bgcolor: 'rgba(230, 220, 205, 0.4)',
            textAlign: 'center',
            border: '1px solid #DED8CF',
          }}
        >
          <Typography variant="body2" color="#4A4A40" fontWeight={600}>
            MediCare AI © 2026 | Organic Wabi-Sabi Healthcare Suite | MIT License
          </Typography>
          <Typography variant="caption" color="#78786C" sx={{ mt: 0.5, display: 'block' }}>
            Empowering modern clinical care with warm, intelligent, and accessible AI diagnostics.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PlatformSelect;