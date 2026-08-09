import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Checkbox,
  ListItemText,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  Divider,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Place as PlaceIcon,
  DateRange as DateRangeIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';

import { doctorsApi } from '../../services/api';
import type { SharedMedicalCase } from '../../types';

const Export: React.FC = () => {
  const theme = useTheme();

  const [exportFormat, setExportFormat] = useState<string>('json');
  const [includeDocuments, setIncludeDocuments] = useState<boolean>(true);
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);

  const {
    data: cases,
    isLoading: casesLoading,
    error: casesError,
  } = useQuery<SharedMedicalCase[]>({
    queryKey: ['doctor', 'exportable-cases'],
    queryFn: async () => {
      return doctorsApi.getCases('all', 100);
    },
  });

  const exportMutation = useMutation({
    mutationFn: async (data: {
      case_ids: string[];
      format: 'json' | 'csv';
      include_documents: boolean;
    }) => {
      const response = await doctorsApi.exportCases({
        case_ids: data.case_ids,
        format: data.format,
        include_documents: data.include_documents,
      });
      
      return response.data as Blob;
    },
    onSuccess: (blob, variables) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `research_data_${new Date().toISOString().slice(0, 10)}.${variables.format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      alert(`成功导出 ${variables.case_ids.length} 个病例`);
    },
    onError: (error: Error) => {
      alert(`导出失败: ${error.message}`);
    },
  });

  useEffect(() => {
    if (cases && cases.length > 0) {
      if (selectAll) {
        setSelectedCases(cases.map(c => c.id));
      } else {
        setSelectedCases([]);
      }
    }
  }, [selectAll, cases]);

  const handleToggleSelectAll = () => {
    setSelectAll(!selectAll);
  };

  const handleToggleCase = (caseId: string) => {
    setSelectedCases(prev => {
      if (prev.includes(caseId)) {
        return prev.filter(id => id !== caseId);
      } else {
        return [...prev, caseId];
      }
    });
  };

  const handleExport = () => {
    if (selectedCases.length === 0) {
      alert('请至少选择一个病例');
      return;
    }

    exportMutation.mutate({
      case_ids: selectedCases,
      format: exportFormat,
      include_documents: includeDocuments,
    });
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
            📊 科研数据导出
          </Typography>
          <Typography variant="body1" color="text.secondary">
            选择病例并导出为JSON或CSV格式，用于科研分析。所有导出数据均已匿名化处理。
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Alert severity="info" sx={{ mb: 3 }}>
            💡 提示：显示公开病例和@提及您的病例，所有导出内容均已脱敏处理。
          </Alert>
          
          <Box display="flex" gap={4} sx={{ mb: 3 }}>
            <FormControl>
              <InputLabel>导出格式</InputLabel>
              <Select
                value={exportFormat}
                label="导出格式"
                onChange={(e) => setExportFormat(e.target.value)}
                disabled={exportMutation.isPending}
              >
                <MenuItem value="json">JSON格式（完整数据）</MenuItem>
                <MenuItem value="csv">CSV格式（表格数据）</MenuItem>
              </Select>
            </FormControl>
            
            <Box>
              <Button
                onClick={() => setIncludeDocuments(!includeDocuments)}
                startIcon={<Checkbox checked={includeDocuments} />}
                disabled={exportMutation.isPending}
                sx={{ justifyContent: 'flex-start' }}
              >
                包含检查资料内容
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h5" fontWeight="bold">
              📋 可选病例列表
            </Typography>
            <Button
              variant="outlined"
              color="success"
              onClick={handleToggleSelectAll}
              disabled={casesLoading || exportMutation.isPending}
            >
              {selectAll ? '取消全选' : '全选'}
            </Button>
          </Box>
          
          <Box
            sx={{
              maxHeight: 500,
              overflow: 'auto',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {casesLoading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : cases && cases.length > 0 ? (
              <List>
                {cases.map((caseItem) => {
                  const profile = caseItem.anonymous_patient_profile || {};
                  return (
                    <React.Fragment key={caseItem.id}>
                      <ListItem
                        sx={{
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.success.main, 0.04),
                          },
                        }}
                      >
                        <ListItemIcon>
                          <Checkbox
                            checked={selectedCases.includes(caseItem.id)}
                            onChange={() => handleToggleCase(caseItem.id)}
                            disabled={exportMutation.isPending}
                          />
                        </ListItemIcon>
                        
                        <ListItemText
                          disableTypography
                          primary={
                            <Box display="flex" alignItems="center" gap={1}>
                              <Typography variant="subtitle2" fontWeight="bold" component="span">
                                病例 #{caseItem.id.toString().slice(0, 8)}
                              </Typography>
                              <Chip
                                label={caseItem.original_case?.disease?.name || '未分类'}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                                  color: theme.palette.success.main,
                                  fontSize: '0.75rem',
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box display="flex" alignItems="center" gap={2} mt={1}>
                              <Typography variant="body2" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PersonIcon fontSize="small" />
                                {profile.age_range || '未知年龄'} · {profile.gender || '未知性别'}
                              </Typography>
                              
                              <Typography variant="body2" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <PlaceIcon fontSize="small" />
                                {profile.city_tier || '未知地区'}
                              </Typography>
                              
                              <Typography variant="body2" component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <DateRangeIcon fontSize="small" />
                                {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  );
                })}
              </List>
            ) : (
              <Box textAlign="center" py={6}>
                <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  暂无可导出的病例
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  只有标记为"科研可用"的病例才会显示在这里
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Box display="flex" justifyContent="center">
        <Button
          variant="contained"
          size="large"
          startIcon={exportMutation.isPending ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          onClick={handleExport}
          disabled={selectedCases.length === 0 || exportMutation.isPending}
          sx={{
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(17, 153, 142, 0.3)',
            },
          }}
        >
          {exportMutation.isPending ? '导出中...' : `导出选中病例 (${selectedCases.length})`}
        </Button>
      </Box>
    </Box>
  );
};

export default Export;