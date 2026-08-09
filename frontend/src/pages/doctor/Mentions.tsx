import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { doctorsApi } from '../../services/api';
import type { SharedMedicalCase, ChronicDisease } from '../../types';

const Mentions: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState<string>('all');

  const {
    data: allCases,
    isLoading: casesLoading,
    error: casesError,
  } = useQuery<SharedMedicalCase[]>({
    queryKey: ['doctor', 'mentions'],
    queryFn: async () => {
      const response = await doctorsApi.getMentions({ filter: 'mentioned' });
      return response;
    },
  });

  const filteredCases = React.useMemo(() => {
    if (!allCases || allCases.length === 0) return [];
    
    const now = new Date();
    let filtered = allCases;
    
    switch (timeFilter) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        filtered = allCases.filter(caseItem => {
          const caseDate = new Date(caseItem.created_at);
          return caseDate >= today;
        });
        break;
        
      case '3days':
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        filtered = allCases.filter(caseItem => {
          const caseDate = new Date(caseItem.created_at);
          return caseDate >= threeDaysAgo;
        });
        break;
        
      case 'week':
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = allCases.filter(caseItem => {
          const caseDate = new Date(caseItem.created_at);
          return caseDate >= oneWeekAgo;
        });
        break;
        
      default:
        filtered = allCases;
    }
    
    return filtered;
  }, [allCases, timeFilter]);

  const ChronicDiseaseTag = ({ disease }: { disease: ChronicDisease }) => {
    const typeLabel = disease.disease_type === 'special' ? '特殊病' :
                      disease.disease_type === 'chronic' ? '慢性病' : '特殊病+慢性病';
    const typeColor = disease.disease_type === 'special' ? theme.palette.error.main :
                      disease.disease_type === 'chronic' ? theme.palette.info.main : theme.palette.secondary.main;
    
    const chineseName = disease.common_names && disease.common_names.length > 0
      ? disease.common_names[0]
      : disease.icd10_name;

    return (
      <Chip
        label={`⚠️ ${chineseName}`}
        size="small"
        sx={{
          backgroundColor: alpha(typeColor, 0.1),
          color: typeColor,
          border: `1px solid ${alpha(typeColor, 0.3)}`,
          fontWeight: 500,
          mr: 0.5,
          mb: 0.5,
        }}
      />
    );
  };

  const handleViewCase = (caseId: string) => {
    navigate(`/doctor/cases/${caseId}?from=mentions`);
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
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📢 @我的病例
          </Typography>
          <Typography variant="body1" color="text.secondary">
            查看患者@提及您的病例，这些病例需要您的专业建议
          </Typography>
        </CardContent>
      </Card>

      <Alert severity="info" sx={{ mb: 3 }}>
        💡 提示：当患者在分享病例时使用@功能提到您，相关病例会显示在这里。
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="subtitle1" fontWeight="bold">
              ⏰ 时间筛选：
            </Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
              >
                <MenuItem value="all">全部时间</MenuItem>
                <MenuItem value="today">今日</MenuItem>
                <MenuItem value="3days">三天内</MenuItem>
                <MenuItem value="week">一周内</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              共 {filteredCases.length} 条病例
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {casesLoading ? (
        <Box display="flex" justifyContent="center" p={6}>
          <CircularProgress size={40} />
        </Box>
      ) : filteredCases && filteredCases.length > 0 ? (
        <Box display="grid" gap={3}>
          {filteredCases.map((caseItem) => {
            const profile = caseItem.anonymous_patient_profile || {};
            const chronicDiseases = caseItem.patient_chronic_diseases || [];
            
            return (
              <Card
                key={caseItem.id}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
                onClick={() => handleViewCase(caseItem.id)}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      mb: 2,
                    }}
                  >
                    <Chip
                      label={`病例 #${caseItem.id.toString().slice(0, 8)}`}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label="📢 @提到您"
                      size="small"
                      sx={{
                        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)',
                        color: 'white',
                        fontWeight: 500,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    />
                  </Box>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 2,
                      mb: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography variant="body2" component="span">
                      👤 {profile.age_range || '未知年龄'} · {profile.gender || '未知性别'}
                    </Typography>
                    <Typography variant="body2" component="span">
                      📍 {profile.city_tier || '未知地区'}
                    </Typography>
                    <Typography variant="body2" component="span">
                      📅 {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
                    </Typography>
                    <Chip
                      label={caseItem.original_case?.disease?.name || '未分类'}
                      size="small"
                      sx={{
                        backgroundColor: alpha(theme.palette.success.main, 0.1),
                        color: theme.palette.success.main,
                        fontWeight: 500,
                      }}
                    />
                  </Box>
                  
                  {chronicDiseases.length > 0 && (
                    <Box sx={{ mb: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {chronicDiseases.map((disease: ChronicDisease) => (
                        <ChronicDiseaseTag key={disease.id} disease={disease} />
                      ))}
                    </Box>
                  )}
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                      📝 病例摘要
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.7,
                      }}
                    >
                      {(caseItem.anonymized_symptoms?.substring(0, 150)) || '暂无症状描述'}
                      {(caseItem.anonymized_symptoms && caseItem.anonymized_symptoms.length > 150) ? '...' : ''}
                    </Typography>
                  </Box>
                  
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 2,
                      borderTop: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Box display="flex" gap={2} fontSize="0.875rem" color="text.secondary">
                      <Typography variant="body2" component="span">
                        👁️ {caseItem.view_count || 0} 次查看
                      </Typography>
                      <Typography variant="body2" component="span">
                        💬 {(caseItem as any).comments_count || 0} 条评论
                      </Typography>
                    </Box>
                    
                    <Button
                      variant="contained"
                      endIcon={<VisibilityIcon />}
                      sx={{
                        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                        },
                      }}
                    >
                      查看详情
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            background: 'white',
            borderRadius: 3,
            boxShadow: theme.shadows[2],
          }}
        >
          <Avatar sx={{ mx: 'auto', mb: 2, width: 64, height: 64, bgcolor: 'grey.200' }}>
            <NotificationsIcon sx={{ fontSize: 32 }} color="action" />
          </Avatar>
          <Typography variant="h5" gutterBottom>
            暂无@我的病例
          </Typography>
          <Typography variant="body1" color="text.secondary">
            当患者在分享病例时@提及您，相关病例会显示在这里
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default Mentions;
