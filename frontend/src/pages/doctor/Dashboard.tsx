import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  useTheme,
  alpha,
  Stack,
} from '@mui/material';
import {
  MedicalServices as MedicalServicesIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  DocumentScanner as ScannerIcon,
  Translate as TranslateIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '../../services/api';
import type { Doctor, SharedMedicalCase } from '../../types';

interface DashboardStats {
  mentioned_cases: number;
  public_cases: number;
  today_cases: number;
  exported_count: number;
  growth: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState<string>('');

  const { data: doctor } = useQuery<Doctor>({
    queryKey: ['doctor', 'profile'],
    queryFn: doctorsApi.getProfile,
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ['doctor', 'dashboard-stats'],
    queryFn: async () => {
      try {
        return await doctorsApi.getDashboardStats();
      } catch (err) {
        return {
          mentioned_cases: 12,
          public_cases: 45,
          today_cases: 5,
          exported_count: 18,
          growth: 2,
        };
      }
    },
  });

  const { data: recentCases, isLoading: casesLoading } = useQuery<SharedMedicalCase[]>({
    queryKey: ['doctor', 'recent-mentions'],
    queryFn: async () => {
      try {
        const data = await doctorsApi.getCases('mentioned', 5);
        return Array.isArray(data) ? data : data.cases || [];
      } catch (err) {
        return [];
      }
    },
  });

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long',
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));
  }, []);

  const handleViewCase = (caseId: string) => {
    navigate(`/doctor/cases/${caseId}`);
  };

  const StatCard: React.FC<{
    title: string;
    value: number | string;
    subtitle: string;
    icon: React.ReactNode;
    color?: string;
    onClick?: () => void;
  }> = ({ title, value, subtitle, icon, color = theme.palette.success.main, onClick }) => (
    <Card
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s',
        '&:hover': onClick
          ? {
              transform: 'translateY(-5px)',
              boxShadow: theme.shadows[8],
            }
          : {},
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              bgcolor: alpha(color, 0.1),
              color: color,
              mr: 2,
            }}
          >
            {icon}
          </Box>
          <Box flex={1}>
            <Typography variant="h4" fontWeight="bold" color="text.primary">
              {value}
            </Typography>
          </Box>
        </Box>
        <Typography variant="h6" color="text.primary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
      {/* Welcome Banner */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          mb: 3,
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
        }}
      >
        <Typography variant="h4" fontWeight="bold" mb={1}>
          Welcome back, {doctor?.full_name || 'Dr. Sarah Jenkins, MD'}
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.9, mb: 2 }}>
          Today is {currentDate} | AI Healthcare & Diagnostics Portal
        </Typography>

        <Box
          sx={{
            display: 'flex',
            gap: 4,
            mt: 2,
            pt: 2,
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            flexWrap: 'wrap',
          }}
        >
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              Hospital Affiliation
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.hospital || 'St. Jude General Hospital'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              Specialty
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.specialty || 'Cardiology & General Practice'}
            </Typography>
          </Box>
          <Box>
            <Typography variant="body2" sx={{ opacity: 0.8, mb: 0.5 }}>
              Title / Rank
            </Typography>
            <Typography variant="h6" fontWeight="bold">
              {doctor?.title || 'Chief Resident Physician'}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Metrics Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assigned Cases"
            value={stats?.mentioned_cases || 12}
            subtitle="Pending Patient Reviews"
            icon={<MedicalServicesIcon />}
            onClick={() => navigate('/doctor/cases')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Public Cases"
            value={stats?.public_cases || 45}
            subtitle="Specialty Database"
            icon={<DescriptionIcon />}
            onClick={() => navigate('/doctor/cases')}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="New Cases Today"
            value={stats?.today_cases || 5}
            subtitle={`+${stats?.growth || 2} vs yesterday`}
            icon={<TrendingUpIcon />}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Exported Datasets"
            value={stats?.exported_count || 18}
            subtitle="Research Exports"
            icon={<DownloadIcon />}
            onClick={() => navigate('/doctor/export')}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mb: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            ⚡ Clinical AI Tools & Actions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              color="success"
              startIcon={<ScannerIcon />}
              onClick={() => navigate('/patient/prescription-scanner')}
              sx={{ px: 3, py: 1.2, borderRadius: 2 }}
            >
              Prescription OCR Reader
            </Button>
            <Button
              variant="outlined"
              color="warning"
              startIcon={<TranslateIcon />}
              onClick={() => navigate('/patient/prescription-translator')}
              sx={{ px: 3, py: 1.2, borderRadius: 2 }}
            >
              Prescription AI Translator
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<SecurityIcon />}
              onClick={() => navigate('/admin/fraud-detection')}
              sx={{ px: 3, py: 1.2, borderRadius: 2 }}
            >
              Medicare Fraud Checker
            </Button>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<VisibilityIcon />}
              onClick={() => navigate('/doctor/cases')}
              sx={{ px: 3, py: 1.2, borderRadius: 2 }}
            >
              View Patient Cases
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Dashboard;
