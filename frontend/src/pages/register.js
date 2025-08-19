import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { register } from '../features/auth/authSlice';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Grid,
} from '@mui/material';

export default function Register() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    tenantSlug: '',
  });
  const [formErrors, setFormErrors] = useState({});
  
  const { isLoading, isAuthenticated, error } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Generate slug from tenant name
    if (e.target.name === 'tenantName') {
      const slug = e.target.value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      setFormData((prevData) => ({
        ...prevData,
        tenantSlug: slug,
      }));
    }
    
    // Clear errors when user types
    if (formErrors[e.target.name]) {
      setFormErrors((prev) => ({
        ...prev,
        [e.target.name]: '',
      }));
    }
  };
  
  const validateStep = (step) => {
    const errors = {};
    
    if (step === 0) {
      if (!formData.name) errors.name = 'Name is required';
      if (!formData.email) errors.email = 'Email is required';
      else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
        errors.email = 'Invalid email address';
      }
      if (!formData.password) errors.password = 'Password is required';
      else if (formData.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else if (step === 1) {
      if (!formData.tenantName) errors.tenantName = 'Organization name is required';
      if (!formData.tenantSlug) errors.tenantSlug = 'Organization URL is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateStep(activeStep)) {
      // Create both tenant and user in one request
      const registerData = {
        user: {
          name: formData.name,
          email: formData.email,
          password: formData.password,
        },
        tenant: {
          name: formData.tenantName,
          slug: formData.tenantSlug,
        }
      };
      
      dispatch(register(registerData));
    }
  };
  
  const steps = ['Account Information', 'Organization Setup'];
  
  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formData.name}
              onChange={handleChange}
              error={!!formErrors.name}
              helperText={formErrors.name}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!formErrors.confirmPassword}
              helperText={formErrors.confirmPassword}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="tenantName"
              label="Organization Name"
              name="tenantName"
              autoFocus
              value={formData.tenantName}
              onChange={handleChange}
              error={!!formErrors.tenantName}
              helperText={formErrors.tenantName}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="tenantSlug"
              label="Organization URL"
              name="tenantSlug"
              value={formData.tenantSlug}
              onChange={handleChange}
              error={!!formErrors.tenantSlug}
              helperText={
                formErrors.tenantSlug ||
                'This will be used in your organization URL'
              }
              InputProps={{
                startAdornment: (
                  <Typography variant="body2" color="text.secondary">
                    projectapp.com/
                  </Typography>
                ),
              }}
            />
          </>
        );
      default:
        return null;
    }
  };
  
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Create Your Account
        </Typography>
        
        <Paper sx={{ p: 4, width: '100%' }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            {renderStepContent(activeStep)}
            
            <Grid container spacing={2} sx={{ mt: 3 }}>
              <Grid item xs={activeStep === 0 ? 12 : 6}>
                {activeStep === 0 ? (
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleNext}
                    disabled={isLoading}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={handleBack}
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                )}
              </Grid>
              
              {activeStep === 1 && (
                <Grid item xs={6}>
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Register'}
                  </Button>
                </Grid>
              )}
            </Grid>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              {activeStep === 0 && (
                <>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Or sign up with:
                  </Typography>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                    <Button
                      variant="outlined"
                      onClick={() => window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/google`}
                      startIcon={
                        <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                          <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
                          <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
                          <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
                          <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
                        </svg>
                      }
                    >
                      Google
                    </Button>
                  </Box>
                </>
              )}
              
              <Link href="/login" passHref legacyBehavior>
                <Typography component="a" variant="body2" color="primary">
                  Already have an account? Sign In
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
