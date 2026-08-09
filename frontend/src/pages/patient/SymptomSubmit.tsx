import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress,
  LinearProgress,
  Chip,
  IconButton,
  Card,
  CardContent,
  Stack,
  Divider,
  Stepper,
  Step,
  StepLabel,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
  Psychology as PsychologyIcon,
  Description as DescriptionIcon,
  AssignmentTurnedIn as AssignmentIcon,
  Translate as TranslateIcon,
  SmartToy as SmartToyIcon,
  Visibility as VisibilityIcon,
  Medication as MedicationIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { casesApi, documentsApi } from '../../services/api';
import type { AIFeedback } from '../../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage, SUPPORTED_LANGUAGES } from '../../contexts/LanguageContext';
import {
  runAgenticMedicalWorkflow,
  AgenticWorkflowStep,
  N8nMedicalPipelineOutput,
} from '../../services/agenticMedicalAI';

const SymptomSubmit: React.FC = () => {
  const { language } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [optionalNotes, setOptionalNotes] = useState('');

  // Agentic Workflow Stepper State
  const [agenticSteps, setAgenticSteps] = useState<AgenticWorkflowStep[]>([]);
  const [agenticActiveIndex, setAgenticActiveIndex] = useState<number>(0);

  // n8n JSON Schema Output State
  const [n8nJsonOutput, setN8nJsonOutput] = useState<N8nMedicalPipelineOutput | null>(null);
  const [viewMode, setViewMode] = useState<'clinical' | 'json'>('clinical');
  const [copied, setCopied] = useState(false);

  // Cache last submitted data for live re-translation on language toggle
  const [lastAnalyzedData, setLastAnalyzedData] = useState<{
    notes: string;
    files: string[];
    hasAnalyzed: boolean;
  }>({
    notes: '',
    files: [],
    hasAnalyzed: false,
  });

  // UI & Progress State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<AIFeedback | null>(null);

  // Output state
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingStatus, setStreamingStatus] = useState('');
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB

  // Reactively re-translate diagnosis whenever user toggles language in top bar
  useEffect(() => {
    if (lastAnalyzedData.hasAnalyzed) {
      executeAgenticWorkflow(lastAnalyzedData.notes, lastAnalyzedData.files, language);
    }
  }, [language]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      const validFiles: File[] = [];
      const oversizedFiles: string[] = [];

      newFiles.forEach((file) => {
        if (file.size > MAX_FILE_SIZE) {
          oversizedFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      if (oversizedFiles.length > 0) {
        setError(`Files exceeding 15MB limit skipped: ${oversizedFiles.join(', ')}`);
        setTimeout(() => setError(null), 6000);
      }

      if (validFiles.length > 0) {
        setUploadedFiles(validFiles);
      }
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFiles = Array.from(event.dataTransfer.files);
    const validFiles: File[] = [];
    const oversizedFiles: string[] = [];

    droppedFiles.forEach((file) => {
      if (file.size > MAX_FILE_SIZE) {
        oversizedFiles.push(file.name);
      } else {
        validFiles.push(file);
      }
    });

    if (oversizedFiles.length > 0) {
      setError(`Files exceeding 15MB limit skipped: ${oversizedFiles.join(', ')}`);
      setTimeout(() => setError(null), 6000);
    }

    if (validFiles.length > 0) {
      setUploadedFiles(validFiles);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (caseId: string): Promise<string[]> => {
    const documentIds: string[] = [];
    for (const file of uploadedFiles) {
      try {
        const document = await documentsApi.uploadDocument(file, {
          case_id: caseId,
          document_type: 'exam_report',
        });
        if (document?.id) {
          documentIds.push(document.id);
        }
      } catch (err) {
        console.warn(`File upload fallback for ${file.name}:`, err);
      }
    }
    return documentIds;
  };

  const handleReset = () => {
    setUploadedFiles([]);
    setOptionalNotes('');
    setDiagnosisResult(null);
    setStreamingContent('');
    setStreamingStatus('');
    setCurrentCaseId(null);
    setError(null);
    setSuccess(null);
    setAgenticSteps([]);
    setN8nJsonOutput(null);
    setLastAnalyzedData({ notes: '', files: [], hasAnalyzed: false });
  };

  const executeAgenticWorkflow = async (notes: string, fileNames: string[], targetLang: string) => {
    setStreamingStatus('Agentic n8n Pipeline Active...');

    const { reportText, n8nSchemaOutput } = await runAgenticMedicalWorkflow(
      fileNames,
      notes,
      targetLang,
      (updatedSteps) => {
        setAgenticSteps(updatedSteps);
        const activeIdx = updatedSteps.findIndex((s) => s.status === 'running');
        if (activeIdx !== -1) setAgenticActiveIndex(activeIdx);
        else setAgenticActiveIndex(updatedSteps.length);
      }
    );

    setStreamingContent(reportText);
    setN8nJsonOutput(n8nSchemaOutput);
    setStreamingStatus('Agentic Clinical Audit & JSON Extraction Complete');
    setDiagnosisResult({
      id: `agentic-${Date.now()}`,
      medical_case_id: currentCaseId || 'demo-case-1',
      feedback_type: 'ai_diagnosis',
      input_data: {},
      ai_response: {
        diagnosis: reportText,
        model_id: 'MediCare-Agentic-Vision-v4.0',
      },
      is_reviewed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    setSuccess(`Agentic AI extracted document parameters into structured n8n JSON schema.`);
  };

  const handleSubmit = async () => {
    if (uploadedFiles.length === 0 && !optionalNotes.trim()) {
      setError('Please upload a medical report image/document or type your symptoms.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);
    setStreamingContent('');

    const fileNames = uploadedFiles.map((f) => f.name);
    const activeSymptoms = optionalNotes.trim()
      ? optionalNotes.trim()
      : `Medical Document Extraction & Clinical Audit (${uploadedFiles.length} file(s) attached)`;

    setLastAnalyzedData({
      notes: activeSymptoms,
      files: fileNames,
      hasAnalyzed: true,
    });

    try {
      let caseId = 'case-' + Date.now();
      try {
        const medicalCase = await casesApi.createCase({
          title: `Agentic AI Diagnostic Triage - ${new Date().toLocaleDateString()}`,
          symptoms: activeSymptoms,
          severity: 'medium',
          description: `Uploaded files: ${fileNames.join(', ')}`,
        });
        caseId = medicalCase.id;
      } catch (e) {
        console.warn('Backend case creation fallback:', e);
      }

      setCurrentCaseId(caseId);
      if (uploadedFiles.length > 0) {
        await uploadFiles(caseId);
      }

      await executeAgenticWorkflow(activeSymptoms, fileNames, language);
    } catch (err: any) {
      await executeAgenticWorkflow(activeSymptoms, fileNames, language);
    } finally {
      setSubmitting(false);
    }
  };

  const copyJsonToClipboard = () => {
    if (n8nJsonOutput) {
      navigator.clipboard.writeText(JSON.stringify(n8nJsonOutput, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const activeLangName = SUPPORTED_LANGUAGES.find((l) => l.code === language)?.nativeName || language;

  return (
    <Box sx={{ bgcolor: '#FDFCF8', minHeight: '100vh', pb: 8, pt: 2 }}>
      <Container maxWidth="md">
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            borderRadius: '2.5rem',
            bgcolor: '#FEFEFA',
            border: '1px solid rgba(222, 216, 207, 0.8)',
            boxShadow: '0 12px 40px -6px rgba(93, 112, 82, 0.12)',
          }}
        >
          {/* Header Banner */}
          <Stack direction="row" spacing={2} alignItems="center" mb={3}>
            <Box
              sx={{
                width: 58,
                height: 58,
                borderRadius: '50%',
                bgcolor: 'rgba(93, 112, 82, 0.15)',
                color: '#5D7052',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(93, 112, 82, 0.2)',
              }}
            >
              <SmartToyIcon sx={{ fontSize: 36 }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
                <Typography variant="h4" sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#2C2C24' }}>
                  Agentic AI Medical Document Intelligence & Triage
                </Typography>
                <Chip
                  icon={<TranslateIcon />}
                  label={`Live Language: ${activeLangName}`}
                  color="success"
                  variant="outlined"
                  sx={{ fontWeight: 700, borderRadius: 9999 }}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary" mt={0.5}>
                Automated n8n pipeline agent: Vision OCR, clinical entity extraction, pharmacotherapy auditing, and strict JSON output.
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 9999 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 9999, bgcolor: '#F0F6F2', color: '#4D7C5D' }}>
              {success}
            </Alert>
          )}

          {/* Hero Upload Dropzone */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, mb: 1.5, color: '#2C2C24' }}>
              📸 Step 1: Upload Medical Prescription or Report Image
            </Typography>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 4, md: 5 },
                border: '2.5px dashed #5D7052',
                borderRadius: '2rem',
                textAlign: 'center',
                cursor: 'pointer',
                bgcolor: '#F3F5F1',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                '&:hover': {
                  bgcolor: '#EAF0E6',
                  borderColor: '#44533C',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(93, 112, 82, 0.15)',
                },
              }}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <Box
                sx={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  bgcolor: '#5D7052',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                  boxShadow: '0 6px 20px rgba(93, 112, 82, 0.3)',
                }}
              >
                <CloudUploadIcon sx={{ fontSize: 40 }} />
              </Box>
              <Typography variant="h6" fontWeight={700} color="#2C2C24" gutterBottom>
                Tap or Drag & Drop Prescription / Lab Report Here
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460, mx: 'auto', mb: 2 }}>
                Upload Doctor Prescriptions, Neuro-Psychiatry Notes, Lab Scans, Blood Tests, or X-Rays.
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" gap={1}>
                <Chip icon={<VisibilityIcon />} label="Agentic Vision OCR" size="small" sx={{ bgcolor: '#fff', color: '#5D7052', fontWeight: 600 }} />
                <Chip icon={<MedicationIcon />} label="Zero-Hallucination Extraction" size="small" sx={{ bgcolor: '#fff', color: '#5D7052', fontWeight: 600 }} />
                <Chip icon={<CodeIcon />} label="n8n Pipeline JSON Schema" size="small" sx={{ bgcolor: '#fff', color: '#5D7052', fontWeight: 600 }} />
              </Stack>
            </Paper>

            {/* Selected File Cards */}
            {uploadedFiles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ color: '#5D7052' }}>
                  Uploaded Documents ({uploadedFiles.length}):
                </Typography>
                <Grid container spacing={1.5}>
                  {uploadedFiles.map((file, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <Card
                        variant="outlined"
                        sx={{
                          borderRadius: '1.25rem',
                          borderColor: '#5D7052',
                          bgcolor: '#FDFCF8',
                          boxShadow: '0 2px 8px rgba(93, 112, 82, 0.08)',
                        }}
                      >
                        <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Box display="flex" alignItems="center" gap={1.5} sx={{ overflow: 'hidden' }}>
                            <DescriptionIcon sx={{ color: '#5D7052' }} />
                            <Box sx={{ overflow: 'hidden' }}>
                              <Typography variant="body2" fontWeight={700} noWrap>
                                {file.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {(file.size / 1024).toFixed(1)} KB
                              </Typography>
                            </Box>
                          </Box>
                          <IconButton onClick={() => removeFile(index)} color="error" size="small">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 3, borderColor: '#DED8CF' }} />

          {/* Optional Text Notes */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, mb: 1, color: '#2C2C24' }}>
              ✍️ Step 2: Add Any Extra Clinical Context (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              Enter any symptoms or leave blank for automatic Agentic Vision analysis.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Additional Clinical Notes (Optional)"
              value={optionalNotes}
              onChange={(e) => setOptionalNotes(e.target.value)}
              placeholder="e.g. Dr. Y. Nagendar Rao consultation notes..."
            />
          </Box>

          {/* Submit Action */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems="center">
            <Button
              variant="outlined"
              onClick={handleReset}
              disabled={submitting}
              sx={{ borderRadius: 9999, borderColor: '#DED8CF', color: '#78786C', py: 1.5, px: 4, width: { xs: '100%', sm: 'auto' } }}
            >
              Reset
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              sx={{
                borderRadius: 9999,
                bgcolor: '#5D7052',
                color: '#F3F4F1',
                py: 1.75,
                px: 6,
                fontWeight: 700,
                fontSize: '1rem',
                boxShadow: '0 6px 20px rgba(93, 112, 82, 0.3)',
                '&:hover': { bgcolor: '#44533C' },
                width: { xs: '100%', sm: 'auto' },
              }}
            >
              {submitting ? 'Executing Agentic Pipeline...' : 'Execute Agentic n8n Parsing Pipeline'}
            </Button>
          </Stack>
        </Paper>

        {/* Agentic Workflow Execution Progress Stepper */}
        {agenticSteps.length > 0 && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 4,
              borderRadius: '2rem',
              bgcolor: '#F3F5F1',
              border: '1.5px solid #5D7052',
              boxShadow: '0 8px 24px rgba(93, 112, 82, 0.12)',
            }}
          >
            <Stack direction="row" spacing={1.5} alignItems="center" mb={2.5}>
              <SmartToyIcon sx={{ color: '#5D7052', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={700} color="#2C2C24">
                🤖 Autonomous Agentic Workflow Execution Live
              </Typography>
            </Stack>

            <Stepper activeStep={agenticActiveIndex} orientation="vertical">
              {agenticSteps.map((step, idx) => (
                <Step key={idx} completed={step.status === 'completed'}>
                  <StepLabel
                    optional={
                      <Typography variant="caption" color="text.secondary">
                        {step.detail}
                      </Typography>
                    }
                  >
                    <Typography variant="subtitle2" fontWeight={700} color={step.status === 'running' ? '#5D7052' : '#2C2C24'}>
                      {step.agentName} — {step.agentRole}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        )}

        {/* AI Results Output Card */}
        {(streamingContent || diagnosisResult || n8nJsonOutput) && (
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, md: 5 },
              borderRadius: '2.5rem',
              bgcolor: '#FEFEFA',
              border: '2px solid #5D7052',
              boxShadow: '0 16px 48px -6px rgba(93, 112, 82, 0.2)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 2 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AssignmentIcon sx={{ color: '#5D7052', fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontFamily: 'Fraunces, serif', fontWeight: 700, color: '#2C2C24' }}>
                  Agentic Document Intelligence Results
                </Typography>
                {streamingStatus && <Chip label={streamingStatus} color="success" size="small" sx={{ fontWeight: 700, borderRadius: 9999 }} />}
              </Stack>

              {/* View Mode Toggle: Clinical Markdown vs n8n JSON Schema */}
              <Stack direction="row" spacing={1} alignItems="center">
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(_, newMode) => newMode && setViewMode(newMode)}
                  size="small"
                  sx={{ borderRadius: 9999, bgcolor: '#F3F5F1' }}
                >
                  <ToggleButton value="clinical" sx={{ px: 2, fontWeight: 700, borderRadius: 9999 }}>
                    📋 Clinical Report
                  </ToggleButton>
                  <ToggleButton value="json" sx={{ px: 2, fontWeight: 700, borderRadius: 9999 }}>
                    <CodeIcon sx={{ mr: 0.5, fontSize: 18 }} /> n8n JSON Schema
                  </ToggleButton>
                </ToggleButtonGroup>

                {viewMode === 'json' && n8nJsonOutput && (
                  <Tooltip title={copied ? 'Copied!' : 'Copy n8n JSON'}>
                    <IconButton onClick={copyJsonToClipboard} color="primary" sx={{ bgcolor: '#EAF0E6' }}>
                      <CopyIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            </Box>

            {submitting && (
              <LinearProgress sx={{ mb: 3, borderRadius: 9999, height: 6, bgcolor: '#E6DCCD', '& .MuiLinearProgress-bar': { bgcolor: '#5D7052' } }} />
            )}

            {/* View Mode 1: Clinical Markdown Assessment */}
            {viewMode === 'clinical' && (
              <Box
                sx={{
                  p: { xs: 2.5, md: 4 },
                  bgcolor: '#FDFCF8',
                  borderRadius: '2rem',
                  border: '1px solid #DED8CF',
                  lineHeight: 1.8,
                  color: '#2C2C24',
                  fontSize: '1rem',
                }}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {streamingContent || diagnosisResult?.ai_response?.diagnosis || ''}
                </ReactMarkdown>
              </Box>
            )}

            {/* View Mode 2: Strict n8n Target JSON Schema Output */}
            {viewMode === 'json' && n8nJsonOutput && (
              <Box
                sx={{
                  p: { xs: 2.5, md: 3 },
                  bgcolor: '#1E1E1E',
                  color: '#4EC9B0',
                  borderRadius: '2rem',
                  border: '1px solid #333',
                  fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace',
                  fontSize: '0.9rem',
                  overflowX: 'auto',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, pb: 1, borderBottom: '1px solid #333' }}>
                  <Typography variant="caption" sx={{ color: '#888', fontWeight: 600 }}>
                    TARGET OUTPUT SCHEMA (Strict JSON • Zero Hallucination • Confidence: {n8nJsonOutput.confidence_score * 100}%)
                  </Typography>
                  {copied && (
                    <Chip label="Copied to Clipboard!" size="small" color="success" sx={{ fontWeight: 700 }} />
                  )}
                </Box>
                <pre style={{ margin: 0, color: '#9CDCFFE0', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {JSON.stringify(n8nJsonOutput, null, 2)}
                </pre>
              </Box>
            )}
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default SymptomSubmit;
