import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { Typography, Box, CircularProgress } from '@mui/material';
import { loginSuccess } from '../features/auth/authSlice';

export default function AuthHandler() {
  const router = useRouter();
  const dispatch = useDispatch();
  
  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Check if we have the payload parameter
        if (router.query.payload) {
          // Decode the base64 payload
          const payloadString = Buffer.from(router.query.payload, 'base64').toString();
          const payload = JSON.parse(payloadString);
          
          console.log('Auth handler received payload:', { 
            token: payload.token ? 'present' : 'missing', 
            user: payload.user ? 'present' : 'missing'
          });
          
          if (payload.token && payload.user) {
            // Store auth data in localStorage
            localStorage.setItem('token', payload.token);
            localStorage.setItem('user', JSON.stringify(payload.user));
            localStorage.setItem('tenantId', payload.user.tenantId);
            
            // Update Redux store with auth data
            dispatch(loginSuccess({ 
              token: payload.token, 
              user: payload.user 
            }));
            
            // Redirect to dashboard
            setTimeout(() => {
              router.replace('/dashboard');
            }, 200);
            return;
          }
        }
        
        // If we reach here, authentication failed
        router.replace('/login?error=Authentication failed');
      } catch (err) {
        console.error('Error in auth handler:', err);
        router.replace('/login?error=Authentication processing error');
      }
    };
    
    // Only run when router is ready
    if (router.isReady) {
      handleAuth();
    }
  }, [router, router.isReady, dispatch]);
  
  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3 }}>
        Completing authentication...
      </Typography>
    </Box>
  );
}
