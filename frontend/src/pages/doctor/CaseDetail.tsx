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
  InputLabel,
  TextField,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Paper,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon,
  Close as CloseIcon,
  MedicalServices as MedicalServicesIcon,
  Warning as WarningIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

import { doctorsApi } from '../../services/api';
import type {
  SharedMedicalCase,
  DoctorCaseComment,
  CaseCommentReply,
  MedicalDocument,
  ChronicDisease
} from '../../types';
import { buildApiUrl } from '../../config/api';
import { CONFIG } from '../../lib/config';

interface CaseDetailResponse {
  case: SharedMedicalCase;
  documents?: MedicalDocument[];
  comments?: DoctorCaseComment[];
}

const CaseDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const from = searchParams.get('from') || 'cases';

  const [commentType, setCommentType] = useState<string>('general');
  const [commentContent, setCommentContent] = useState<string>('');
  const [documentDialog, setDocumentDialog] = useState<{
    open: boolean;
    content: string;
    title: string;
    docId?: string;
  }>({ open: false, content: '', title: '' });

  const {
    data: caseData,
    isLoading: caseLoading,
    error: caseError,
  } = useQuery<CaseDetailResponse>({
    queryKey: ['doctor', 'case', id],
    queryFn: async () => {
      if (!id) throw new Error('Case ID is required');

      const response = await fetch(buildApiUrl(`doctor/cases/${id}`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load case detail');
      }
      
      return response.json();
    },
    enabled: !!id,
  });

  const {
    data: comments,
    isLoading: commentsLoading,
    refetch: refetchComments,
  } = useQuery<DoctorCaseComment[]>({
    queryKey: ['doctor', 'case', id, 'comments'],
    queryFn: async () => {
      if (!id) return [];
      
      const response = await fetch(buildApiUrl(`doctor/cases/${id}/comments`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load comments');
      }
      
      return response.json();
    },
    enabled: !!id,
  });

  const submitCommentMutation = useMutation({
    mutationFn: async (data: { comment_type: string; content: string }) => {
      if (!id) throw new Error('Case ID is required');
      
      const response = await fetch(buildApiUrl(`doctor/cases/${id}/comments`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...data,
          shared_case_id: id,
          is_public: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit comment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      setCommentContent('');
      refetchComments();
      queryClient.invalidateQueries({ queryKey: ['doctor', 'case', id] });
    },
  });

  const handleDownloadDocument = async (docId: string, filename: string) => {
    try {
      const response = await fetch(buildApiUrl(`documents/${docId}/download`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`
        }
      });

      if (!response.ok) {
        throw new Error('Download failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleViewDocument = async (docId: string, filename: string) => {
    try {
      const response = await fetch(buildApiUrl(`documents/${docId}/content`), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        let content = data.cleaned_content || data.extracted_content || '暂无内容预览';
        
        if (typeof content === 'object' && content !== null) {
          content = content.text || JSON.stringify(content, null, 2);
        }
        
        setDocumentDialog({
          open: true,
          content: typeof content === 'string' ? content : JSON.stringify(content),
          title: filename,
          docId,
        });
      } else {
        handleDownloadDocument(docId, filename);
      }
    } catch (error) {
      console.error('Failed to load document:', error);
      handleDownloadDocument(docId, filename);
    }
  };

  const handleSubmitComment = () => {
    if (!commentContent.trim()) {
      return;
    }

    submitCommentMutation.mutate({
      comment_type: commentType,
      content: commentContent.trim(),
    });
  };

  const createDiseaseTag = (disease: ChronicDisease) => {
    const colors = {
      chronic: '#ff9800',
      special: '#f44336',
      both: '#9c27b0',
    };

    return (
      <Chip
        key={disease.id}
        label={disease.common_names?.[0] || disease.icd10_name}
        size="small"
        sx={{
          backgroundColor: colors[disease.disease_type],
          color: 'white',
          fontSize: '0.75rem',
          height: '24px',
          mr: 0.5,
          mb: 0.5,
        }}
      />
    );
  };

  // Markdown 组件样式配置
  const markdownComponents = {
    h1: ({ children }: { children: React.ReactNode }) => (
      <Typography variant="h4" sx={{ color: '#11998e', mt: 3, mb: 2, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h2: ({ children }: { children: React.ReactNode }) => (
      <Typography variant="h5" sx={{ color: '#11998e', mt: 2.5, mb: 1.5, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    h3: ({ children }: { children: React.ReactNode }) => (
      <Typography variant="h6" sx={{ color: '#11998e', mt: 2, mb: 1, fontWeight: 'bold' }}>
        {children}
      </Typography>
    ),
    p: ({ children }: { children: React.ReactNode }) => (
      <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.8 }}>
        {children}
      </Typography>
    ),
    strong: ({ children }: { children: React.ReactNode }) => (
      <Typography component="span" sx={{ fontWeight: 'bold', color: '#333' }}>
        {children}
      </Typography>
    ),
    em: ({ children }: { children: React.ReactNode }) => (
      <Typography component="span" sx={{ fontStyle: 'italic' }}>
        {children}
      </Typography>
    ),
    code: ({ children }: { children: React.ReactNode }) => (
      <Box
        component="code"
        sx={{
          backgroundColor: '#f5f5f5',
          padding: '2px 6px',
          borderRadius: '3px',
          fontFamily: 'monospace',
          fontSize: '13px',
        }}
      >
        {children}
      </Box>
    ),
    pre: ({ children }: { children: React.ReactNode }) => (
      <Paper
        component="pre"
        sx={{
          backgroundColor: '#f8f9fa',
          padding: 2,
          borderRadius: 1,
          overflow: 'auto',
          fontFamily: 'monospace',
          fontSize: '13px',
          mb: 2,
        }}
      >
        {children}
      </Paper>
    ),
    ul: ({ children }: { children: React.ReactNode }) => (
      <Box component="ul" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    ol: ({ children }: { children: React.ReactNode }) => (
      <Box component="ol" sx={{ pl: 3, mb: 2 }}>
        {children}
      </Box>
    ),
    li: ({ children }: { children: React.ReactNode }) => (
      <Typography component="li" variant="body1" sx={{ mb: 0.5, lineHeight: 1.8 }}>
        {children}
      </Typography>
    ),
    table: ({ children }: { children: React.ReactNode }) => (
      <Box sx={{ overflow: 'auto', mb: 2 }}>
        <Box
          component="table"
          sx={{
            borderCollapse: 'collapse',
            width: '100%',
            fontSize: '14px',
          }}
        >
          {children}
        </Box>
      </Box>
    ),
    thead: ({ children }: { children: React.ReactNode }) => (
      <Box component="thead" sx={{ backgroundColor: '#11998e' }}>
        {children}
      </Box>
    ),
    th: ({ children }: { children: React.ReactNode }) => (
      <Box
        component="th"
        sx={{
          border: '1px solid #ddd',
          padding: '10px',
          color: 'white',
          textAlign: 'left',
          fontWeight: 'bold',
        }}
      >
        {children}
      </Box>
    ),
    td: ({ children }: { children: React.ReactNode }) => (
      <Box
        component="td"
        sx={{
          border: '1px solid #ddd',
          padding: '8px',
          textAlign: 'left',
        }}
      >
        {children}
      </Box>
    ),
    tr: ({ children }: { children: React.ReactNode }) => (
      <Box
        component="tr"
        sx={{
          '&:nth-of-type(even)': {
            backgroundColor: '#f8f9fa',
          },
        }}
      >
        {children}
      </Box>
    ),
    blockquote: ({ children }: { children: React.ReactNode }) => (
      <Box
        component="blockquote"
        sx={{
          borderLeft: '4px solid #11998e',
          pl: 2,
          py: 1,
          my: 2,
          backgroundColor: '#f8f9fa',
          borderRadius: '0 4px 4px 0',
        }}
      >
        {children}
      </Box>
    ),
  };

  const renderCommentReplies = (replies: CaseCommentReply[]) => {
    if (!replies || replies.length === 0) return null;

    return replies.map((reply) => (
      <Box
        key={reply.id}
        sx={{
          mt: 2,
          pt: 2,
          borderTop: '1px dashed',
          borderColor: 'divider',
          backgroundColor: 'background.default',
          p: 2,
          borderRadius: 1,
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="subtitle2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
            🙋 患者回复
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {new Date(reply.created_at).toLocaleString('zh-CN')}
          </Typography>
        </Box>
        <Typography variant="body2" color="text.primary">
          {reply.content}
        </Typography>
      </Box>
    ));
  };

  if (caseError) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        加载失败，请稍后重试
      </Alert>
    );
  }

  if (caseLoading || !caseData) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  const caseItem = caseData.case;
  const profile = caseItem.anonymous_patient_profile || {};
  const documents = caseData.documents || [];
  const chronicDiseases = caseItem.patient_chronic_diseases || [];

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(from === 'mentions' ? '/doctor/mentions' : '/doctor/cases')}
        sx={{ mb: 3 }}
      >
        {from === 'mentions' ? '返回@我的病例' : '返回病例列表'}
      </Button>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 3,
              pb: 2,
              borderBottom: '2px solid',
              borderColor: 'divider',
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                病例 #{caseItem.id.toString().slice(0, 8)}
              </Typography>
              <Box display="flex" gap={2} color="text.secondary" fontSize="0.875rem">
                <Typography variant="body2" component="span">
                  👤 {profile.age_range || '未知年龄'} · {profile.gender || '未知性别'}
                </Typography>
                <Typography variant="body2" component="span">
                  📍 {profile.city_tier || '未知地区'}
                </Typography>
                <Typography variant="body2" component="span">
                  📅 {new Date(caseItem.created_at).toLocaleDateString('zh-CN')}
                </Typography>
                <Typography variant="body2" component="span">
                  👁️ {caseItem.view_count || 0} 次查看
                </Typography>
              </Box>
              
              {chronicDiseases.length > 0 && (
                <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {chronicDiseases.map((disease: ChronicDisease) => createDiseaseTag(disease))}
                </Box>
              )}
            </Box>
          </Box>

          {chronicDiseases.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'error.main',
                  borderLeft: '3px solid',
                  borderColor: 'error.main',
                  pl: 1,
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                }}
              >
                <WarningIcon color="error" />
                患者特殊病/慢性病
              </Typography>
              <Box
                sx={{
                  p: 2,
                  backgroundColor: 'warning.light',
                  border: '1px solid',
                  borderColor: 'warning.main',
                  borderRadius: 1,
                }}
              >
                <Typography variant="body2" color="warning.dark">
                  <strong>重要提醒：</strong>该患者患有上述特殊病/慢性病，诊断和用药时需特别注意相关禁忌和相互作用。
                </Typography>
              </Box>
            </Box>
          )}

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'success.main',
                borderLeft: '3px solid',
                borderColor: 'success.main',
                pl: 1,
                mb: 2,
              }}
            >
              📝 症状描述
            </Typography>
            <Box
              sx={{
                p: 2,
                backgroundColor: 'background.default',
                borderRadius: 1,
                lineHeight: 1.8,
              }}
            >
              <Typography variant="body1">
                {caseItem.anonymized_symptoms || '暂无描述'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography
              variant="h6"
              sx={{
                color: 'success.main',
                borderLeft: '3px solid',
                borderColor: 'success.main',
                pl: 1,
                mb: 2,
              }}
            >
              🔍 AI诊断结果
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                backgroundColor: 'background.default',
                borderRadius: 2,
                '& img': { maxWidth: '100%', height: 'auto' },
                '& a': { color: '#11998e' },
              }}
            >
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {caseItem.anonymized_diagnosis || '暂无诊断'}
              </ReactMarkdown>
            </Paper>
          </Box>

          {documents.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="h6"
                sx={{
                  color: 'success.main',
                  borderLeft: '3px solid',
                  borderColor: 'success.main',
                  pl: 1,
                  mb: 2,
                }}
              >
                📎 检查资料
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                {documents.map((doc) => (
                  <Card
                    key={doc.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      p: 2,
                      borderLeft: '3px solid',
                      borderColor: 'success.main',
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: 'success.light' }}>
                      <MedicalServicesIcon />
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {doc.filename}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {doc.pii_cleaning_status === 'completed' ? '✓ 已脱敏' : '处理中'}
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      {doc.pii_cleaning_status === 'completed' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDocument(doc.id, doc.filename)}
                        >
                          预览
                        </Button>
                      )}
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={() => handleDownloadDocument(doc.id, doc.filename)}
                      >
                        下载
                      </Button>
                    </Box>
                  </Card>
                ))}
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3,
            }}
          >
            <Typography variant="h5" fontWeight="bold">
              💬 专业讨论
            </Typography>
          </Box>

          <Card sx={{ mb: 3, backgroundColor: 'background.default' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                发表您的专业建议
              </Typography>
              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>评论类型</InputLabel>
                <Select
                  value={commentType}
                  label="评论类型"
                  onChange={(e) => setCommentType(e.target.value)}
                >
                  <MenuItem value="general">一般评论</MenuItem>
                  <MenuItem value="suggestion">诊断建议</MenuItem>
                  <MenuItem value="diagnosis_opinion">诊断意见</MenuItem>
                  <MenuItem value="treatment_advice">治疗建议</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                multiline
                rows={4}
                placeholder="请输入您的专业建议或诊疗意见..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                sx={{ mb: 2 }}
              />
              <Button
                variant="contained"
                color="success"
                onClick={handleSubmitComment}
                disabled={submitCommentMutation.isPending}
                startIcon={<CommentIcon />}
              >
                {submitCommentMutation.isPending ? '发表中...' : '发表评论'}
              </Button>
            </CardContent>
          </Card>

          {commentsLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : comments && comments.length > 0 ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {comments.map((comment) => (
                <Card key={comment.id}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {comment.doctor?.display_name || '医生'}
                          {comment.doctor_specialty && (
                            <Chip
                              label={comment.doctor_specialty}
                              size="small"
                              sx={{ ml: 1 }}
                            />
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {comment.doctor_hospital || ''} · {new Date(comment.created_at).toLocaleString('zh-CN')}
                          {comment.status === 'edited' && ' (已编辑)'}
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Chip
                      label={
                        comment.comment_type === 'suggestion' ? '💡 诊断建议' :
                        comment.comment_type === 'diagnosis_opinion' ? '🔍 诊断意见' :
                        comment.comment_type === 'treatment_advice' ? '💊 治疗建议' :
                        '💬 一般评论'
                      }
                      size="small"
                      sx={{ mb: 1 }}
                    />
                    
                    <Typography variant="body2" sx={{ lineHeight: 1.6, mb: 2 }}>
                      {comment.content}
                    </Typography>
                    
                    {renderCommentReplies(comment.patient_replies || [])}
                  </CardContent>
                </Card>
              ))}
            </Box>
          ) : (
            <Box textAlign="center" py={6}>
              <Avatar sx={{ mx: 'auto', mb: 2, bgcolor: 'grey.200' }}>
                <CommentIcon color="action" />
              </Avatar>
              <Typography variant="body1" color="text.secondary">
                💬 暂无评论，成为第一个发表专业建议的医生吧
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={documentDialog.open}
        onClose={() => setDocumentDialog({ ...documentDialog, open: false })}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pb: 1,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'success.main' }}>
              <MedicalServicesIcon />
            </Avatar>
            <Box>
              <Typography variant="h6">{documentDialog.title}</Typography>
              <Typography variant="caption" color="text.secondary">
                文档预览
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setDocumentDialog({ ...documentDialog, open: false })}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 2 }}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: 'background.default',
              borderRadius: 2,
              minHeight: 200,
              maxHeight: '60vh',
              overflow: 'auto',
              '& img': { maxWidth: '100%', height: 'auto' },
              '& a': { color: '#11998e' },
            }}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={markdownComponents}
            >
              {documentDialog.content || '暂无内容预览'}
            </ReactMarkdown>
          </Paper>
        </DialogContent>
        
        <Divider />
        
        <DialogActions sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flexGrow: 1 }}>
            💡 提示：预览内容仅供参考，完整内容请下载文档查看
          </Typography>
          {documentDialog.docId && (
            <Button
              variant="outlined"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={() => {
                if (documentDialog.docId && documentDialog.title) {
                  handleDownloadDocument(documentDialog.docId, documentDialog.title);
                }
              }}
            >
              下载文档
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseDetail;
