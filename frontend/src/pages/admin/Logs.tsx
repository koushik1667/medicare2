import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  LinearProgress,
  Alert,
  Snackbar,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Description as LogIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { AdminOperationLog } from '../../types';
import { adminApi } from '../../services/api';

const Logs: React.FC = () => {
  const { user } = useAuthStore();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AdminOperationLog[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize] = useState(20);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });
  const [selectedLog, setSelectedLog] = useState<AdminOperationLog | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // 获取日志列表
  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      
      if (typeFilter) params.type = typeFilter;
      if (dateFilter) params.date = dateFilter;
      params.page = page;
      params.page_size = pageSize;
      
      const data = await adminApi.getOperationLogs(params);
      console.log('Logs data received:', data);
      const responseData = data as any;
      const logsArray = responseData.items || responseData.logs || responseData.data?.items || [];
      const totalCount = responseData.total || responseData.total_count || responseData.data?.total || 0;
      const totalPagesCount = responseData.total_pages || responseData.pages || responseData.data?.total_pages || 1;
      
      setLogs(logsArray);
      setTotalPages(totalPagesCount);
      setTotal(totalCount);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setSnackbar({
        open: true,
        message: '加载日志列表失败',
        severity: 'error',
      });
      setLogs([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, dateFilter, page, pageSize]);

  // 初始化加载
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 处理筛选
  const handleFilter = () => {
    setPage(1); // 重置到第一页
    fetchLogs();
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleViewDetails = (log: AdminOperationLog) => {
    setSelectedLog(log);
    setDetailDialogOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailDialogOpen(false);
    setSelectedLog(null);
  };

  // 获取日志级别标签
  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'info':
        return { label: '信息', color: 'info' as const, icon: <InfoIcon /> };
      case 'warning':
        return { label: '警告', color: 'warning' as const, icon: <WarningIcon /> };
      case 'error':
        return { label: '错误', color: 'error' as const, icon: <ErrorIcon /> };
      default:
        return { label: '未知', color: 'default' as const, icon: <InfoIcon /> };
    }
  };

  // 格式化操作详情
  const formatOperationDetails = (details: any) => {
    if (typeof details === 'string') {
      return details;
    }
    
    try {
      return JSON.stringify(details, null, 2);
    } catch (error) {
      return String(details);
    }
  };

  const renderLogTable = () => {
    if (logs.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <LogIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            暂无日志
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>时间</TableCell>
              <TableCell>级别</TableCell>
              <TableCell>操作</TableCell>
              <TableCell>用户</TableCell>
              <TableCell>IP地址</TableCell>
              <TableCell>详情</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.map((log) => {
              const levelInfo = getLevelLabel(log.level || 'info');
              return (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Typography variant="body2">
                      {log.created_at || log.timestamp 
                        ? new Date(log.created_at || log.timestamp).toLocaleString('zh-CN')
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={levelInfo.icon}
                      label={levelInfo.label}
                      color={levelInfo.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.operation || log.operation_type || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.admin?.full_name || log.user_email || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {log.ip_address || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography 
                      variant="body2" 
                      sx={{
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatOperationDetails(log.details || log.operation_details)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleViewDetails(log)}
                    >
                      查看详情
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '100%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          mb: 3,
          p: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 2,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              系统日志
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              查看系统操作日志和监控信息
            </Typography>
            {total > 0 && (
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                共 {total} 条日志记录
              </Typography>
            )}
          </Box>
          <IconButton 
            onClick={fetchLogs} 
            title="刷新"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      {/* 筛选器 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            操作日志
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <FormControl variant="outlined" sx={{ minWidth: 120 }}>
              <InputLabel id="type-filter-label">操作类型</InputLabel>
              <Select
                labelId="type-filter-label"
                id="type-filter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                label="操作类型"
              >
                <MenuItem value="">全部类型</MenuItem>
                <MenuItem value="auth">认证</MenuItem>
                <MenuItem value="user">用户</MenuItem>
                <MenuItem value="doctor">医生</MenuItem>
                <MenuItem value="system">系统</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              id="date-filter"
              label="选择日期"
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
            
            <Button
              variant="contained"
              onClick={handleFilter}
              sx={{ height: 'fit-content' }}
            >
              筛选
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* 日志表格 */}
      {renderLogTable()}

      {/* 分页 */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
          />
        </Box>
      )}

      <Dialog
        open={detailDialogOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">日志详情</Typography>
            <IconButton onClick={handleCloseDetails}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {selectedLog && (
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  日志ID
                </Typography>
                <Typography variant="body1">
                  {selectedLog.id}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  时间
                </Typography>
                <Typography variant="body1">
                  {selectedLog.created_at || selectedLog.timestamp 
                    ? new Date(selectedLog.created_at || selectedLog.timestamp).toLocaleString('zh-CN')
                    : '-'
                  }
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  级别
                </Typography>
                <Chip
                  icon={getLevelLabel(selectedLog.level || 'info').icon}
                  label={getLevelLabel(selectedLog.level || 'info').label}
                  color={getLevelLabel(selectedLog.level || 'info').color}
                  size="small"
                  sx={{ mt: 0.5 }}
                />
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  操作类型
                </Typography>
                <Typography variant="body1">
                  {selectedLog.operation || selectedLog.operation_type || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  操作用户
                </Typography>
                <Typography variant="body1">
                  {selectedLog.admin?.full_name || selectedLog.user_email || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  IP地址
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                  {selectedLog.ip_address || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  用户代理
                </Typography>
                <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedLog.user_agent || '-'}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  操作详情
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontFamily: 'monospace', fontSize: '0.875rem' }}>
                    {formatOperationDetails(selectedLog.details || selectedLog.operation_details)}
                  </pre>
                </Paper>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>关闭</Button>
        </DialogActions>
      </Dialog>

      {/* 消息提示 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Logs;
