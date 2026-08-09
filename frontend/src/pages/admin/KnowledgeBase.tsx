import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Alert,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Description as DocumentIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { adminApi } from '../../services/api';

interface KnowledgeDocument {
  doc_id: string;
  filename: string;
  file_size: number;
  uploaded_at: string;
  status: 'completed' | 'processing' | 'failed';
  chunk_count: number;
  preview?: string;
}

const KnowledgeBase: React.FC = () => {
  useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAreaRef = useRef<HTMLDivElement>(null);
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });
  const [dragOver, setDragOver] = useState(false);

  // 获取知识库文档列表
  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getKnowledgeDocuments();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      setSnackbar({
        open: true,
        message: '加载文档列表失败',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载和定时刷新
  useEffect(() => {
    fetchDocuments();
    const interval = setInterval(fetchDocuments, 30000); // 每30秒刷新一次
    return () => clearInterval(interval);
  }, [fetchDocuments]);

  // 处理文件选择
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.md')) {
        setSnackbar({
          open: true,
          message: '请选择 .md 格式的 Markdown 文件',
          severity: 'error',
        });
        return;
      }
      uploadFile(file);
    }
  };

  // 上传文件
  const uploadFile = async (file: File) => {
    setUploading(true);
    setUploadProgress(0);
    
    try {
      await adminApi.uploadKnowledgeDocument(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setSnackbar({
        open: true,
        message: '文档上传成功！系统正在后台进行向量化处理...',
        severity: 'success',
      });
      fetchDocuments();
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 2000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: '上传失败: ' + (error as Error).message,
        severity: 'error',
      });
      setUploading(false);
    }
  };

  // 删除文档
  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm('确定要删除该文档吗？这将同时删除其向量数据。')) {
      return;
    }
    
    try {
      await adminApi.deleteKnowledgeDocument(docId);
      setSnackbar({
        open: true,
        message: '文档已删除',
        severity: 'success',
      });
      fetchDocuments();
    } catch (error) {
      setSnackbar({
        open: true,
        message: '删除失败: ' + (error as Error).message,
        severity: 'error',
      });
    }
  };

  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (!file.name.endsWith('.md')) {
        setSnackbar({
          open: true,
          message: '请选择 .md 格式的 Markdown 文件',
          severity: 'error',
        });
        return;
      }
      uploadFile(file);
    }
  };

  // 获取状态标签
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: '已完成', icon: <CheckIcon />, color: 'success' as const };
      case 'processing':
        return { label: '处理中', icon: <PendingIcon />, color: 'warning' as const };
      case 'failed':
        return { label: '失败', icon: <ErrorIcon />, color: 'error' as const };
      default:
        return { label: '未知', icon: <PendingIcon />, color: 'default' as const };
    }
  };

  // 渲染文档列表
  const renderDocumentTable = () => {
    if (documents.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <DocumentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="body1" color="text.secondary">
            暂无文档，请上传诊疗指南
          </Typography>
        </Box>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>文档信息</TableCell>
              <TableCell>大小</TableCell>
              <TableCell>状态</TableCell>
              <TableCell>向量块</TableCell>
              <TableCell>上传时间</TableCell>
              <TableCell>操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {documents.map((doc) => {
              const statusInfo = getStatusLabel(doc.status);
              return (
                <TableRow key={doc.doc_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                        <DocumentIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {doc.filename || '未命名文档'}
                        </Typography>
                        {doc.preview && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{
                              maxWidth: 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.preview}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {doc.file_size ? `${(doc.file_size / 1024).toFixed(1)} KB` : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={statusInfo.icon}
                      label={statusInfo.label}
                      color={statusInfo.color}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {doc.chunk_count || 0} 个向量块
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {doc.uploaded_at 
                        ? new Date(doc.uploaded_at).toLocaleDateString('zh-CN')
                        : '-'
                      }
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => handleDeleteDocument(doc.doc_id)}
                      title="删除文档"
                    >
                      <DeleteIcon />
                    </IconButton>
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
              知识库管理
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              上传诊疗指南文档，系统自动进行向量化，为AI诊断提供知识支持
            </Typography>
          </Box>
          <IconButton 
            onClick={fetchDocuments} 
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

      {/* 上传区域 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            上传文档
          </Typography>
          <Box
            ref={uploadAreaRef}
            sx={{
              border: `2px dashed ${dragOver ? '#fc4a1a' : '#ddd'}`,
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              bgcolor: dragOver ? 'rgba(252, 74, 26, 0.05)' : 'transparent',
              '&:hover': {
                borderColor: '#fc4a1a',
                bgcolor: 'rgba(252, 74, 26, 0.05)',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <CloudUploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1" fontWeight="medium" gutterBottom>
              点击或拖拽上传 .md 文件
            </Typography>
            <Typography variant="body2" color="text.secondary">
              支持 Markdown 格式的诊疗指南文档，最大 50MB
            </Typography>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md"
              style={{ display: 'none' }}
              onChange={handleFileSelect}
            />
          </Box>
          
          {/* 上传进度 */}
          {uploading && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  上传中...
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {uploadProgress}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={uploadProgress}
                sx={{ height: 6, borderRadius: 3 }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* 文档列表 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            知识库文档
          </Typography>
          {renderDocumentTable()}
        </CardContent>
      </Card>

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

export default KnowledgeBase;
