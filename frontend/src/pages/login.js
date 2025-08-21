import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { login, loginSuccess } from '../features/auth/authSlice';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';

export default function Login() {
  const dispatch = useDispatch();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    tenantId: '',
  });
  const [tenantList, setTenantList] = useState([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantError, setTenantError] = useState(null);
  
  const { isLoading, isAuthenticated, error } = useSelector((state) => state.auth);
  
  useEffect(() => {
    // Check if already authenticated in localStorage but not in Redux
    if (!isAuthenticated) {
      const storedToken = localStorage.getItem('token');
      const storedUserJson = localStorage.getItem('user');
      
      if (storedToken && storedUserJson) {
        try {
          const storedUser = JSON.parse(storedUserJson);
          console.log('Login: Found stored credentials');
          
          // Dispatch loginSuccess action directly
          dispatch(loginSuccess({ 
            token: storedToken, 
            user: storedUser 
          }));
          
          // Redirect to dashboard
          router.push('/dashboard');
          return;
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tenantId');
        }
      }
    }
    
    // Redirect if already logged in
    if (isAuthenticated) {
      router.push('/dashboard');
    }
    
    // Fetch tenant list from API
    const fetchTenants = async () => {
      setTenantLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/tenants`);
        const data = await response.json();
        
        if (data.success) {
          setTenantList(data.data);
          
          // Check if email is provided in URL params (from invitation)
          if (router.query.email && router.query.tenantId) {
            console.log('Found invitation parameters:', router.query.email, router.query.tenantId);
            setFormData(prev => ({
              ...prev,
              email: decodeURIComponent(router.query.email),
              tenantId: router.query.tenantId
            }));
          }
        } else {
          setTenantError('Failed to load organizations');
        }
      } catch (err) {
        setTenantError('Error connecting to server');
        console.error('Error fetching tenants:', err);
      } finally {
        setTenantLoading(false);
      }
    };
    
    fetchTenants();
  }, [isAuthenticated, router]);
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login(formData));
  };
  
  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          Sign In
        </Typography>
        
        <Paper sx={{ p: 4, width: '100%' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            
            <FormControl fullWidth margin="normal">
              <InputLabel id="tenant-label">Organization</InputLabel>
              <Select
                labelId="tenant-label"
                id="tenantId"
                name="tenantId"
                value={formData.tenantId}
                onChange={handleChange}
                required
                label="Organization"
                disabled={tenantLoading}
              >
                {tenantLoading ? (
                  <MenuItem disabled>Loading organizations...</MenuItem>
                ) : tenantList.length > 0 ? (
                  tenantList.map((tenant) => (
                    <MenuItem key={tenant._id} value={tenant._id}>
                      {tenant.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled>No organizations available</MenuItem>
                )}
              </Select>
              {tenantError && (
                <Typography color="error" variant="caption">
                  {tenantError}
                </Typography>
              )}
            </FormControl>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" sx={{ mb: 2 }}>
                Or sign in with:
              </Typography>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    const googleAuthUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'}/auth/google`;
                    console.log('Redirecting to Google OAuth:', googleAuthUrl);
                    // Use a more robust approach for redirecting
                    const newWindow = window.open(googleAuthUrl, '_self');
                    if (newWindow) newWindow.opener = null;
                  }}
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
              
              <Link href="/register" passHref legacyBehavior>
                <Typography component="a" variant="body2" color="primary">
                  {"Don't have an account? Sign Up"}
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
