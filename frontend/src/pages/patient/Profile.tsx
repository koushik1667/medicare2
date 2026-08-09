import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  LocalHospital as HospitalIcon,
  Description as DescriptionIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  EditNote as EditNoteIcon,
  Home as HomeIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { patientsApi, chronicDiseasesApi } from '../../services/api';
import type { Patient, PatientChronicCondition, ChronicDisease, PatientCreate } from '../../types';

const Profile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Chronic diseases state
  const [availableDiseases, setAvailableDiseases] = useState<ChronicDisease[]>([]);
  const [selectedDiseases, setSelectedDiseases] = useState<PatientChronicCondition[]>([]);
  const [diseaseId, setDiseaseId] = useState('');
  const [diseaseSeverity, setDiseaseSeverity] = useState('');
  const [diagnosisDate, setDiagnosisDate] = useState('');
  const [diseaseNotes, setDiseaseNotes] = useState('');

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUserProfile();
    loadDiseaseOptions();
    loadChronicDiseases();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Load user information
      if (user) {
        setEmail(user.email);
        setFullName(user.full_name || '');
      }
      
      // Load patient information
      const patientData = await patientsApi.getMe();
      
      if (patientData.date_of_birth) setDateOfBirth(patientData.date_of_birth);
      if (patientData.gender) setGender(patientData.gender);
      if (patientData.phone) setPhone(patientData.phone);
      
      // Parse emergency contact - 优先读取分离字段（问题1修复）
      if (patientData.emergency_contact_name || patientData.emergency_contact_phone) {
        // 使用分离的字段
        if (patientData.emergency_contact_name) setEmergencyContactName(patientData.emergency_contact_name);
        if (patientData.emergency_contact_phone) setEmergencyContactPhone(patientData.emergency_contact_phone);
      } else if (patientData.emergency_contact) {
        // 回退：解析组合字段（向后兼容）
        const parts = patientData.emergency_contact.split(' ');
        if (parts.length >= 1) setEmergencyContactName(parts[0]);
        if (parts.length >= 2) setEmergencyContactPhone(parts[1]);
      }
      
      if (patientData.address) setAddress(patientData.address);
    } catch (err) {
      console.error('Failed to load user info:', err);
      setError('Failed to load user information');
    } finally {
      setLoading(false);
    }
  };

  const loadDiseaseOptions = async () => {
    try {
      const response = await chronicDiseasesApi.getAll();
      const diseases = response.items || response;
      setAvailableDiseases(Array.isArray(diseases) ? diseases : []);
    } catch (err) {
      console.error('Failed to load disease list:', err);
      setAvailableDiseases([]);
    }
  };

  const loadChronicDiseases = async () => {
    try {
      const response = await patientsApi.getChronicDiseases();
      const diseases = response.items || response;
      setSelectedDiseases(Array.isArray(diseases) ? diseases : []);
    } catch (err) {
      console.error('Failed to load patient chronic diseases:', err);
      setSelectedDiseases([]);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all form content? Unsaved changes will be lost.')) {
      loadUserProfile();
      setSuccess('Form has been reset');
      setTimeout(() => setSuccess(null), 3000);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError('Name cannot be empty');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Update user information
      await patientsApi.updateMe({
        full_name: fullName,
      });

      // Update patient information
      const emergencyContact = `${emergencyContactName} ${emergencyContactPhone}`.trim();
      
      const patientData: PatientCreate = {
        date_of_birth: dateOfBirth || undefined,
        gender: gender || undefined,
        phone: phone || undefined,
        emergency_contact: emergencyContact || undefined,
        address: address || undefined,
        notes: notes || undefined,
      };

      try {
        await patientsApi.updateMe(patientData);
      } catch (updateError) {
        // If patient record doesn't exist, try to create
        if (updateError instanceof Error && updateError.message.includes('404')) {
          await patientsApi.create(patientData);
        } else {
          throw updateError;
        }
      }

      setSuccess('Profile saved successfully! Returning to home in 2 seconds...');
      setTimeout(() => {
        navigate('/patient');
      }, 2000);
    } catch (err) {
      console.error('Save failed:', err);
      setError('Save failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addChronicDisease = async () => {
    if (!diseaseId) {
      setError('Please select a condition');
      return;
    }

    try {
      await patientsApi.addChronicDisease({
        disease_id: diseaseId,
        diagnosis_date: diagnosisDate || undefined,
        severity: diseaseSeverity || undefined,
        notes: diseaseNotes || undefined,
      });

      // Clear form
      setDiseaseId('');
      setDiseaseSeverity('');
      setDiagnosisDate('');
      setDiseaseNotes('');

      // Reload list
      loadChronicDiseases();
      setSuccess('Condition added successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to add condition:', err);
      setError('Add failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const removeChronicDisease = async (conditionId: string) => {
    if (!window.confirm('Are you sure you want to delete this condition record?')) {
      return;
    }

    try {
      await patientsApi.deleteChronicDisease(conditionId);
      loadChronicDiseases();
      setSuccess('Condition record deleted');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to delete condition:', err);
      setError('Delete failed');
    }
  };

  const getSeverityLabel = (severity?: string) => {
    const labels: { [key: string]: string } = {
      'mild': 'Mild',
      'moderate': 'Moderate',
      'severe': 'Severe',
    };
    return labels[severity || ''] || severity;
  };

  const getDiseaseTypeColor = (type?: string) => {
    switch (type) {
      case 'special':
        return '#fff3cd';
      case 'chronic':
        return '#d1ecf1';
      case 'both':
        return '#f8d7da';
      default:
        return '#f8f9fa';
    }
  };

  const getDiseaseTypeLabel = (type?: string) => {
    switch (type) {
      case 'special':
        return 'Special Condition';
      case 'chronic':
        return 'Chronic Condition';
      case 'both':
        return 'Special + Chronic';
      default:
        return type;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Header */}
      <AppBar position="static" elevation={4}>
        <Toolbar sx={{ backgroundColor: 'white', color: '#333' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
            <HospitalIcon sx={{ fontSize: 32, mr: 2, color: '#667eea' }} />
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold', color: '#667eea' }}>
              MediCareAI
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

      {/* Navigation */}
      <Container maxWidth="lg" sx={{ mt: 2 }}>
        <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              startIcon={<HomeIcon />}
              onClick={() => navigate('/patient')}
              sx={{ borderRadius: 2 }}
            >
              Home
            </Button>
            <Button
              startIcon={<PersonIcon />}
              onClick={() => navigate('/patient/profile')}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Profile
            </Button>
            <Button
              startIcon={<EditNoteIcon />}
              onClick={() => navigate('/patient/symptom-submit')}
              sx={{ borderRadius: 2 }}
            >
              Symptom Submit
            </Button>
            <Button
              startIcon={<DescriptionIcon />}
              onClick={() => navigate('/patient/medical-records')}
              sx={{ borderRadius: 2 }}
            >
              Medical Records
            </Button>
            <Button
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              color="error"
              sx={{ borderRadius: 2 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>
      </Container>

      <Container maxWidth="lg">
        {/* Loading State */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && (
          <>
            {/* Account Information */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Account Information
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                 The following information is used for login and system identification. The email address cannot be modified.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={email}
                    disabled
                    helperText="Email is used for login and cannot be changed"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Basic Information */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Basic Information
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                 Please fill in your basic personal information to help us serve you better.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    type="date"
                    label="Date of Birth"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Gender</InputLabel>
                    <Select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      label="Gender"
                    >
                      <MenuItem value="">Please select</MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Emergency Contact */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Emergency Contact
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                 Please fill in emergency contact information; we will contact this person in case of emergency.
              </Alert>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Name"
                    value={emergencyContactName}
                    onChange={(e) => setEmergencyContactName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Emergency Contact Phone"
                    value={emergencyContactPhone}
                    onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Notes */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Additional Notes
              </Typography>
              
              <Alert severity="info" sx={{ mb: 3 }}>
                 You can record other important information that you need to share with your doctor here.
              </Alert>

              <TextField
                fullWidth
                multiline
                rows={4}
                label="Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Please describe other information to record, such as allergies, medical history, current medications, etc."
              />
            </Paper>

            {/* Address */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Address Information
              </Typography>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Residential Address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Please enter your full residential address"
              />
            </Paper>

            {/* Chronic Diseases */}
            <Paper elevation={3} sx={{ p: 4, mb: 3, borderRadius: 3 }}>
              <Typography variant="h5" gutterBottom>
                 Special & Chronic Disease Management
              </Typography>
              
              <Alert severity="warning" sx={{ mb: 3 }}>
                <strong>Important:</strong> If you have any special or chronic conditions, please fill them in truthfully. This will help the AI consider your medical history during diagnosis and avoid risks such as drug interactions.
              </Alert>

              {/* Selected Diseases */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  My Special / Chronic Conditions
                </Typography>
                {selectedDiseases.length === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ p: 2, fontStyle: 'italic' }}>
                    No records yet — select from below to add
                  </Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, p: 1, minHeight: 50 }}>
                    {selectedDiseases.map((condition) => {
                      const disease = condition.disease;
                      const diseaseName = disease?.common_names && disease.common_names.length > 0
                        ? disease.common_names[0]
                        : disease?.icd10_name || 'Unknown Condition';
                      const diseaseType = disease?.disease_type || 'unknown';
                      return (
                        <Chip
                          key={condition.id}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <span>{diseaseName}</span>
                              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                                ({getDiseaseTypeLabel(diseaseType)}
                                {condition.severity ? ` - ${getSeverityLabel(condition.severity)}` : ''})
                              </span>
                            </Box>
                          }
                          sx={{
                            bgcolor: getDiseaseTypeColor(diseaseType),
                            color: diseaseType === 'special' ? '#856404' :
                                   diseaseType === 'chronic' ? '#0c5460' : '#721c24',
                          }}
                          onDelete={() => removeChronicDisease(condition.id)}
                          deleteIcon={<DeleteIcon />}
                        />
                      );
                    })}
                  </Box>
                )}
              </Box>

              {/* Add Disease Form */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Add Condition
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Select Condition</InputLabel>
                      <Select
                        value={diseaseId}
                        onChange={(e) => setDiseaseId(e.target.value)}
                        label="Select Condition"
                      >
                        <MenuItem value="">Please select condition...</MenuItem>
                        {availableDiseases.map((disease) => (
                          <MenuItem key={disease.id} value={disease.id}>
                            {disease.common_names && disease.common_names.length > 0
                              ? disease.common_names[0]
                              : disease.icd10_name}
                            {' '}({disease.icd10_code})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Severity</InputLabel>
                      <Select
                        value={diseaseSeverity}
                        onChange={(e) => setDiseaseSeverity(e.target.value)}
                        label="Severity"
                      >
                        <MenuItem value="">Please select</MenuItem>
                        <MenuItem value="mild">Mild</MenuItem>
                        <MenuItem value="moderate">Moderate</MenuItem>
                        <MenuItem value="severe">Severe</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      type="date"
                      label="Diagnosis Date"
                      value={diagnosisDate}
                      onChange={(e) => setDiagnosisDate(e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Additional Notes"
                      value={diseaseNotes}
                      onChange={(e) => setDiseaseNotes(e.target.value)}
                      placeholder="Optional: additional notes on condition, medication, etc."
                    />
                  </Grid>
                </Grid>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={addChronicDisease}
                  sx={{ mt: 2 }}
                >
                  Add Condition
                </Button>
              </Box>
            </Paper>

            {/* Save Button */}
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              {/* Error/Success Messages */}
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', pt: 2, borderTop: '1px solid #e0e0e0' }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  sx={{ flex: 1 }}
                >
                  Save All Information
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={handleReset}
                  sx={{ flex: 1 }}
                >
                  Reset Form
                </Button>
              </Box>
            </Paper>
          </>
        )}
      </Container>
    </Box>
  );
};

export default Profile;
