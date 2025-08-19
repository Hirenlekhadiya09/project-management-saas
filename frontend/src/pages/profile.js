import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DashboardLayout from '../components/layouts/DashboardLayout';
import { updateProfile, updatePassword } from '../features/auth/authSlice';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  IconButton,
  Paper,
} from '@mui/material';
import {
  Save as SaveIcon,
  Edit as EditIcon,
  PhotoCamera as PhotoCameraIcon,
} from '@mui/icons-material';

function TabPanel(props) {
  const { children, value, index, ...other } = props;
  
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const dispatch = useDispatch();
  const { user, isLoading, error, message } = useSelector((state) => state.auth);
  
  const [activeTab, setActiveTab] = useState(0);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    jobTitle: '',
    phoneNumber: '',
    bio: '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordFormErrors, setPasswordFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        jobTitle: user.jobTitle || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.bio || '',
      });
    }
  }, [user]);
  
  useEffect(() => {
    // Clear success message after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [successMessage]);
  
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };
  
  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value,
    });
    
    // Clear errors when user types
    if (passwordFormErrors[e.target.name]) {
      setPasswordFormErrors((prev) => ({
        ...prev,
        [e.target.name]: '',
      }));
    }
  };
  
  const validatePasswordForm = () => {
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleProfileSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProfile(profileForm));
    setSuccessMessage('Profile updated successfully');
  };
  
  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    
    if (validatePasswordForm()) {
      dispatch(
        updatePassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      ).then(() => {
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setSuccessMessage('Password updated successfully');
      });
    }
  };
  
  return (
    <DashboardLayout>
      <Typography variant="h4" sx={{ mb: 4 }}>
        My Profile
      </Typography>
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {message && (
        <Alert severity="info" sx={{ mb: 3 }}>
          {message}
        </Alert>
      )}
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={4} lg={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  sx={{
                    width: 100,
                    height: 100,
                    fontSize: 40,
                    mb: 2,
                    mx: 'auto',
                  }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
                <IconButton
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                  }}
                  size="small"
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>
              
              <Typography variant="h6">{user?.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {user?.jobTitle || 'No job title'}
              </Typography>
              
              <Divider sx={{ my: 2 }} />
              
              <Box textAlign="left">
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Email:</strong> {user?.email}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Role:</strong>{' '}
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) ||
                    'Member'}
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Tenant:</strong> {user?.tenantName || 'N/A'}
                </Typography>
                <Typography variant="body2">
                  <strong>Member Since:</strong>{' '}
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString()
                    : 'N/A'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={8} lg={9}>
          <Paper>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Tab label="Account Information" />
              <Tab label="Password" />
            </Tabs>
            
            <TabPanel value={activeTab} index={0}>
              <Box component="form" onSubmit={handleProfileSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Full Name"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Email Address"
                      name="email"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      fullWidth
                      required
                      disabled
                      helperText="Email cannot be changed"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Job Title"
                      name="jobTitle"
                      value={profileForm.jobTitle}
                      onChange={handleProfileChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Phone Number"
                      name="phoneNumber"
                      value={profileForm.phoneNumber}
                      onChange={handleProfileChange}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Bio"
                      name="bio"
                      value={profileForm.bio}
                      onChange={handleProfileChange}
                      fullWidth
                      multiline
                      rows={4}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<SaveIcon />}
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
            
            <TabPanel value={activeTab} index={1}>
              <Box component="form" onSubmit={handlePasswordSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      error={!!passwordFormErrors.currentPassword}
                      helperText={passwordFormErrors.currentPassword}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      error={!!passwordFormErrors.newPassword}
                      helperText={passwordFormErrors.newPassword}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      fullWidth
                      required
                      error={!!passwordFormErrors.confirmPassword}
                      helperText={passwordFormErrors.confirmPassword}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Update Password'
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </DashboardLayout>
  );
}
