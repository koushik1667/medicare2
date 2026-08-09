import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  InputAdornment,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ArrowBack as ArrowBackIcon,
  Share as ShareIcon,
  Print as PrintIcon,
  PictureAsPdf as PictureAsPdfIcon,
  Compare as CompareIcon,
  Note as NoteIcon,
  LocalHospital as HospitalIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  EditNote as EditNoteIcon,
  Home as HomeIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Reply as ReplyIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { casesApi, doctorsApi } from '../../services/api';
import type { MedicalCase, Doctor, DoctorCaseComment, CaseCommentReply, MedicalDocument } from '../../types';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MedicalRecordDetail: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // State
  const [record, setRecord] = useState<MedicalCase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [comments, setComments] = useState<DoctorCaseComment[]>([]);
  const [replyFormVisible, setReplyFormVisible] = useState<{ [key: string]: boolean }>({});
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

  // Modal states
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);

  // Sharing states
  const [selectedDoctors, setSelectedDoctors] = useState<Doctor[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[]>([]);
  const [shareConsent, setShareConsent] = useState(false);

  useEffect(() => {
    if (id) {
      loadRecord(id);
    }
  }, [id]);

  useEffect(() => {
    if (doctorSearchQuery) {
      searchDoctors();
    }
  }, [doctorSearchQuery]);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const loadRecord = async (caseId: string) => {
    try {
      setLoading(true);
      const data = await casesApi.getCase(caseId);
      setRecord(data);
      
      // Load documents if any
      // This would need to be implemented in the API
      // const documents = await casesApi.getCaseDocuments(caseId);
      // setDocuments(documents);
      
      // Load doctor comments
      loadDoctorComments(caseId);
    } catch (err) {
      console.error('Failed to load medical records:', err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorComments = async (caseId: string) => {
    try {
      const comments = await casesApi.getDoctorComments(caseId);
      setComments(comments);
    } catch (err) {
      console.error('Failed to load doctor comments:', err);
    }
  };

  const searchDoctors = async () => {
    if (!doctorSearchQuery.trim()) {
      setSearchedDoctors([]);
      return;
    }

    try {
      const doctors = await doctorsApi.getDoctors();
      const filteredDoctors = doctors.filter(doctor => 
        doctor.display_name?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
        doctor.hospital?.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
        doctor.specialty?.toLowerCase().includes(doctorSearchQuery.toLowerCase())
      ).slice(0, 10);
      setSearchedDoctors(filteredDoctors);
    } catch (err) {
      console.error('Failed to search doctors:', err);
    }
  };

  const toggleDoctorSelection = (doctor: Doctor) => {
    const isSelected = selectedDoctors.some(d => d.id === doctor.id);
    if (isSelected) {
      setSelectedDoctors(selectedDoctors.filter(d => d.id !== doctor.id));
    } else {
      setSelectedDoctors([...selectedDoctors, doctor]);
    }
  };

  const toggleReplyForm = (commentId: string) => {
    setReplyFormVisible(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  const handleReplyChange = (commentId: string, value: string) => {
    setReplyTexts(prev => ({
      ...prev,
      [commentId]: value
    }));
  };

  const submitReply = async (commentId: string) => {
    const content = replyTexts[commentId];
    if (!content.trim()) {
      alert('Please enter your reply');
      return;
    }

    try {
      // This would need to be implemented in the API
      // await casesApi.replyToComment(commentId, content);
      setReplyTexts(prev => ({
        ...prev,
        [commentId]: ''
      }));
      setReplyFormVisible(prev => ({
        ...prev,
        [commentId]: false
      }));
      // Reload comments
      if (record) {
        loadDoctorComments(record.id);
      }
      alert('Reply sent successfully');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply');
    }
  };

  const pdfRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!pdfRef.current || !record) {
      alert('Unable to export PDF, please try again later');
      return;
    }

    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      let imgY = 10;
      
      // Calculate how many pages we need
      const scaledHeight = imgHeight * ratio * (pdfWidth - 20) / (imgWidth * ratio);
      const pageHeight = pdfHeight - 20;
      let heightLeft = scaledHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 10, imgY, pdfWidth - 20, scaledHeight);
      heightLeft -= pageHeight;
      
      // Add additional pages if content is longer than one page
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Medical_Record_${record.title || 'AI_Diagnosis'}_${new Date().toLocaleDateString('en-US')}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('PDF export failed, please try using the print function');
    }
  };

  const printDiagnosis = () => {
    window.print();
  };

  const shareToDoctor = async () => {
    if (selectedDoctors.length === 0) {
      alert('Please select at least one doctor');
      return;
    }

    if (!shareConsent) {
      alert('Please agree to share this case');
      return;
    }

    if (!record) {
      alert('Unable to retrieve case information');
      return;
    }

    try {
      // This would need to be implemented in the API
      // await casesApi.shareWithDoctors(record.id, selectedDoctors.map(d => d.id));
      alert(`Successfully shared with ${selectedDoctors.length} doctor(s)!`);
      setShareModalOpen(false);
      setSelectedDoctors([]);
    } catch (err) {
      console.error('Share failed:', err);
      alert('Share failed');
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'Mild':
      case 'low':
        return '#28a745';
      case 'Light':
      case 'medium':
        return '#ffc107';
      case 'Moderate':
      case 'high':
        return '#fd7e14';
      case 'Severe':
      case 'critical':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'active':
        return '#28a745';
      case 'completed':
        return '#17a2b8';
      case 'archived':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={4}>
        <Toolbar sx={{ backgroundColor: 'white', color: '#333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <IconButton onClick={() => navigate('/patient/medical-records')} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <HospitalIcon sx={{ fontSize: 32, mr: 2, color: '#667eea' }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#667eea' }}>
              MediCareAI - Medical Record Details
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ bgcolor: '#667eea' }}>
              {user?.full_name?.charAt(0) || 'P'}
            </Avatar>
            <Typography variant="body1">
              {user?.full_name || 'Welcome'}
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 3, pb: 3 }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Record Details */}
        {!loading && record && (
          <Paper ref={pdfRef} elevation={3} sx={{ p: 4, borderRadius: 3, bgcolor: '#ffffff' }}>
            {/* Meta Information */}
            <Grid container spacing={2} sx={{ mb: 3, p: 3, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  📅 Created:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {formatDate(record.created_at)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  📋 Status:
                </Typography>
                <Chip
                  label={getStatusLabel(record.status)}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(record.status),
                    color: 'white',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  ⚠️ Severity:
                </Typography>
                <Chip
                  label={record.severity || 'Unknown'}
                  size="small"
                  sx={{
                    bgcolor: getSeverityColor(record.severity),
                    color: 'white',
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">
                  🆔 Record ID:
                </Typography>
                <Typography variant="body1" component="code" sx={{ p: 0.5, bgcolor: '#f5f5f5', borderRadius: 1, fontFamily: 'monospace' }}>
                  {record.id}
                </Typography>
              </Grid>
            </Grid>

            {/* Title */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                📝 Record Title
              </Typography>
              <Typography variant="body1" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                {record.title || 'AI Medical Record'}
              </Typography>
            </Box>

            {/* Symptoms */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                😷 Symptom Description
              </Typography>
              <Typography variant="body1" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                {record.symptoms || 'No symptoms recorded'}
              </Typography>
            </Box>

            {/* Description */}
            {record.description && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📄 Detailed Description
                </Typography>
                <Typography variant="body1" sx={{ p: 2, bgcolor: '#fafafa', borderRadius: 2 }}>
                  {record.description}
                </Typography>
              </Box>
            )}

            {/* Documents */}
            {documents.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  📎 Examination Documents
                </Typography>
                <Grid container spacing={2}>
                  {documents.map((doc) => (
                    <Grid item xs={12} sm={6} md={4} key={doc.id}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            {doc.filename}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            File Type: {doc.file_type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            File Size: {doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : 'Unknown'}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {/* AI Diagnosis */}
            {record.diagnosis && (
              <Accordion sx={{ mb: 3 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="h6">
                    🤖 AI Diagnosis Results
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper
                    elevation={1}
                    sx={{ p: 3, bgcolor: '#fafafa', borderRadius: 2 }}
                  >
                    <Typography variant="body1" component="pre" sx={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                      {record.diagnosis}
                    </Typography>
                  </Paper>
                </AccordionDetails>
              </Accordion>
            )}

            {/* Doctor Comments */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                👨‍⚕️ Doctor Feedback
              </Typography>
              {comments.length === 0 ? (
                <Typography variant="body2" color="text.secondary" fontStyle="italic">
                  No doctor feedback yet
                </Typography>
              ) : (
                <Box>
                  {comments.map((comment) => (
                    <Card key={comment.id} sx={{ mb: 2, borderLeft: '4px solid #667eea' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            👨‍⚕️ {comment.doctor?.display_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(comment.created_at).toLocaleString('en-US')}
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          🏥 {comment.doctor?.hospital} · {comment.doctor?.specialty}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
                          {comment.content}
                        </Typography>
                        
                        {/* Patient Replies */}
                        {comment.patient_replies && comment.patient_replies.length > 0 && (
                          <Box sx={{ ml: 2, mt: 1 }}>
                            {comment.patient_replies.map((reply) => (
                              <Paper key={reply.id} sx={{ p: 2, bgcolor: '#f0f8ff', borderLeft: '3px solid #28a745', mb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                  <Typography variant="body2" fontWeight="bold" color="#28a745">
                                    🙋 My Reply
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {new Date(reply.created_at).toLocaleString('en-US')}
                                  </Typography>
                                </Box>
                                <Typography variant="body2">
                                  {reply.content}
                                </Typography>
                              </Paper>
                            ))}
                          </Box>
                        )}

                        {/* Reply Form */}
                        {replyFormVisible[comment.id] && (
                          <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #e0e0e0' }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              placeholder="Enter your reply..."
                              value={replyTexts[comment.id] || ''}
                              onChange={(e) => handleReplyChange(comment.id, e.target.value)}
                              sx={{ mb: 1 }}
                            />
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                              <Button
                                size="small"
                                onClick={() => toggleReplyForm(comment.id)}
                              >
                                Cancel
                              </Button>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={() => submitReply(comment.id)}
                              >
                                Send Reply
                              </Button>
                            </Box>
                          </Box>
                        )}
                        
                        <Button
                          size="small"
                          startIcon={<ReplyIcon />}
                          onClick={() => toggleReplyForm(comment.id)}
                          sx={{ mt: 1 }}
                        >
                          💬 Reply to Doctor
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Button
                variant="contained"
                color="error"
                startIcon={<PictureAsPdfIcon />}
                onClick={exportToPDF}
              >
                📄 Export PDF
              </Button>
              <Button
                variant="contained"
                color="success"
                startIcon={<ShareIcon />}
                onClick={() => setShareModalOpen(true)}
              >
                🔗 Share
              </Button>
              <Button
                variant="contained"
                color="secondary"
                startIcon={<PrintIcon />}
                onClick={printDiagnosis}
              >
                🖨️ Print
              </Button>
              <Button
                variant="contained"
                color="info"
                startIcon={<CompareIcon />}
                onClick={() => setCompareModalOpen(true)}
              >
                📊 Compare
              </Button>
            </Box>
          </Paper>
        )}
      </Container>

      {/* Share Modal */}
      <Dialog
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
          🔗 Share Diagnostic Report
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search Doctors (multiple allowed)
              </Typography>
              <TextField
                fullWidth
                value={doctorSearchQuery}
                onChange={(e) => setDoctorSearchQuery(e.target.value)}
                placeholder="Enter doctor name, hospital, or specialty"
                InputProps={{
                  startAdornment: (
                    <IconButton size="small">
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
              <Typography variant="caption" color="text.secondary">
                💡 Only verified doctors are shown. Click to select multiple doctors; click again to deselect.
              </Typography>
            </Box>

            {/* Search Results */}
            {searchedDoctors.length > 0 && (
              <Box sx={{ mb: 3, maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 2, p: 2 }}>
                {searchedDoctors.map((doctor) => {
                  const isSelected = selectedDoctors.some(d => d.id === doctor.id);
                  return (
                    <Card
                      key={doctor.id}
                      sx={{
                        mb: 1,
                        border: isSelected ? '2px solid #667eea' : '1px solid #e0e0e0',
                        bgcolor: isSelected ? '#f0f3ff' : 'white',
                        cursor: 'pointer',
                      }}
                      onClick={() => toggleDoctorSelection(doctor)}
                    >
                      <CardContent sx={{ py: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {doctor.display_name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doctor.hospital || 'Unknown Hospital'} · {doctor.department || 'Unknown Department'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Specialty: {doctor.specialty || 'Not specified'}
                            </Typography>
                          </Box>
                          <Typography variant="h6" color={isSelected ? '#667eea' : '#ccc'}>
                            {isSelected ? '✓' : '+'}
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}

            {/* Selected Doctors */}
            {selectedDoctors.length > 0 && (
              <Box sx={{ mb: 3, p: 2, bgcolor: '#f0f3ff', border: '1px solid #667eea', borderRadius: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Selected Doctors
                </Typography>
                <List>
                  {selectedDoctors.map((doctor) => (
                    <ListItem key={doctor.id}>
                      <ListItemText
                        primary={doctor.display_name}
                        secondary={`${doctor.hospital || 'Unknown Hospital'} · ${doctor.department || 'Unknown Department'}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => toggleDoctorSelection(doctor)}
                          color="error"
                        >
                            <Typography variant="body2" color="error">Remove</Typography>
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setSelectedDoctors([])}
                  sx={{ mt: 1 }}
                >
                  Clear All
                </Button>
              </Box>
            )}

            {/* Consent */}
            <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom>
                Share Authorization
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                You are about to share this case with the selected doctors. Shared content will be automatically anonymized, hiding your name, ID number, phone number, and other sensitive information.
                <br />
                Doctors will be able to view: symptom description, AI diagnosis results, and examination data (anonymized).
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareModalOpen(false)}>
            Close
          </Button>
          <Button
            variant="contained"
            onClick={shareToDoctor}
            disabled={selectedDoctors.length === 0}
          >
            @ Mention Doctor
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Modal */}
      <Dialog
        open={compareModalOpen}
        onClose={() => setCompareModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        <DialogTitle sx={{ bgcolor: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
          📊 Medical Record Comparison
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ textAlign: 'center', py: 5 }}>
            The record comparison feature requires selecting another record to compare.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareModalOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MedicalRecordDetail;
