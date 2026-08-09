import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';
import { authApi, patientsApi } from '../../services/api';
import { AddressSelect } from '../../components/common/AddressSelect';

const steps = ['Verify Email', 'Complete Profile', 'Done'];

const CompleteProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, setUser } = useAuthContext();
  const [activeStep, setActiveStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // 表单数据
  const [address, setAddress] = useState({
    province: '',
    city: '',
    district: '',
    detail: '',
    fullAddress: '',
  });
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // 如果用户已经访问过完善信息页面（无论是否实际填写），不再强制跳转
    const hasSeenProfileCompletion = localStorage.getItem('has_seen_profile_completion');
    
    // 如果用户已经完成引导流程，直接跳转到首页
    if (hasSeenProfileCompletion) {
      navigate('/patient');
      return;
    }
    
    // 如果用户已经验证过邮箱且信息完整，直接跳转到首页
    if (user?.is_verified && user?.address && user?.phone) {
      navigate('/patient');
      return;
    }
    
    // 设置当前步骤
    if (!user?.is_verified) {
      setActiveStep(0);
    } else if (!user?.address || !user?.phone) {
      setActiveStep(1);
    } else {
      setActiveStep(2);
    }
  }, [user, navigate]);

  // 步骤1：发送验证邮件
  const handleSendVerificationEmail = async () => {
    setIsLoading(true);
    setError('');
    try {
      await authApi.sendVerificationEmail();
      setSuccess('Verification email sent, please check your inbox');
    } catch (err: any) {
      setError(err.message || 'Send failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 步骤2：保存个人信息
  const handleSaveProfile = async () => {
    if (!address.fullAddress) {
      setError('Please fill in your complete address');
      return;
    }
    if (!phone) {
      setError('Please fill in your phone number');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      await patientsApi.updateMe({
        address: address.fullAddress,
        phone,
      });
      
      // 更新本地用户数据
      if (user) {
        setUser({
          ...user,
          address: address.fullAddress,
          phone,
        });
      }
      
      setActiveStep(2);
      setSuccess('Information saved successfully');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setIsLoading(false);
    }
  };

  // 完成引导
  const handleComplete = () => {
    // 标记用户已完成引导流程
    localStorage.setItem('has_seen_profile_completion', 'true');
    navigate('/patient');
  };


  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Paper elevation={20} sx={{ p: 4, borderRadius: 4 }}>
          <Typography variant="h4" align="center" gutterBottom fontWeight="bold">
            Complete Your Profile
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Please complete the following steps to use all system features
          </Typography>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {/* 步骤1：验证邮箱 */}
          {activeStep === 0 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" gutterBottom>
                Verify Your Email Address
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                To ensure account security, we need to verify your email: {user?.email}
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleSendVerificationEmail}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Send Verification Email'}
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                After sending, please check your inbox and click the verification link
              </Typography>
            </Box>
          )}

          {/* 步骤2：完善个人信息 */}
          {activeStep === 1 && (
            <Box sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom>
                Complete Personal Profile
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Residential Address
                </Typography>
                <AddressSelect
                  value={address}
                  onChange={setAddress}
                  disabled={isLoading}
                  required
                />
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Phone Number
                </Typography>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Please enter your phone number"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                  }}
                  disabled={isLoading}
                />
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleSaveProfile}
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Save & Continue'}
              </Button>
            </Box>
          )}

          {/* 步骤3：完成 */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h5" color="success.main" gutterBottom>
                🎉 Congratulations, setup complete!
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Your profile is complete. You can now start using all MediCareAI features.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={handleComplete}
                sx={{
                  py: 1.5,
                  px: 4,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                Enter System
              </Button>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default CompleteProfilePage;
