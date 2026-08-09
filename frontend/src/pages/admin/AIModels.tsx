import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  IconButton,
  Chip,
  Paper,
  Alert,
  Snackbar,
  LinearProgress,
  Avatar,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Pending as PendingIcon,
  SmartToy as AiIcon,
  Description as DocIcon,
  Storage as StorageIcon,
  Cloud as CloudIcon,
  PlayArrow as TestIcon,
  AccessTime as AccessTimeIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { useAuthStore } from '../../store/authStore';
import { AIProvider } from '../../types';
import { adminApi } from '../../services/api';

interface AIModel {
  model_type: string;
  model_id?: string;
  api_url?: string;
  provider?: string;
  enabled: boolean;
  test_status?: 'success' | 'failed' | 'pending';
  latency_ms?: number;
  error_message?: string;
  last_tested?: string;
  access_key_id?: string;
}

const AIModels: React.FC = () => {
  const { user } = useAuthStore();
  
  // 状态管理
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState<Record<string, AIModel>>({});
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [editingModelType, setEditingModelType] = useState<string>('');
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'warning' | 'info',
  });
  const [embeddingProviders, setEmbeddingProviders] = useState<AIProvider[]>([]);
  const [rerankProviders, setRerankProviders] = useState<AIProvider[]>([]);
  const [urlValidation, setUrlValidation] = useState<string>('');
  
  // 表单数据
  const [formData, setFormData] = useState({
    model_type: '',
    provider: '',
    api_url: '',
    api_key: '',
    model_id: '',
    enabled: true,
    oss_bucket: '',
    oss_endpoint: '',
    oss_access_key_id: '',
    oss_access_key_secret: '',
    embedding_provider: '',
    rerank_provider: '',
  });

  // AI 提供商配置
  const aiProviders: Record<string, AIProvider> = {
    'zhipu': {
      key: 'zhipu',
      name: '智谱AI',
      name_zh: '智谱AI (GLM-4)',
      default_url: 'https://open.bigmodel.cn/api/paas/v4',
      default_model: 'glm-4-flash',
      requires_key: true,
    },
    'kimi': {
      key: 'kimi',
      name: 'Moonshot',
      name_zh: 'Moonshot (Kimi)',
      default_url: 'https://api.moonshot.cn/v1',
      default_model: 'kimi-latest',
      requires_key: true,
    },
    'deepseek': {
      key: 'deepseek',
      name: 'DeepSeek',
      name_zh: 'DeepSeek',
      default_url: 'https://api.deepseek.com/v1',
      default_model: 'deepseek-chat',
      requires_key: true,
    },
    'openai': {
      key: 'openai',
      name: 'OpenAI',
      name_zh: 'OpenAI',
      default_url: 'https://api.openai.com/v1',
      default_model: 'gpt-4',
      requires_key: true,
    },
    'ollama': {
      key: 'ollama',
      name: 'Ollama',
      name_zh: 'Ollama (本地)',
      default_url: 'http://localhost:11434',
      default_model: 'llama2',
      requires_key: false,
    },
    'vllm': {
      key: 'vllm',
      name: 'vLLM',
      name_zh: 'vLLM (本地)',
      default_url: 'http://localhost:8000',
      default_model: 'custom',
      requires_key: false,
    },
    'lmstudio': {
      key: 'lmstudio',
      name: 'LM Studio',
      name_zh: 'LM Studio (本地)',
      default_url: 'http://localhost:1234',
      default_model: 'local-model',
      requires_key: false,
    },
    'custom': {
      key: 'custom',
      name: 'Custom',
      name_zh: '自定义 (OpenAI兼容)',
      default_url: '',
      default_model: '',
      requires_key: true,
    },
  };

  // 模型类型配置
  const modelTypes = [
    { key: 'diagnosis', name: '诊断AI模型', icon: <AiIcon /> },
    { key: 'mineru', name: '文档提取 (MinerU)', icon: <DocIcon /> },
    { key: 'embedding', name: '向量嵌入模型', icon: <StorageIcon /> },
    { key: 'oss', name: '阿里云OSS存储', icon: <CloudIcon /> },
    { key: 'rerank', name: '重排序模型 (Rerank)', icon: <SortIcon /> },
  ];

  const loadEmbeddingProviders = useCallback(async () => {
    try {
      const providers = await adminApi.getEmbeddingProviders();
      setEmbeddingProviders(providers);
    } catch (error) {
      console.error('Failed to load embedding providers:', error);
    }
  }, []);

  const loadRerankProviders = useCallback(async () => {
    try {
      const providers = await adminApi.getRerankProviders();
      setRerankProviders(providers);
    } catch (error) {
      console.error('Failed to load rerank providers:', error);
    }
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAIModels();
      setModels({
        diagnosis: data.diagnosis_llm || {},
        mineru: data.mineru || {},
        embedding: data.embedding || {},
        oss: data.oss || {},
        rerank: data.rerank || {},
      });
    } catch (error) {
      console.error('Failed to fetch models:', error);
      setSnackbar({
        open: true,
        message: '加载模型列表失败',
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始化加载
  useEffect(() => {
    fetchModels();
    loadEmbeddingProviders();
    loadRerankProviders();
  }, [fetchModels, loadEmbeddingProviders, loadRerankProviders]);

  const handleOpenConfigDialog = (modelType: string = '') => {
    setEditingModelType(modelType);
    setFormData({
      model_type: modelType,
      provider: '',
      api_url: '',
      api_key: '',
      model_id: '',
      enabled: true,
      oss_bucket: '',
      oss_endpoint: '',
      oss_access_key_id: '',
      oss_access_key_secret: '',
      embedding_provider: '',
      rerank_provider: '',
    });
    
    if (modelType && models[modelType]) {
      const model = models[modelType];
      setFormData({
        model_type: modelType,
        provider: model.provider || '',
        api_url: model.api_url || '',
        api_key: '', // 不回填密码
        model_id: model.model_id || '',
        enabled: model.enabled !== false,
        oss_bucket: model.model_id || '',
        oss_endpoint: model.api_url || '',
        oss_access_key_id: model.access_key_id || '',
        oss_access_key_secret: '', // 不回填密码
        embedding_provider: model.provider || '',
        rerank_provider: model.provider || '',
      });
    }
    
    setConfigDialogOpen(true);
  };

  const handleProviderChange = (providerKey: string) => {
    const provider = aiProviders[providerKey];
    if (provider) {
      setFormData({
        ...formData,
        provider: providerKey,
        api_url: provider.default_url,
        model_id: provider.default_model,
      });
      
      setSnackbar({
        open: true,
        message: `已选择 ${provider.name_zh}，默认配置已自动填充`,
        severity: 'success',
      });
    }
  };

  const handleEmbeddingProviderChange = async (providerKey: string) => {
    const provider = embeddingProviders.find(p => p.key === providerKey);
    if (provider) {
      setFormData({
        ...formData,
        embedding_provider: providerKey,
        api_url: provider.default_url,
        model_id: provider.default_model,
      });
      
      setSnackbar({
        open: true,
        message: `已自动填充 ${provider.name_zh} 的默认配置`,
        severity: 'success',
      });
    }
  };

  const handleRerankProviderChange = async (providerKey: string) => {
    const provider = rerankProviders.find(p => p.key === providerKey);
    if (provider) {
      setFormData({
        ...formData,
        rerank_provider: providerKey,
        api_url: provider.default_url,
        model_id: provider.default_model,
      });
      
      setSnackbar({
        open: true,
        message: `已自动填充 ${provider.name_zh} 的默认配置`,
        severity: 'success',
      });
    }
  };

  const validateApiUrl = async () => {
    if (formData.model_type !== 'embedding') return;
    
    const url = formData.api_url.trim();
    if (!url) return;
    
    setUrlValidation('验证中...');
    
    try {
      const result = await adminApi.validateEmbeddingUrl(url);
      
      if (result.warnings.length > 0) {
        setUrlValidation(`⚠️ ${result.warnings.join(', ')}`);
      } else {
        setUrlValidation('✓ URL 格式正确');
      }
      
      if (result.suggestions.length > 0) {
        setUrlValidation(prev => `${prev}\n💡 ${result.suggestions.join(', ')}`);
      }
      
      if (result.formatted_url !== url) {
        setFormData({ ...formData, api_url: result.formatted_url });
      }
    } catch (error) {
      console.error('URL validation failed:', error);
      setUrlValidation('验证失败');
    }
  };

  // 测试模型连接
  const handleTestModel = async (modelType: string) => {
    try {
      setTesting({ ...testing, [modelType]: true });
      
      const result = await adminApi.testAIModel(modelType);
      setTestResults({ ...testResults, [modelType]: result });
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: `✓ ${modelType} 连接成功 (${result.latency_ms}ms)`,
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: `✗ ${modelType} 连接失败: ${result.error_message}`,
          severity: 'error',
        });
      }
      
      fetchModels();
    } catch (error) {
      setSnackbar({
        open: true,
        message: '测试过程出错',
        severity: 'error',
      });
    } finally {
      setTesting({ ...testing, [modelType]: false });
    }
  };

  // 测试表单中的模型
  const handleTestFormModel = async () => {
    try {
      setTesting({ ...testing, form: true });
      
      let requestBody: any = {};
      
      if (formData.model_type === 'oss') {
        requestBody = {
          api_url: formData.oss_endpoint,
          api_key: formData.oss_access_key_secret,
          model_id: formData.oss_bucket,
          access_key_id: formData.oss_access_key_id,
          endpoint: formData.oss_endpoint,
        };
      } else {
        requestBody = {
          api_url: formData.api_url,
          api_key: formData.api_key,
          model_id: formData.model_id,
        };
        
        if (formData.model_type === 'diagnosis') {
          requestBody.provider = formData.provider;
        }
        
        if (formData.model_type === 'embedding') {
          requestBody.provider = formData.embedding_provider;
        }
        
        if (formData.model_type === 'rerank') {
          requestBody.provider = formData.rerank_provider;
        }
      }
      
      const result = await adminApi.testAIModel(formData.model_type, requestBody);
      
      setTestResults({ ...testResults, form: result });
      
      if (result.success) {
        setSnackbar({
          open: true,
          message: '连接测试成功',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: `连接测试失败: ${result.error_message}`,
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '测试过程出错',
        severity: 'error',
      });
    } finally {
      setTesting({ ...testing, form: false });
    }
  };

  // 保存模型配置
  const handleSaveConfig = async () => {
    try {
      let requestBody: any = {
        enabled: formData.enabled,
      };
      
      if (formData.model_type === 'oss') {
        if (!formData.oss_bucket || !formData.oss_endpoint || !formData.oss_access_key_id || !formData.oss_access_key_secret) {
          setSnackbar({
            open: true,
            message: '请填写所有OSS必填项',
            severity: 'error',
          });
          return;
        }
        
        requestBody = {
          ...requestBody,
          api_url: formData.oss_endpoint, // Map endpoint to api_url
          api_key: formData.oss_access_key_secret, // Map secret to api_key
          model_id: formData.oss_bucket, // Map bucket to model_id
          access_key_id: formData.oss_access_key_id, // Access Key ID for OSS
          endpoint: formData.oss_endpoint, // Additional endpoint field
        };
      } else {
        if (!formData.api_url || !formData.model_id) {
          setSnackbar({
            open: true,
            message: '请填写所有必填项',
            severity: 'error',
          });
          return;
        }
        
        requestBody = {
          ...requestBody,
          api_url: formData.api_url,
          api_key: formData.api_key,
          model_id: formData.model_id,
        };
        
        if (formData.model_type === 'diagnosis' && formData.provider) {
          requestBody.provider = formData.provider;
        }
        
        if (formData.model_type === 'embedding' && formData.embedding_provider) {
          requestBody.provider = formData.embedding_provider;
        }
        
        if (formData.model_type === 'rerank' && formData.rerank_provider) {
          requestBody.provider = formData.rerank_provider;
        }
      }
      
      try {
        const result = await adminApi.saveAIModelConfig(formData.model_type, requestBody);
        setSnackbar({
          open: true,
          message: result.message || '配置保存成功',
          severity: 'success',
        });
        setConfigDialogOpen(false);
        fetchModels();
      } catch (error: any) {
        setSnackbar({
          open: true,
          message: error.detail || '保存失败',
          severity: 'error',
        });
      }
    } catch (error) {
      setSnackbar({
        open: true,
        message: '保存配置时出错',
        severity: 'error',
      });
    }
  };

  // 获取状态标签
  const getStatusLabel = (model: AIModel) => {
    if (!model.enabled) {
      return { label: '未启用', color: 'default' as const, icon: <ErrorIcon /> };
    }
    
    switch (model.test_status) {
      case 'success':
        return { label: '已启用', color: 'success' as const, icon: <CheckIcon /> };
      case 'failed':
        return { label: '连接失败', color: 'error' as const, icon: <ErrorIcon /> };
      default:
        return { label: '待测试', color: 'warning' as const, icon: <PendingIcon /> };
    }
  };

  // 渲染模型列表
  const renderModelList = () => {
    return modelTypes.map((type) => {
      const model = models[type.key];
      if (!model) return null;
      
      const statusInfo = getStatusLabel(model);
      
      return (
        <Card key={type.key} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                  {type.icon}
                </Avatar>
                <Typography variant="h6">
                  {type.name}
                </Typography>
              </Box>
              <Chip
                icon={statusInfo.icon}
                label={statusInfo.label}
                color={statusInfo.color}
                size="small"
                variant="outlined"
              />
            </Box>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  模型ID
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    color: model.model_id && model.model_id !== '未配置' && !model.model_id.includes('your_') && !model.model_id.includes('unsloth/') ? 'text.primary' : 'text.disabled',
                    fontStyle: model.model_id && model.model_id !== '未配置' && !model.model_id.includes('your_') && !model.model_id.includes('unsloth/') ? 'normal' : 'italic'
                  }}
                >
                  {model.model_id && model.model_id !== '未配置' && !model.model_id.includes('your_') && !model.model_id.includes('unsloth/') ? model.model_id : '请点击"配置"按钮设置模型ID'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  API地址
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: 'monospace',
                    color: model.api_url && model.api_url !== '未配置' && !model.api_url.includes('your_') && !model.api_url.includes('localhost:') ? 'text.primary' : 'text.disabled',
                    fontStyle: model.api_url && model.api_url !== '未配置' && !model.api_url.includes('your_') && !model.api_url.includes('localhost:') ? 'normal' : 'italic'
                  }}
                >
                  {model.api_url && model.api_url !== '未配置' && !model.api_url.includes('your_') && !model.api_url.includes('localhost:') ? model.api_url : '请点击"配置"按钮设置API地址'}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  连接状态
                </Typography>
                {model.test_status === 'success' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'success.main' }}>
                    <CheckIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 500 }}>
                      正常 {model.latency_ms ? `(${model.latency_ms}ms)` : '(已配置)'}
                    </Typography>
                  </Box>
                ) : model.test_status === 'failed' ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'error.main' }}>
                    <ErrorIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body1" sx={{ color: 'error.main' }}>
                      连接失败
                      {model.error_message && (
                        <Typography component="span" variant="body2" sx={{ ml: 0.5 }}>
                          : {model.error_message.substring(0, 50)}{model.error_message.length > 50 ? '...' : ''}
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'warning.main' }}>
                    <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5 }} />
                    <Typography variant="body1" sx={{ color: 'warning.main' }}>
                      待测试
                    </Typography>
                  </Box>
                )}
                {model.last_tested && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    最后测试: {new Date(model.last_tested).toLocaleString('zh-CN')}
                  </Typography>
                )}
              </Grid>
            </Grid>
            
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Button
                variant="outlined"
                startIcon={<SettingsIcon />}
                onClick={() => handleOpenConfigDialog(type.key)}
                sx={{ mr: 1 }}
              >
                配置
              </Button>
              <Button
                variant="outlined"
                color="success"
                startIcon={<TestIcon />}
                onClick={() => handleTestModel(type.key)}
                disabled={testing[type.key]}
                sx={{ mr: 1 }}
              >
                {testing[type.key] ? '测试中...' : '测试连通性'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      );
    });
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
              AI模型配置
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 600 }}>
              配置和管理系统中使用的AI模型。支持智谱AI、Moonshot、DeepSeek、OpenAI等多种AI提供商。
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<SettingsIcon />}
              onClick={() => handleOpenConfigDialog()}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' }
              }}
            >
              添加新配置
            </Button>
            <IconButton 
              onClick={fetchModels} 
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
        </Box>
      </Paper>

      {renderModelList()}

      <Dialog open={configDialogOpen} onClose={() => setConfigDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingModelType ? '配置模型' : '添加新配置'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth variant="outlined" sx={{ mt: 1 }}>
                <InputLabel id="model-type-label">配置类型</InputLabel>
                <Select
                  labelId="model-type-label"
                  value={formData.model_type}
                  onChange={(e) => setFormData({ ...formData, model_type: e.target.value })}
                  label="配置类型"
                  disabled={!!editingModelType}
                >
                  <MenuItem value="diagnosis">诊断AI模型 (Diagnosis LLM)</MenuItem>
                  <MenuItem value="mineru">文档提取 (MinerU)</MenuItem>
                  <MenuItem value="embedding">向量嵌入 (Embedding)</MenuItem>
                  <MenuItem value="oss">阿里云OSS存储</MenuItem>
                  <MenuItem value="rerank">重排序模型 (Rerank)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {formData.model_type === 'diagnosis' && (
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>AI提供商</InputLabel>
                  <Select
                    value={formData.provider}
                    onChange={(e) => handleProviderChange(e.target.value)}
                    label="AI提供商"
                  >
                    {Object.values(aiProviders).map((provider) => (
                      <MenuItem key={provider.key} value={provider.key}>
                        {provider.name_zh}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.model_type === 'embedding' && (
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>嵌入模型提供商</InputLabel>
                  <Select
                    value={formData.embedding_provider}
                    onChange={(e) => handleEmbeddingProviderChange(e.target.value)}
                    label="嵌入模型提供商"
                  >
                    <MenuItem value="">-- 选择提供商 --</MenuItem>
                    {embeddingProviders.map((provider) => (
                      <MenuItem key={provider.key} value={provider.key}>
                        {provider.name_zh} ({provider.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.model_type === 'rerank' && (
              <Grid item xs={12}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>重排序模型提供商</InputLabel>
                  <Select
                    value={formData.rerank_provider}
                    onChange={(e) => handleRerankProviderChange(e.target.value)}
                    label="重排序模型提供商"
                  >
                    <MenuItem value="">-- 选择提供商 --</MenuItem>
                    {rerankProviders.map((provider) => (
                      <MenuItem key={provider.key} value={provider.key}>
                        {provider.name_zh} ({provider.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
            
            {formData.model_type !== 'oss' && (
              <>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="模型ID"
                    variant="outlined"
                    value={formData.model_id}
                    onChange={(e) => setFormData({ ...formData, model_id: e.target.value })}
                    placeholder="例如: glm-4-flash"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API地址"
                    variant="outlined"
                    value={formData.api_url}
                    onChange={(e) => setFormData({ ...formData, api_url: e.target.value })}
                    onBlur={validateApiUrl}
                    placeholder="例如: https://api.example.com/v1"
                    helperText={
                      formData.model_type === 'embedding' 
                        ? '模型的API端点地址（选择提供商后自动填充）' 
                        : '模型的API端点地址'
                    }
                  />
                  {formData.model_type === 'embedding' && urlValidation && (
                    <Typography variant="caption" color={urlValidation.includes('✓') ? 'success.main' : urlValidation.includes('⚠️') ? 'warning.main' : 'error.main'} sx={{ mt: 0.5, display: 'block', whiteSpace: 'pre-line' }}>
                      {urlValidation}
                    </Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="API密钥"
                    variant="outlined"
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    placeholder="输入API密钥"
                  />
                </Grid>
              </>
            )}
            
            {formData.model_type === 'oss' && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="OSS Bucket名称"
                    variant="outlined"
                    value={formData.oss_bucket}
                    onChange={(e) => setFormData({ ...formData, oss_bucket: e.target.value })}
                    placeholder="例如: medicare-documents"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="OSS Endpoint"
                    variant="outlined"
                    value={formData.oss_endpoint}
                    onChange={(e) => setFormData({ ...formData, oss_endpoint: e.target.value })}
                    placeholder="例如: oss-cn-beijing.aliyuncs.com"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Access Key ID"
                    variant="outlined"
                    value={formData.oss_access_key_id}
                    onChange={(e) => setFormData({ ...formData, oss_access_key_id: e.target.value })}
                    placeholder="输入Access Key ID"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Access Key Secret"
                    variant="outlined"
                    type="password"
                    value={formData.oss_access_key_secret}
                    onChange={(e) => setFormData({ ...formData, oss_access_key_secret: e.target.value })}
                    placeholder="输入Access Key Secret"
                  />
                </Grid>
              </>
            )}
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Switch
                  checked={formData.enabled}
                  onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                />
                <Typography sx={{ ml: 1 }}>启用此模型</Typography>
              </Box>
            </Grid>
            
            {testResults.form && (
              <Grid item xs={12}>
                <Alert 
                  severity={testResults.form.success ? 'success' : 'error'}
                  sx={{ mt: 2 }}
                >
                  <Typography variant="body2">
                    {testResults.form.success 
                      ? `✓ 连接成功 (${testResults.form.latency_ms}ms)`
                      : `✗ 连接失败: ${testResults.form.error_message}`
                    }
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfigDialogOpen(false)}>
            取消
          </Button>
          <Button
            variant="outlined"
            color="success"
            onClick={handleTestFormModel}
            disabled={testing.form}
          >
            {testing.form ? '测试中...' : '测试连通性'}
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveConfig}
          >
            保存配置
          </Button>
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

export default AIModels;
