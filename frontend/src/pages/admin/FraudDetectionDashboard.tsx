import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Chip,
  Alert,
  LinearProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Security,
  Search,
  CheckCircle,
  AssignmentTurnedIn,
  Gavel,
} from '@mui/icons-material';
import {
  analyzeProviderNpi,
  ProviderFraudAnalysis,
  SAMPLE_PROVIDERS,
} from '../../services/fraudDetectionService';
import { useLanguage } from '../../contexts/LanguageContext';

export const FraudDetectionDashboard: React.FC = () => {
  const { t } = useLanguage();
  const [npiInput, setNpiInput] = useState('1043298711');
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ProviderFraudAnalysis | null>(null);

  const runAnalysis = async (query: string) => {
    setLoading(true);
    try {
      const res = await analyzeProviderNpi(query);
      setAnalysisResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis(npiInput);
  }, []);

  const getRiskColor = (category: string) => {
    switch (category) {
      case 'Critical Fraud Alert':
        return 'error';
      case 'High Risk':
        return 'warning';
      case 'Moderate Risk':
        return 'info';
      default:
        return 'success';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1280, margin: '0 auto' }}>
      {/* Header Banner */}
      <Card
        sx={{
          mb: 4,
          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
          color: '#fff',
          borderRadius: 4,
          boxShadow: '0 10px 30px rgba(220, 38, 38, 0.25)',
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 4 } }}>
          <Stack direction="row" spacing={2} alignItems="center" mb={1}>
            <Security sx={{ fontSize: 36, color: '#fef08a' }} />
            <Typography variant="h4" fontWeight={700} color="#fff">
              {t('fraudTitle')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 850 }}>
            {t('fraudSub')} Machine learning compliance system based on LEIE exclusions, CMS Part D opioid datasets, and provider billing anomaly ratios.
          </Typography>
        </CardContent>
      </Card>

      {/* NPI Search & Preset Selector */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  label="Enter Provider NPI or Name"
                  value={npiInput}
                  onChange={(e) => setNpiInput(e.target.value)}
                  placeholder="e.g. 1043298711"
                  sx={{ borderRadius: 2 }}
                />
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<Search />}
                  onClick={() => runAnalysis(npiInput)}
                  sx={{ borderRadius: 2, px: 3 }}
                >
                  Analyze
                </Button>
              </Stack>
            </Grid>

            <Grid item xs={12} md={7}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" gap={1}>
                <Typography variant="caption" fontWeight={600} color="text.secondary">
                  Sample Provider Audits:
                </Typography>
                {SAMPLE_PROVIDERS.map((p) => (
                  <Chip
                    key={p.npi}
                    label={`${p.providerName} (${p.riskCategory})`}
                    color={getRiskColor(p.riskCategory)}
                    variant={npiInput === p.npi ? 'filled' : 'outlined'}
                    onClick={() => {
                      setNpiInput(p.npi);
                      runAnalysis(p.npi);
                    }}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                ))}
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Analysis Output */}
      {loading ? (
        <Box textAlign="center" py={8}>
          <LinearProgress color="error" sx={{ mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Cross-referencing LEIE Federal Exclusions & Part D Prescribing Anomaly Models...
          </Typography>
        </Box>
      ) : analysisResult ? (
        <Grid container spacing={3}>
          {/* Provider Overview Card */}
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)', height: '100%' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>
                      {analysisResult.providerName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      NPI: {analysisResult.npi} | State: {analysisResult.state}
                    </Typography>
                  </Box>
                  <Chip
                    label={analysisResult.riskCategory}
                    color={getRiskColor(analysisResult.riskCategory)}
                    sx={{ fontWeight: 700 }}
                  />
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Typography variant="subtitle2" fontWeight={600} mb={1}>
                  Specialty & Federal Compliance Status
                </Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  {analysisResult.specialty}
                </Typography>

                {analysisResult.leieExcludedStatus ? (
                  <Alert severity="error" icon={<Gavel />} sx={{ borderRadius: 2, mb: 2 }}>
                    <strong>LEIE BLACKLIST MATCH!</strong> Excluded under Section 1128(a) of the Social Security Act.
                  </Alert>
                ) : (
                  <Alert severity="success" icon={<CheckCircle />} sx={{ borderRadius: 2, mb: 2 }}>
                    No active LEIE Federal Exclusion Match.
                  </Alert>
                )}

                {/* Fraud Risk Score Gauge */}
                <Box sx={{ mt: 3, p: 2.5, bgcolor: '#f8fafc', borderRadius: 3, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>
                    AI FRAUD RISK SCORE
                  </Typography>
                  <Typography
                    variant="h2"
                    fontWeight={800}
                    color={
                      analysisResult.fraudRiskScore > 75
                        ? '#dc2626'
                        : analysisResult.fraudRiskScore > 50
                        ? '#ea580c'
                        : '#16a34a'
                    }
                  >
                    {analysisResult.fraudRiskScore}
                    <Typography component="span" variant="h5">
                      /100
                    </Typography>
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={analysisResult.fraudRiskScore}
                    color={getRiskColor(analysisResult.riskCategory)}
                    sx={{ height: 8, borderRadius: 4, mt: 1 }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Metrics & Anomaly Breakdown */}
          <Grid item xs={12} md={8}>
            <Stack spacing={3}>
              {/* Metric Stat Cards */}
              <Grid container spacing={2}>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 3, bgcolor: '#f8fafc', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Medicare Patients
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {analysisResult.totalBeneficiaries.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 3, bgcolor: '#f8fafc', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Total Prescriptions
                      </Typography>
                      <Typography variant="h6" fontWeight={700}>
                        {analysisResult.totalClaims.toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 3, bgcolor: '#f8fafc', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Opioid Prescribing %
                      </Typography>
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        color={analysisResult.opioidPrescribingRate > 30 ? 'error.main' : 'text.primary'}
                      >
                        {analysisResult.opioidPrescribingRate}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Card sx={{ borderRadius: 3, bgcolor: '#f8fafc', boxShadow: 'none' }}>
                    <CardContent sx={{ p: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Billed vs Paid
                      </Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ${(analysisResult.totalSubmittedCharges / 1000000).toFixed(2)}M
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Detected Anomalies List */}
              <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={700} mb={2}>
                    🚩 AI Detected Anomaly Flags
                  </Typography>

                  <Stack spacing={1.5}>
                    {analysisResult.anomalyFlags.map((flag, idx) => (
                      <Alert key={idx} severity={analysisResult.fraudRiskScore > 50 ? 'warning' : 'info'} sx={{ borderRadius: 2 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {flag}
                        </Typography>
                      </Alert>
                    ))}
                  </Stack>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="h6" fontWeight={700} mb={2}>
                    ⚖️ Recommended Enforcement Actions (HHS-OIG Protocol)
                  </Typography>

                  <Stack spacing={1}>
                    {analysisResult.recommendations.map((rec, idx) => (
                      <Stack key={idx} direction="row" spacing={1} alignItems="center">
                        <AssignmentTurnedIn color="error" fontSize="small" />
                        <Typography variant="body2" fontWeight={600}>
                          {rec}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Grid>
        </Grid>
      ) : null}
    </Box>
  );
};

export default FraudDetectionDashboard;
