import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { buildApiUrl } from '../../config/api';
import { CONFIG } from '../../lib/config';

interface SentMessage {
  id: string;
  subject: string;
  content: string;
  recipient: {
    id: string;
    full_name: string;
  };
  is_read: boolean;
  created_at: string;
  has_reply: boolean;
}

const DoctorMessages: React.FC = () => {
  const queryClient = useQueryClient();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<SentMessage | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch sent messages
  const {
    data: messagesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['doctor', 'sent-messages'],
    queryFn: async () => {
      const response = await fetch(buildApiUrl('messages/sent'), {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      return response.json();
    },
  });

  // Send message mutation
  const sendMutation = useMutation({
    mutationFn: async (data: { subject: string; content: string }) => {
      const response = await fetch(buildApiUrl('messages'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem(CONFIG.TOKEN_KEY)}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to send message');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor', 'sent-messages'] });
      setSubject('');
      setContent('');
      setShowForm(false);
      setSuccessMessage('消息发送成功！');
      setTimeout(() => setSuccessMessage(''), 3000);
    },
  });

  const handleSend = () => {
    if (subject.trim() && content.trim()) {
      sendMutation.mutate({ subject: subject.trim(), content: content.trim() });
    }
  };

  const sentMessages: SentMessage[] = messagesData?.messages || [];

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        站内信
      </Typography>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {sendMutation.isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          发送失败: {(sendMutation.error as Error).message}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box mb={3}>
        <Button
          variant="contained"
          color="success"
          startIcon={<SendIcon />}
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          发送新消息
        </Button>
      </Box>

      {/* Send Message Form */}
      {showForm && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              向管理员发送消息
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              您可以通过站内信向管理员反馈问题、建议或咨询
            </Typography>
            <TextField
              label="主题"
              fullWidth
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="请输入消息主题"
              sx={{ mt: 2 }}
              required
            />
            <TextField
              label="内容"
              multiline
              rows={6}
              fullWidth
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="请详细描述您的问题或建议..."
              sx={{ mt: 2 }}
              required
            />
            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="contained"
                color="success"
                startIcon={<SendIcon />}
                onClick={handleSend}
                disabled={!subject.trim() || !content.trim() || sendMutation.isPending}
              >
                {sendMutation.isPending ? '发送中...' : '发送'}
              </Button>
              <Button variant="outlined" color="success" onClick={() => setShowForm(false)}>
                取消
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Sent Messages History */}
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            <HistoryIcon />
            <Typography variant="h6">发送历史</Typography>
          </Box>

          {isLoading ? (
            <Typography color="text.secondary">加载中...</Typography>
          ) : error ? (
            <Alert severity="error">
              加载失败: {(error as Error).message}
            </Alert>
          ) : sentMessages.length === 0 ? (
            <Box textAlign="center" py={4}>
              <EmailIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
              <Typography color="text.secondary">
                暂无发送记录
              </Typography>
              <Typography variant="body2" color="text.secondary">
                您发送的消息将显示在这里
              </Typography>
            </Box>
          ) : (
            <List>
              {sentMessages.map((message) => (
                <React.Fragment key={message.id}>
                  <Paper sx={{ mb: 2, p: 2, cursor: 'pointer' }} onClick={() => setSelectedMessage(message)}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {message.subject}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            mt: 1,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {message.content}
                        </Typography>
                        <Box mt={1} display="flex" gap={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(message.created_at), 'yyyy-MM-dd HH:mm', {
                              locale: zhCN,
                            })}
                          </Typography>
                          {message.is_read ? (
                            <Chip label="已读" color="success" size="small" />
                          ) : (
                            <Chip label="未读" color="default" size="small" />
                          )}
                          {message.has_reply && (
                            <Chip label="有回复" color="success" size="small" />
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      {/* Message Detail Dialog */}
      <Dialog
        open={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{selectedMessage?.subject}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            发送时间:{' '}
            {selectedMessage &&
              format(new Date(selectedMessage.created_at), 'yyyy-MM-dd HH:mm:ss', {
                locale: zhCN,
              })}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
            {selectedMessage?.content}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedMessage(null)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DoctorMessages;
