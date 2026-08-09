import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
  Stack,
  Alert,
} from '@mui/material';
import {
  Translate,
  PictureAsPdf,
  MenuBook,
  CheckCircle,
  AutoAwesome,
  LocalHospital,
} from '@mui/icons-material';
import { useLocation } from 'react-router-dom';
import {
  translatePrescriptionText,
  TranslatedPrescription,
  MEDICAL_SHORTHANDS,
} from '../../services/translationService';
import { useLanguage, SUPPORTED_LANGUAGES, LanguageCode } from '../../contexts/LanguageContext';

export const PrescriptionTranslator: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const location = useLocation();
  const ocrInputData = location.state?.ocrData;

  const [patientName, setPatientName] = useState(ocrInputData?.patientName || 'Johnathan Vance');
  const [doctorName, setDoctorName] = useState(ocrInputData?.doctorName || 'Dr. Sarah Jenkins, MD');
  const [diagnosis, setDiagnosis] = useState(ocrInputData?.diagnosis || 'Hypertension & Hyperlipidemia');
  const [targetLang, setTargetLang] = useState<LanguageCode>(language || 'te');
  const [loading, setLoading] = useState(false);
  const [translatedResult, setTranslatedResult] = useState<TranslatedPrescription | null>(null);
  const [showShorthandGuide, setShowShorthandGuide] = useState(false);

  const medications = ocrInputData?.medications || [
    { name: 'Amoxicillin 500mg', dosage: '1 tablet', frequency: 'b.i.d. (twice daily)', duration: '7 days', instructions: 'Take p.o. after meals' },
    { name: 'Atorvastatin 20mg', dosage: '1 tablet', frequency: 'h.s. (at bedtime)', duration: '30 days', instructions: 'Take p.o. before sleep' },
    { name: 'Metformin 850mg', dosage: '1 tablet', frequency: 'b.i.d. (twice daily)', duration: '30 days', instructions: 'Take p.o. with food' },
  ];

  const handleTranslate = async () => {
    setLoading(true);
    try {
      const res = await translatePrescriptionText(medications, patientName, doctorName, diagnosis, targetLang);
      setTranslatedResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (language && language !== targetLang) {
      setTargetLang(language);
    }
  }, [language]);

  useEffect(() => {
    handleTranslate();
  }, [targetLang]);

  const handleLanguageChange = (newLang: LanguageCode) => {
    setTargetLang(newLang);
    setLanguage(newLang);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          color: '#fff',
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(16, 185, 129, 0.25)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <Translate sx={{ fontSize: 36, color: '#fef08a' }} />
            <Typography variant="h4" fontWeight={700} color="#fff">
              {t('translatorTitle')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 850 }}>
            {t('translatorSub')}
          </Typography>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Left Side: Prescription Input & Language Control */}
        <Grid item xs={12} md={5}>
          <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} mb={2}>
                {t('selectLanguage')} & Prescription Inputs
              </Typography>

              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="target-lang-label">{t('selectLanguage')}</InputLabel>
                  <Select
                    labelId="target-lang-label"
                    value={targetLang}
                    label={t('selectLanguage')}
                    onChange={(e) => handleLanguageChange(e.target.value as LanguageCode)}
                    sx={{ borderRadius: 2 }}
                  >
                    {SUPPORTED_LANGUAGES.map((l) => (
                      <MenuItem key={l.code} value={l.code}>
                        {l.flag} {l.nativeName} ({l.name})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label={t('patientName')}
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label={t('doctorName')}
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  size="small"
                  fullWidth
                />
                <TextField
                  label={t('diagnosis')}
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  size="small"
                  fullWidth
                />

                <Divider sx={{ my: 1 }} />

                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2" fontWeight={700}>
                    Medication List ({medications.length})
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<MenuBook />}
                    onClick={() => setShowShorthandGuide(!showShorthandGuide)}
                  >
                    {showShorthandGuide ? 'Hide Decoder Guide' : 'Shorthand Decoder Guide'}
                  </Button>
                </Stack>

                {medications.map((med: { name: string; dosage: string; frequency: string; duration: string }, index: number) => (
                  <Box
                    key={index}
                    sx={{
                      p: 1.5,
                      border: '1px solid #e2e8f0',
                      borderRadius: 2,
                      bgcolor: '#f8fafc',
                    }}
                  >
                    <Typography variant="body2" fontWeight={600} color="primary.main">
                      {med.name} - {med.dosage}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Freq: {med.frequency} | Dur: {med.duration}
                    </Typography>
                  </Box>
                ))}

                <Button
                  variant="contained"
                  color="success"
                  startIcon={<AutoAwesome />}
                  onClick={handleTranslate}
                  disabled={loading}
                  sx={{ borderRadius: 2, py: 1.2, mt: 1 }}
                >
                  {loading ? 'Translating Prescription...' : t('translateButton')}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Shorthand Decoder Quick Reference */}
          {showShorthandGuide && (
            <Card sx={{ mt: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
                  📚 Prescription Shorthand Dictionary
                </Typography>
                <Stack spacing={1}>
                  {MEDICAL_SHORTHANDS.map((item) => (
                    <Box key={item.code} sx={{ p: 1, borderBottom: '1px solid #f1f5f9' }}>
                      <Typography variant="caption" fontWeight={700} color="secondary.main">
                        {item.code} ({item.latinMeaning})
                      </Typography>
                      <Typography variant="body2" color="text.primary">
                        {item.englishMeaning}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Right Side: Localized Translated Prescription Output */}
        <Grid item xs={12} md={7}>
          {translatedResult && (
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CheckCircle color="success" />
                    <Typography variant="h6" fontWeight={700}>
                      Translated Medical Prescription Card
                    </Typography>
                  </Stack>
                  <Chip
                    label={`Language: ${
                      SUPPORTED_LANGUAGES.find((l) => l.code === targetLang)?.nativeName || targetLang
                    }`}
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600 }}
                  />
                </Stack>

                <Alert severity="info" icon={<LocalHospital />} sx={{ mb: 3, borderRadius: 2 }}>
                  Medical Shorthand Shorthand Explanations are decoded below for easy patient comprehension.
                </Alert>

                <Grid container spacing={2} mb={3}>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('patientName')}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {translatedResult.patientName}
                    </Typography>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('doctorName')}
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {translatedResult.doctorName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary">
                      {t('diagnosis')}
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="primary.main">
                      {translatedResult.diagnosis}
                    </Typography>
                  </Grid>
                </Grid>

                <Typography variant="subtitle1" fontWeight={700} mb={1}>
                  Translated Medications & Clear Dose Instructions
                </Typography>

                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                  <Table>
                    <TableHead sx={{ bgcolor: '#ecfdf5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>{t('medicationName')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('frequency')} (Translated)</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>{t('duration')}</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Decoded Medical Shorthand</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {translatedResult.translatedMedications.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {item.name} ({item.dosage})
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.instructionsTranslated}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip label={item.frequencyTranslated} color="success" size="small" />
                          </TableCell>
                          <TableCell>{item.durationTranslated}</TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                              {item.shorthandNotes}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ p: 2, bgcolor: '#fef3c7', borderRadius: 2, borderLeft: '4px solid #f59e0b', mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} color="#92400e">
                    ⚠️ Doctor Advice & Storage Warning:
                  </Typography>
                  <Typography variant="body2" color="#78350f" mt={0.5}>
                    {translatedResult.generalAdvice}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<PictureAsPdf />}
                    sx={{ borderRadius: 2, flex: 1 }}
                    onClick={() => alert('PDF Translated Prescription Downloaded!')}
                  >
                    {t('downloadPdf')}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default PrescriptionTranslator;
