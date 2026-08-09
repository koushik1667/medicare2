import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Alert,
  Grid,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { doctorsApi } from '../../services/api';
import type { Doctor } from '../../types';

const Profile: React.FC = () => {
  const theme = useTheme();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    full_name: '',
    display_name: '',
    hospital_display: '',
    professional_type_display: '',
    title: '',
    department: '',
    specialty: '',
    hospital: '',
  });

  const [alert, setAlert] = useState<{
    show: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ show: false, message: '', severity: 'success' });

  const {
    data: doctor,
    isLoading,
    error,
  } = useQuery<Doctor>({
    queryKey: ['doctor', 'profile'],
    queryFn: doctorsApi.getProfile,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: Partial<Doctor>) => {
      const response = await doctorsApi.updateProfile(data);
      return response.data;
    },
    onSuccess: () => {
      showAlert('个人信息保存成功', 'success');
      queryClient.invalidateQueries({ queryKey: ['doctor', 'profile'] });
    },
    onError: (error: Error) => {
      showAlert(`保存失败: ${error.message}`, 'error');
    },
  });

  useEffect(() => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || '',
        display_name: doctor.display_name || '',
        hospital_display: doctor.hospital || '',
        professional_type_display: doctor.professional_type || '',
        title: doctor.title || '',
        department: doctor.department || '',
        specialty: doctor.specialty || '',
        hospital: doctor.hospital || '',
      });
    }
  }, [doctor]);

  const showAlert = (message: string, severity: 'success' | 'error') => {
    setAlert({ show: true, message, severity });
    setTimeout(() => {
      setAlert(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    const {
      full_name,
      display_name,
      hospital_display,
      professional_type_display,
      title,
      department,
      specialty,
      hospital,
    } = formData;

    if (!full_name) {
      showAlert('请填写姓名', 'error');
      return;
    }
    if (!title) {
      showAlert('请选择职称', 'error');
      return;
    }
    if (!department) {
      showAlert('请填写所属科室', 'error');
      return;
    }
    if (!specialty) {
      showAlert('请填写专业领域', 'error');
      return;
    }
    if (!hospital) {
      showAlert('请填写执业医院', 'error');
      return;
    }

    updateProfileMutation.mutate({
      full_name,
      title,
      department,
      specialty,
      hospital,
      display_name,
    });
  };

  const handleReset = () => {
    if (doctor) {
      setFormData({
        full_name: doctor.full_name || '',
        display_name: doctor.display_name || '',
        hospital_display: doctor.hospital || '',
        professional_type_display: doctor.professional_type || '',
        title: doctor.title || '',
        department: doctor.department || '',
        specialty: doctor.specialty || '',
        hospital: doctor.hospital || '',
      });
    }
  };

  if (error) {
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
            ⚙️ 个人设置
          </Typography>
          <Typography variant="body1" color="text.secondary">
            管理您的个人信息和专业资质
          </Typography>
        </CardContent>
      </Card>

      {alert.show && (
        <Alert
          severity={alert.severity}
          sx={{ mb: 3 }}
        >
          {alert.message}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            账户信息
          </Typography>
          
          <Box
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              borderLeft: '4px solid',
              borderColor: 'success.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              以下信息用于登录和系统识别，邮箱地址不可修改。
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="姓名"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                required
                disabled={isLoading || updateProfileMutation.isPending}
              />
            </Grid>
            

            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="昵称"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                helperText="自定义昵称，用于平台显示"
                disabled={isLoading || updateProfileMutation.isPending}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            职业信息
          </Typography>
          
          <Box
            sx={{
              p: 2,
              mb: 3,
              backgroundColor: alpha(theme.palette.success.main, 0.05),
              borderLeft: '4px solid',
              borderColor: 'success.main',
              borderRadius: 1,
            }}
          >
            <Typography variant="body2">
              以下是您在注册时填写的执业信息，用于平台展示。如需修改，请联系管理员。
            </Typography>
          </Box>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="工作单位"
                value={formData.hospital_display}
                disabled
                helperText="注册信息，不可修改"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="专业类型"
                value={formData.professional_type_display}
                disabled
                helperText="注册信息，不可修改（如：内科、外科、儿科等）"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>职称</InputLabel>
                <Select
                  value={formData.title}
                  label="职称"
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  disabled={isLoading || updateProfileMutation.isPending}
                >
                  <MenuItem value="">请选择职称</MenuItem>
                  <MenuItem value="住院医师">住院医师</MenuItem>
                  <MenuItem value="主治医师">主治医师</MenuItem>
                  <MenuItem value="副主任医师">副主任医师</MenuItem>
                  <MenuItem value="主任医师">主任医师</MenuItem>
                  <MenuItem value="教授">教授</MenuItem>
                  <MenuItem value="副教授">副教授</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="所属科室"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                placeholder="例如：呼吸内科、心内科"
                required
                disabled={isLoading || updateProfileMutation.isPending}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="专业领域"
                value={formData.specialty}
                onChange={(e) => handleInputChange('specialty', e.target.value)}
                placeholder="例如：呼吸系统疾病、心血管疾病"
                required
                disabled={isLoading || updateProfileMutation.isPending}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="执业医院"
                value={formData.hospital}
                onChange={(e) => handleInputChange('hospital', e.target.value)}
                placeholder="请输入医院全称"
                required
                disabled={isLoading || updateProfileMutation.isPending}
              />
            </Grid>
            

          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box display="flex" gap={2} mt={1}>
            <Button
              variant="contained"
              color="success"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isLoading || updateProfileMutation.isPending}
              fullWidth
              sx={{
                background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(17, 153, 142, 0.3)',
                },
              }}
            >
              {updateProfileMutation.isPending ? '保存中...' : '保存设置'}
            </Button>
            
            <Button
              variant="outlined"
              color="success"
              startIcon={<RefreshIcon />}
              onClick={handleReset}
              disabled={isLoading || updateProfileMutation.isPending}
              fullWidth
            >
              重置
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Profile;
