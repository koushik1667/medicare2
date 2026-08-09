import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * React Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the app
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleRetry = () => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Reload the page as a last resort
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}>
            <Box sx={{ mb: 3 }}>
              <ErrorOutline sx={{ fontSize: 64, color: 'error.main' }} />
            </Box>
            
            <Typography variant="h4" component="h1" gutterBottom color="error">
              页面出错了
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              抱歉，页面加载时遇到了问题。请尝试刷新页面或返回首页。
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                  overflow: 'auto',
                  maxHeight: 200,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  错误详情 (仅开发环境显示):
                </Typography>
                <Typography component="pre" variant="caption" sx={{ whiteSpace: 'pre-wrap' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={this.handleRetry}
              >
                重试
              </Button>
              <Button
                variant="contained"
                onClick={this.handleReload}
              >
                刷新页面
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    // If there's no error, render children normally
    return this.props.children;
  }
}

export default ErrorBoundary;
