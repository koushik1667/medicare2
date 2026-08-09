import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Divider,
  Stack,
} from '@mui/material';
import {
  CloudUpload,
  CameraAlt,
  Speed,
  Translate,
  PictureAsPdf,
  MedicalServices,
  VerifiedUser,
  AutoAwesome,
} from '@mui/icons-material';
import { processPrescriptionImage, PrescriptionOCRResult } from '../../services/ocrService';
import { useLanguage } from '../../contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

export const PrescriptionScanner: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<PrescriptionOCRResult | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        runOcrScan(file);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadSamplePrescription = () => {
    // Demo medical prescription image preview
    setImagePreview('https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80');
    runOcrScan('sample_prescription.jpg');
  };

  const runOcrScan = async (file: File | string) => {
    setLoading(true);
    try {
      const result = await processPrescriptionImage(file);
      setOcrResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
          color: '#fff',
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(79, 70, 229, 0.25)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <AutoAwesome sx={{ fontSize: 36, color: '#fbbf24' }} />
            <Typography variant="h4" fontWeight={700} color="#fff">
              {t('ocrScannerTitle')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 800 }}>
            {t('ocrScannerSub')} Powered by TrOCR Vision models and MediScribe regex entity extractors.
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Side: Upload & Scan Control */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Prescription Image Upload
              </Typography>

              <Box
                sx={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: 3,
                  p: 3,
                  textAlign: 'center',
                  bgcolor: '#f8fafc',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  '&:hover': { borderColor: '#6366f1', bgcolor: '#f1f5f9' },
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  id="prescription-file-input"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label htmlFor="prescription-file-input" style={{ cursor: 'pointer' }}>
                  <CloudUpload sx={{ fontSize: 48, color: '#6366f1', mb: 1 }} />
                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                    Click to upload or drag & drop photo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Supports JPG, PNG, WEBP, TIFF (Max 16MB)
                  </Typography>
                </label>
              </Box>

              <Stack direction="row" spacing={2} mt={2}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<CameraAlt />}
                  onClick={loadSamplePrescription}
                  sx={{ borderRadius: 2 }}
                >
                  Load Sample Prescription
                </Button>
              </Stack>

              {imagePreview && (
                <Box mt={3} sx={{ position: 'relative' }}>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Scanned Image Preview & Bounding Regions
                  </Typography>
                  <Box
                    sx={{
                      position: 'relative',
                      borderRadius: 2,
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0',
                      maxHeight: 380,
                      display: 'flex',
                      justifyContent: 'center',
                      bgcolor: '#0f172a',
                    }}
                  >
                    <img
                      src={imagePreview}
                      alt="Prescription Scan"
                      style={{ width: '100%', objectFit: 'contain', opacity: loading ? 0.4 : 1 }}
                    />
                    {loading && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center',
                          color: '#fff',
                        }}
                      >
                        <CircularProgress color="inherit" size={48} />
                        <Typography variant="body2" mt={1} fontWeight={600}>
                          AI Extracting Medical Entities...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Right Side: OCR Digitized Results */}
        <Grid item xs={12} md={7}>
          {ocrResult ? (
            <Stack spacing={3}>
              {/* Digitizer Summary Header */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VerifiedUser sx={{ color: '#10b981' }} />
                      <Typography variant="h6" fontWeight={700}>
                        OCR Digitization Report
                      </Typography>
                    </Stack>
                    <Chip
                      icon={<Speed />}
                      label={`${ocrResult.overallConfidence}% ${t('confidenceScore')}`}
                      color="success"
                      variant="filled"
                      sx={{ fontWeight: 600 }}
                    />
                  </Stack>

                  <Grid container spacing={2} mb={2}>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('patientName')}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {ocrResult.patientName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('doctorName')}
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {ocrResult.doctorName}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        Date
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {ocrResult.date}
                      </Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography variant="caption" color="text.secondary">
                        {t('diagnosis')}
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary.main">
                        {ocrResult.diagnosis}
                      </Typography>
                    </Grid>
                  </Grid>

                  <Divider sx={{ my: 2 }} />

                  {/* Extracted Medications Table */}
                  <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                    {t('extractedMedications')} ({ocrResult.medications.length})
                  </Typography>

                  <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 600 }}>{t('medicationName')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('dosageInstructions')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('frequency')}</TableCell>
                          <TableCell sx={{ fontWeight: 600 }}>{t('duration')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ocrResult.medications.map((med) => (
                          <TableRow key={med.id} hover>
                            <TableCell>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <MedicalServices sx={{ fontSize: 18, color: '#4f46e5' }} />
                                <Typography variant="body2" fontWeight={600}>
                                  {med.name}
                                </Typography>
                              </Stack>
                            </TableCell>
                            <TableCell>{med.dosage}</TableCell>
                            <TableCell>
                              <Chip label={med.frequency} size="small" color="primary" variant="outlined" />
                            </TableCell>
                            <TableCell>{med.duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Action Buttons */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={3}>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<Translate />}
                      onClick={() =>
                        navigate('/patient/prescription-translator', {
                          state: { ocrData: ocrResult },
                        })
                      }
                      sx={{ borderRadius: 2, flex: 1, py: 1.2 }}
                    >
                      {t('translateButton')} (Regional/Global)
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<PictureAsPdf />}
                      sx={{ borderRadius: 2, flex: 1, py: 1.2 }}
                      onClick={() => alert('PDF export generated for prescription')}
                    >
                      {t('downloadPdf')}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>

              {/* Raw OCR Text Log */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="subtitle2" fontWeight={600} mb={1}>
                    Raw Text Stream (MediScribe OCR Engine Output)
                  </Typography>
                  <Box
                    sx={{
                      p: 2,
                      bgcolor: '#1e293b',
                      color: '#38bdf8',
                      fontFamily: 'monospace',
                      fontSize: '0.85rem',
                      borderRadius: 2,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {ocrResult.rawText}
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Card
              sx={{
                p: 5,
                textAlign: 'center',
                borderRadius: 3,
                border: '2px dashed #e2e8f0',
                bgcolor: '#fafafa',
              }}
            >
              <MedicalServices sx={{ fontSize: 64, color: '#94a3b8', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={600}>
                No Prescription Scanned Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" mt={1}>
                Upload a medical prescription image on the left or click "Load Sample Prescription" to view the AI OCR Digitizer in action.
              </Typography>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrescriptionScanner;
