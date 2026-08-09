import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../services/api';
import { LocalHospital, CheckCircle, Error } from '@mui/icons-material';

const VerifyEmailPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('正在验证您的邮箱地址...');
  const hasRequested = useRef(false);

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('验证链接无效，缺少验证令牌');
        return;
      }

      if (hasRequested.current) return;
      hasRequested.current = true;

      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        setMessage('邮箱验证成功！您现在可以登录系统了。');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || '验证失败，链接可能已过期或无效');
      }
    };

    verifyEmail();
  }, [token]);

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={20}
          sx={{
            borderRadius: 4,
            padding: 4,
            textAlign: 'center',
          }}
        >
          <Box sx={{ mb: 4 }}>
            <LocalHospital sx={{ fontSize: 64, color: '#667eea', mb: 2 }} />
            <Typography variant="h4" component="h1" fontWeight="bold" color="primary">
              MediCareAI
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              智能疾病管理系统
            </Typography>
          </Box>

          {status === 'verifying' && (
            <Box sx={{ py: 4 }}>
              <CircularProgress size={48} sx={{ mb: 3 }} />
              <Typography variant="h6" gutterBottom>
                正在验证
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {message}
              </Typography>
            </Box>
          )}

          {status === 'success' && (
            <Box sx={{ py: 4 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Alert severity="success" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handleGoToLogin}
                sx={{
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                }}
              >
                前往登录
              </Button>
            </Box>
          )}

          {status === 'error' && (
            <Box sx={{ py: 4 }}>
              <Error sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                {message}
              </Alert>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  onClick={handleGoToHome}
                >
                  返回首页
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  onClick={handleGoToLogin}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  }}
                >
                  前往登录
                </Button>
              </Box>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default VerifyEmailPage;
