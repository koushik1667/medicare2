import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  Avatar,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  MedicalServices as MedicalServicesIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { doctorsApi } from '../../services/api';
import type { SharedMedicalCase, ChronicDisease } from '../../types';

const Cases: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [typeFilter, setTypeFilter] = useState<string>(
    searchParams.get('type') || 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');

  const {
    data: cases,
    isLoading: casesLoading,
    error: casesError,
    refetch: refetchCases,
  } = useQuery<SharedMedicalCase[]>({
    queryKey: ['doctor', 'cases', typeFilter, categoryFilter, searchInput],
    queryFn: async () => {
      const params: any = { type: typeFilter, limit: 50 };
      if (categoryFilter) params.disease_category = categoryFilter;
      if (searchInput) params.search = searchInput;

      // Use different APIs based on filter type
      if (typeFilter === 'mentioned') {
        // @我的病例 - only cases where doctor was mentioned
        return await doctorsApi.getMentions(params);
      } else {
        // 'all' or 'public' - use /doctor/cases to get public/shared cases
        return await doctorsApi.getCases(typeFilter || 'all', 50);
      }
    },
  });

  useEffect(() => {
    const newParams = new URLSearchParams();
    if (typeFilter !== 'all') newParams.set('type', typeFilter);
    if (categoryFilter) newParams.set('category', categoryFilter);
    if (searchInput) newParams.set('search', searchInput);
    setSearchParams(newParams);
  }, [typeFilter, categoryFilter, searchInput, setSearchParams]);

  const handleViewCase = (caseId: string) => {
    navigate(`/doctor/cases/${caseId}?from=cases`);
  };

  const handleFilterChange = () => {
    refetchCases();
  };

  const createDiseaseTag = (disease: ChronicDisease, small = false) => {
    const colors = {
      chronic: '#ff9800',
      special: '#2196f3',
      both: '#9c27b0',
    };

    return (
      <Chip
        key={disease.id}
        label={disease.icd10_name}
        size={small ? 'small' : 'medium'}
        sx={{
          backgroundColor: colors[disease.disease_type],
          color: 'white',
          fontSize: small ? '0.75rem' : '0.875rem',
          height: small ? '24px' : '32px',
        }}
      />
    );
  };

  const CaseCard: React.FC<{ caseItem: SharedMedicalCase }> = ({ caseItem }) => {
    const profile = caseItem.anonymous_patient_profile || {};
    const chronicDiseases = caseItem.patient_chronic_diseases || [];

    return (
      <Card
        sx={{
          cursor: 'pointer',
          transition: 'all 0.2s',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: theme.shadows[8],
          },
        }}
        onClick={() => handleViewCase(caseItem.id)}
      >
        <CardContent sx={{ flexGrow: 1 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="text.primary">
              病例 #{caseItem.id.toString().slice(0, 8)}
            </Typography>
            <Chip
              label={caseItem.original_case?.disease?.name || '未分类'}
              size="small"
              color="success"
              variant="outlined"
            />
          </Box>

          <Box display="flex" gap={2} mb={1} color="text.secondary" fontSize="0.875rem">
            <Typography variant="body2" component="span">
              👤 {profile.age_range || '未知年龄'} · {profile.gender || '未知性别'}
            </Typography>
            <Typography variant="body2" component="span">
              📍 {profile.city_tier || '未知地区'}
            </Typography>
          </Box>

          {chronicDiseases.length > 0 && (
            <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {chronicDiseases.map((disease: ChronicDisease) =>
                createDiseaseTag(disease, true)
              )}
            </Box>
          )}

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.6,
              mb: 2,
              flexGrow: 1,
            }}
          >
            {caseItem.anonymized_symptoms || '暂无症状描述'}
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              pt: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              fontSize: '0.875rem',
              color: 'text.secondary',
            }}
          >
            <Typography variant="body2" component="span">
              📅 {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
            </Typography>
            <Typography variant="body2" component="span" sx={{ color: 'success.main' }}>
              👁️ {caseItem.view_count || 0} 次查看
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  };

  if (casesError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        加载失败，请稍后重试
      </Alert>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Box mb={3}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📋 病例浏览
        </Typography>
        <Typography variant="body1" color="text.secondary">
          查看患者分享的匿名化病例，提供专业建议
        </Typography>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>病例类型</InputLabel>
                <Select
                  value={typeFilter}
                  label="病例类型"
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <MenuItem value="all">全部病例</MenuItem>
                  <MenuItem value="mentioned">@我的病例</MenuItem>
                  <MenuItem value="public">公开病例</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>科室</InputLabel>
                <Select
                  value={categoryFilter}
                  label="科室"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                >
                  <MenuItem value="">所有科室</MenuItem>
                  <MenuItem value="respiratory">呼吸科</MenuItem>
                  <MenuItem value="cardiology">心内科</MenuItem>
                  <MenuItem value="gastroenterology">消化科</MenuItem>
                  <MenuItem value="neurology">神经科</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                placeholder="搜索症状关键词..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleFilterChange()}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={2}>
              <Button
                fullWidth
                variant="contained"
                color="success"
                onClick={handleFilterChange}
                startIcon={<SearchIcon />}
              >
                筛选
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {casesLoading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : cases && cases.length > 0 ? (
        <Grid container spacing={3}>
          {cases.map((caseItem) => (
            <Grid item xs={12} sm={6} lg={4} key={caseItem.id}>
              <CaseCard caseItem={caseItem} />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Box textAlign="center" py={6}>
          <Avatar sx={{ mx: 'auto', mb: 2, width: 64, height: 64, bgcolor: 'grey.200' }}>
            <MedicalServicesIcon sx={{ fontSize: 32 }} color="action" />
          </Avatar>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            暂无病例
          </Typography>
          <Typography variant="body2" color="text.secondary">
            没有找到符合条件的病例
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Cases;
