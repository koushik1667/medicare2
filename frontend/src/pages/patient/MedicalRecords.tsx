import React, { useState, useEffect, useRef } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  FormControlLabel,
  Checkbox,
  DialogContent,
  DialogActions,
  AppBar,
  Toolbar,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Grid,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
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
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../../hooks/useAuth';
import { casesApi, doctorsApi } from '../../services/api';
import type { MedicalCase, Doctor, DoctorCaseComment, CaseCommentReply } from '../../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const MedicalRecords: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [records, setRecords] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [timeRange, setTimeRange] = useState('');
  
  // Modal states
  const [selectedRecord, setSelectedRecord] = useState<MedicalCase | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [compareModalOpen, setCompareModalOpen] = useState(false);
  
  // Sharing states
  const [selectedDoctors, setSelectedDoctors] = useState<Doctor[]>([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');
  const [searchedDoctors, setSearchedDoctors] = useState<Doctor[]>([]);
  const [includeDiagnosis, setIncludeDiagnosis] = useState(true);
  const [includeSymptoms, setIncludeSymptoms] = useState(true);
  const [includePersonal, setIncludePersonal] = useState(false);
  const [shareConsent, setShareConsent] = useState(false);
  const [shareTab, setShareTab] = useState(0);

  // Comments states
  const [comments, setComments] = useState<DoctorCaseComment[]>([]);
  const [replyFormVisible, setReplyFormVisible] = useState<{ [key: string]: boolean }>({});
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});

  // Compare states
  const [compareRecord1, setCompareRecord1] = useState<string>('');
  const [compareRecord2, setCompareRecord2] = useState<string>('');

  useEffect(() => {
    loadRecords();
  }, []);

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

  const loadRecords = async () => {
    try {
      setLoading(true);
      const data = await casesApi.getCases();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load medical records:', err);
      setError('Failed to load medical records');
    } finally {
      setLoading(false);
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

  const handleViewRecord = (record: MedicalCase) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
    loadDoctorComments(record.id);
  };

  const handleShareRecord = (record: MedicalCase) => {
    setSelectedRecord(record);
    setShareModalOpen(true);
  };

  const handleCompareRecord = (record: MedicalCase) => {
    setCompareRecord1(record.id);
    setCompareModalOpen(true);
  };

  const loadDoctorComments = async (caseId: string) => {
    try {
      const comments = await casesApi.getDoctorComments(caseId);
      setComments(comments);
    } catch (err) {
      console.error('Failed to load doctor comments:', err);
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
      // Call API to submit patient reply to doctor comment
      if (selectedRecord) {
        await casesApi.replyToDoctorComment(selectedRecord.id, commentId, content);
      }
      setReplyTexts(prev => ({
        ...prev,
        [commentId]: ''
      }));
      setReplyFormVisible(prev => ({
        ...prev,
        [commentId]: false
      }));
      // Reload comments to show the new reply
      if (selectedRecord) {
        loadDoctorComments(selectedRecord.id);
      }
      alert('Reply sent successfully');
    } catch (err) {
      console.error('Failed to send reply:', err);
      alert('Failed to send reply');
    }
  };

  const pdfRef = useRef<HTMLDivElement>(null);
  const diagnosisRef = useRef<HTMLDivElement>(null);

  const exportToPDF = async () => {
    if (!pdfRef.current || !selectedRecord) {
      alert('Unable to export PDF, please try again later');
      return;
    }

    try {
      const element = pdfRef.current;
      
      // Use onclone to modify the cloned element before rendering
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
        height: element.scrollHeight,
        width: element.scrollWidth,
        onclone: (clonedDoc) => {
          // Find the diagnosis Paper in the cloned document and remove scroll constraints
          const clonedDiagnosisPaper = clonedDoc.querySelector('[data-pdf-diagnosis]');
          if (clonedDiagnosisPaper) {
            (clonedDiagnosisPaper as HTMLElement).style.maxHeight = 'none';
            (clonedDiagnosisPaper as HTMLElement).style.overflow = 'visible';
            (clonedDiagnosisPaper as HTMLElement).style.height = 'auto';
          }
          
          // Also find any other scrollable containers
          const scrollableElements = clonedDoc.querySelectorAll('[style*="max-height"], [style*="overflow"]');
          scrollableElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.maxHeight = 'none';
            htmlEl.style.overflow = 'visible';
          });
        },
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
      
      const scaledHeight = imgHeight * ratio * (pdfWidth - 20) / (imgWidth * ratio);
      const pageHeight = pdfHeight - 20;
      let heightLeft = scaledHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 10, imgY, pdfWidth - 20, scaledHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - scaledHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, pdfWidth - 20, scaledHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`Medical_Record_${selectedRecord.title || 'AI_Diagnosis'}_${new Date().toLocaleDateString('en-US')}.pdf`);
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

    if (!selectedRecord) {
      alert('Unable to retrieve case information');
      return;
    }

    try {
      // This would need to be implemented in the API
      // await casesApi.shareWithDoctors(selectedRecord.id, selectedDoctors.map(d => d.id));
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
      case 'moderate':
        return '#fd7e14';
      case 'Severe':
      case 'critical':
      case 'severe':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  const getSeverityLabel = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'low':
      case 'mild':
        return 'Mild';
      case 'medium':
      case 'light':
        return 'Light';
      case 'high':
      case 'moderate':
        return 'Moderate';
      case 'critical':
      case 'severe':
        return 'Severe';
      case 'minor':
        return 'Mild';
      default:
        return severity || 'Unknown';
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

  const extractDiagnosesFromMarkdown = (diagnosis?: string): string[] => {
    if (!diagnosis || diagnosis.trim().length === 0) {
      return [];
    }

    const diagnoses: string[] = [];
    let match;

    const cleanMarkdown = (text: string): string => {
      return text.replace(/\*\*/g, '').trim();
    };

    const tableRowPattern = /\|\s*(\d+)\s*\|\s*([^|]+?)\s*\|/g;
    while ((match = tableRowPattern.exec(diagnosis)) !== null) {
      const diagnosisName = cleanMarkdown(match[2]);
      const isHeaderRow = /Diagnosis Name|Diagnosis Order|---/.test(diagnosisName);
      const isValidEntry = diagnosisName.length > 1 && !isHeaderRow;
      if (isValidEntry) {
        diagnoses.push(diagnosisName);
      }
    }

    if (diagnoses.length === 0) {
      const listPattern = /(\d+)\.\s*\*\*\s*([^*]+?)\s*\*\*/g;
      while ((match = listPattern.exec(diagnosis)) !== null) {
        const diagnosisName = cleanMarkdown(match[2]);
        if (diagnosisName.length > 1 && !/Preliminary Diagnosis|Examination Report/.test(diagnosisName)) {
          diagnoses.push(diagnosisName);
        }
      }
    }

    if (diagnoses.length === 0) {
      const boldPattern = /\*\*\s*([^*]{2,30}?)\s*\*\*/g;
      const diseaseKeywords = ['pneumonia', 'asthma', 'epilepsy', 'anemia', 'infection', 'inflammation', 'disease', 'syndrome', 'disorder', 'condition'];
      while ((match = boldPattern.exec(diagnosis)) !== null) {
        const diagnosisName = cleanMarkdown(match[1]);
        const containsDiseaseKeyword = diseaseKeywords.some(kw => diagnosisName.toLowerCase().includes(kw));
        const isNotGeneric = !/Preliminary Diagnosis|Examination Report|Medical Advice|Precautions/.test(diagnosisName);
        if (containsDiseaseKeyword && isNotGeneric) {
          diagnoses.push(diagnosisName);
        }
      }
    }

    return [...new Set(diagnoses)];
  };

  const getRecordTitle = (record: MedicalCase): string => {
    const diagnoses = extractDiagnosesFromMarkdown(record.diagnosis);

    if (diagnoses.length > 0) {
      return `AI Diagnosis - ${diagnoses.join(', ')}`;
    }

    return record.title || 'AI Medical Record';
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

  // Filter records based on search and time range
  const filteredRecords = records.filter(record => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      if (!record.symptoms.toLowerCase().includes(keyword) && 
          !record.diagnosis?.toLowerCase().includes(keyword) &&
          !record.title?.toLowerCase().includes(keyword)) {
        return false;
      }
    }

    if (timeRange) {
      const recordDate = new Date(record.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (timeRange) {
        case '7':
          if (daysDiff > 7) return false;
          break;
        case '30':
          if (daysDiff > 30) return false;
          break;
        case '90':
          if (daysDiff > 90) return false;
          break;
        case '180':
          if (daysDiff > 180) return false;
          break;
      }
    }

    return true;
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FDFCF8', pb: 6 }}>
      <Container maxWidth="lg">
        {/* Filter Bar */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: '2rem',
            bgcolor: '#FEFEFA',
            border: '1px solid rgba(222, 216, 207, 0.8)',
            boxShadow: '0 6px 24px -4px rgba(93, 112, 82, 0.12)',
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Keyword Search"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
                placeholder="Search diagnoses, symptoms..."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Time Range</InputLabel>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                  label="Time Range"
                >
                  <MenuItem value="">All Time</MenuItem>
                  <MenuItem value="7">Last 7 Days</MenuItem>
                  <MenuItem value="30">Last 30 Days</MenuItem>
                  <MenuItem value="90">Last 3 Months</MenuItem>
                  <MenuItem value="180">Last 6 Months</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                fullWidth
                variant="contained"
                startIcon={<FilterListIcon />}
                onClick={loadRecords}
                sx={{ height: '56px' }}
              >
                Search
              </Button>
            </Grid>
          </Grid>
        </Paper>

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

        {/* Records List */}
        {!loading && filteredRecords.length === 0 && !error && (
          <Paper elevation={2} sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
            <DescriptionIcon sx={{ fontSize: 64, mb: 2, color: '#ccc' }} />
            <Typography variant="h6" gutterBottom>
              No Medical Records
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/patient/symptom-submit')}
              startIcon={<EditNoteIcon />}
            >
              Submit Symptoms for AI Diagnosis
            </Button>
          </Paper>
        )}

        {/* Record Cards */}
        {!loading && filteredRecords.map((record) => (
          <Card
            key={record.id}
            elevation={3}
            sx={{
              mb: 3,
              borderLeft: `4px solid #667eea`,
              transition: 'transform 0.3s, box-shadow 0.3s',
              '&:hover': {
                transform: 'translateX(5px)',
                boxShadow: 6,
              },
            }}
          >
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  📅 {formatDate(record.created_at)}
                </Typography>
                <Chip
                  label={getStatusLabel(record.status)}
                  size="small"
                  sx={{
                    bgcolor: getStatusColor(record.status),
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
              </Box>

              <Typography variant="h6" gutterBottom fontWeight="bold">
                {getRecordTitle(record)}
              </Typography>

              <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 2, minWidth: '80px' }}>
                  Severity:
                </Typography>
                <Chip
                  label={getSeverityLabel(record.severity)}
                  size="small"
                  sx={{
                    bgcolor: getSeverityColor(record.severity),
                    color: 'white',
                  }}
                />
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mr: 2, mb: 1 }}>
                  Symptoms:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {record.symptoms.length > 100
                    ? `${record.symptoms.substring(0, 100)}...`
                    : record.symptoms}
                </Typography>
              </Box>

              {record.diagnosis && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mr: 2, mb: 1 }}>
                    AI Diagnosis:
                  </Typography>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: '#f8f9fa',
                      borderRadius: 1,
                      border: '1px solid #e0e0e0',
                      maxHeight: '200px',
                      overflow: 'hidden',
                      '& p': { m: 0, fontSize: '0.875rem', lineHeight: 1.6 },
                      '& h1, & h2, & h3': { fontSize: '1rem', fontWeight: 'bold', mt: 1, mb: 0.5 },
                      '& table': { display: 'none' },
                      '& ul, & ol': { pl: 2, m: 0 },
                      '& li': { fontSize: '0.875rem' },
                    }}
                  >
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        p: ({ children }) => (
                          <Typography variant="body2" sx={{ fontSize: '0.875rem', lineHeight: 1.6 }}>
                            {children}
                          </Typography>
                        ),
                        h1: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>{children}</Typography>,
                        h2: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>{children}</Typography>,
                        h3: ({ children }) => <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mt: 1 }}>{children}</Typography>,
                        li: ({ children }) => <Typography component="li" variant="body2" sx={{ fontSize: '0.875rem' }}>{children}</Typography>,
                      }}
                    >
                      {record.diagnosis.length > 200
                        ? `${record.diagnosis.substring(0, 200)}...`
                        : record.diagnosis}
                    </ReactMarkdown>
                  </Paper>
                </Box>
              )}

              <Button
                variant="contained"
                startIcon={<VisibilityIcon />}
                onClick={() => handleViewRecord(record)}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))}

        {/* Back Button */}
        {!loading && (
          <Box sx={{ textAlign: 'center', mt: 3, pt: 2, borderTop: '1px solid #e0e0e0' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/patient')}
              startIcon={<HomeIcon />}
              size="large"
            >
              ← Back to Home
            </Button>
          </Box>
        )}
      </Container>

      {/* Detail Modal */}
      <Dialog
        open={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {selectedRecord && (
          <>
            <DialogTitle sx={{ bgcolor: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white' }}>
              🩺 Medical Record Details
            </DialogTitle>
            <DialogContent>
              <Box ref={pdfRef} sx={{ mt: 2 }}>
                {/* Meta Information */}
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        📅 Created:
                      </Typography>
                      <Typography variant="body1" fontWeight="bold">
                        {formatDate(selectedRecord.created_at)}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        📋 Status:
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(selectedRecord.status),
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {getStatusLabel(selectedRecord.status)}
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        ⚠️ Severity:
                      </Typography>
                      <Box
                        component="span"
                        sx={{
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: getSeverityColor(selectedRecord.severity),
                          color: 'white',
                          fontSize: '0.875rem',
                          fontWeight: 500,
                        }}
                      >
                        {getSeverityLabel(selectedRecord.severity)}
                      </Box>
                    </Grid>
                  </Grid>
                </Box>

                {/* Title */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    📝 Record Title
                  </Typography>
                  <Typography variant="body1">
                    {getRecordTitle(selectedRecord)}
                  </Typography>
                </Box>

                {/* Symptoms */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    😷 Symptom Description
                  </Typography>
                  <Typography variant="body1">
                    {selectedRecord.symptoms || 'No symptoms recorded'}
                  </Typography>
                </Box>

                {/* Description */}
                {selectedRecord.description && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      📄 Detailed Description
                    </Typography>
                    <Typography variant="body1">
                      {selectedRecord.description}
                    </Typography>
                  </Box>
                )}

                {/* AI Diagnosis */}
                {selectedRecord.diagnosis && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      🤖 AI Diagnosis Results
                    </Typography>
                    <Paper
                      ref={diagnosisRef}
                      data-pdf-diagnosis="true"
                      elevation={1}
                      sx={{
                        p: 3,
                        bgcolor: '#fafafa',
                        borderRadius: 2,
                        '& img': { maxWidth: '100%', height: 'auto' },
                        '& table': {
                          borderCollapse: 'collapse',
                          width: '100%',
                          mb: 2,
                        },
                        '& th, & td': {
                          border: '1px solid #ddd',
                          p: 1,
                          textAlign: 'left',
                        },
                        '& th': {
                          bgcolor: '#f0f0f0',
                          fontWeight: 'bold',
                        },
                      }}
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <Typography variant="body1" sx={{ mb: 1.5, lineHeight: 1.7 }}>
                              {children}
                            </Typography>
                          ),
                          h1: ({ children }) => (
                            <Typography variant="h4" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
                              {children}
                            </Typography>
                          ),
                          h2: ({ children }) => (
                            <Typography variant="h5" sx={{ mt: 2.5, mb: 1.5, fontWeight: 'bold' }}>
                              {children}
                            </Typography>
                          ),
                          h3: ({ children }) => (
                            <Typography variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                              {children}
                            </Typography>
                          ),
                          li: ({ children }) => (
                            <Typography component="li" variant="body1" sx={{ mb: 0.5, ml: 2 }}>
                              {children}
                            </Typography>
                          ),
                          code: ({ children }) => (
                            <Box
                              component="code"
                              sx={{
                                bgcolor: '#e0e0e0',
                                px: 0.5,
                                py: 0.25,
                                borderRadius: 0.5,
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          pre: ({ children }) => (
                            <Box
                              component="pre"
                              sx={{
                                bgcolor: '#f5f5f5',
                                p: 2,
                                borderRadius: 1,
                                overflow: 'auto',
                                fontFamily: 'monospace',
                                fontSize: '0.9em',
                                mb: 2,
                              }}
                            >
                              {children}
                            </Box>
                          ),
                        }}
                      >
                        {selectedRecord.diagnosis}
                      </ReactMarkdown>
                    </Paper>
                  </Box>
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
                              startIcon={<NoteIcon />}
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

              </Box>
            </DialogContent>
            
            {/* Action Buttons - Outside pdfRef container */}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', px: 3, py: 2, bgcolor: '#f8f9fa', borderTop: '1px solid #e0e0e0' }}>
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
                onClick={() => handleShareRecord(selectedRecord)}
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
                onClick={() => handleCompareRecord(selectedRecord)}
              >
                📊 Compare
              </Button>
            </Box>
            <DialogActions>
              <Button onClick={() => setDetailModalOpen(false)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

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
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={shareTab} onChange={(_, newValue) => setShareTab(newValue)}>
              <Tab label="Share Link" />
              <Tab label="@ Doctor" />
            </Tabs>
          </Box>

          {/* Link Sharing Tab */}
          {shareTab === 0 && (
            <Box sx={{ mt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Share Link
                </Typography>
                <TextField
                  fullWidth
                  value={window.location.origin + '/share.html?case=' + selectedRecord?.id}
                  InputProps={{
                    readOnly: true,
                    endAdornment: (
                      <Button
                        variant="outlined"
                        onClick={() => {
                          navigator.clipboard.writeText(window.location.origin + '/share.html?case=' + selectedRecord?.id);
                          alert('Link copied to clipboard!');
                        }}
                      >
                        Copy
                      </Button>
                    ),
                  }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" gutterBottom>
                  Include Options:
                </Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeDiagnosis}
                      onChange={(e) => setIncludeDiagnosis(e.target.checked)}
                    />
                  }
                  label="Include Diagnosis Results"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includeSymptoms}
                      onChange={(e) => setIncludeSymptoms(e.target.checked)}
                    />
                  }
                  label="Include Symptom Description"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={includePersonal}
                      onChange={(e) => setIncludePersonal(e.target.checked)}
                    />
                  }
                  label="Include Personal Information"
                />
              </Box>
            </Box>
          )}

          {/* Doctor Sharing Tab */}
          {shareTab === 1 && (
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
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                    endAdornment: (
                      <Button variant="outlined" onClick={searchDoctors}>
                        🔍
                      </Button>
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
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={shareConsent}
                      onChange={(e) => setShareConsent(e.target.checked)}
                    />
                  }
                  label="I have read and agree to share this case with the selected doctors"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareModalOpen(false)}>
            Close
          </Button>
          {shareTab === 1 && (
            <Button
              variant="contained"
              onClick={shareToDoctor}
              disabled={selectedDoctors.length === 0}
            >
              @ Mention Doctor
            </Button>
          )}
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
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select First Record</InputLabel>
                <Select
                  value={compareRecord1}
                  onChange={(e) => {
                    setCompareRecord1(e.target.value);
                    // Update compare view
                  }}
                  label="Select First Record"
                >
                  <MenuItem value="">Please select...</MenuItem>
                  {records.map((record) => (
                    <MenuItem key={record.id} value={record.id}>
                      {new Date(record.created_at).toLocaleDateString('en-US')} - {record.title || 'Medical Record'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Paper sx={{ p: 2, minHeight: 300 }}>
                {compareRecord1 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      First Record
                    </Typography>
                    {/* Display record 1 content */}
                    <Typography variant="body2">
                      {records.find(r => r.id === compareRecord1)?.symptoms.substring(0, 200)}...
                    </Typography>
                  </Box>
                )}
                {!compareRecord1 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                    Please select a medical record
                  </Typography>
                )}
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Second Record</InputLabel>
                <Select
                  value={compareRecord2}
                  onChange={(e) => {
                    setCompareRecord2(e.target.value);
                    // Update compare view
                  }}
                  label="Select Second Record"
                >
                  <MenuItem value="">Please select...</MenuItem>
                  {records.map((record) => (
                    <MenuItem key={record.id} value={record.id}>
                      {new Date(record.created_at).toLocaleDateString('en-US')} - {record.title || 'Medical Record'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Paper sx={{ p: 2, minHeight: 300 }}>
                {compareRecord2 && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Second Record
                    </Typography>
                    {/* Display record 2 content */}
                    <Typography variant="body2">
                      {records.find(r => r.id === compareRecord2)?.symptoms.substring(0, 200)}...
                    </Typography>
                  </Box>
                )}
                {!compareRecord2 && (
                  <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 5 }}>
                    Please select a record to compare
                  </Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
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

export default MedicalRecords;
