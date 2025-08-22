import { useEffect, useState } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import CssBaseline from '@mui/material/CssBaseline';
import store from '../store';
import { initUI } from '../features/ui/uiSlice';
import { loginSuccess } from '../features/auth/authSlice';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import RealTimeNotificationsWrapper from '../components/notifications/RealTimeNotificationsWrapper';
import '../styles/globals.css';

// Create a client-side emotion cache
const createEmotionCache = () => {
  return createCache({ key: 'css', prepend: true });
};

// Client-side cache
const clientSideEmotionCache = createEmotionCache();

let socket;

// Auth checker component that verifies authentication state
function AuthChecker({ children }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, user, token } = useSelector(state => state.auth);
  const [verified, setVerified] = useState(false);
  
  // Check authentication on mount
  useEffect(() => {
    const checkAndRestoreAuth = () => {
      if (typeof window === 'undefined') return;
      
      console.log('AuthChecker: Verifying authentication state');
      const storedToken = localStorage.getItem('token');
      const storedUserJson = localStorage.getItem('user');
      
      // Skip auth-handler page - it handles its own auth
      if (router.pathname === '/auth-handler') {
        setVerified(true);
        return;
      }
      
      // If we have stored credentials but not in Redux, restore them
      if (storedToken && storedUserJson && !isAuthenticated) {
        try {
          const storedUser = JSON.parse(storedUserJson);
          console.log('Restoring authentication from localStorage');
          
          // Dispatch loginSuccess action to Redux
          dispatch(loginSuccess({ 
            token: storedToken, 
            user: storedUser 
          }));
        } catch (e) {
          console.error('Error parsing stored user data:', e);
          // Clear invalid data
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('tenantId');
        }
      }
      
      setVerified(true);
    };
    
    checkAndRestoreAuth();
  }, [dispatch, router.pathname, isAuthenticated]);
  
  // Public pages that don't require authentication
  const publicPages = ['/', '/login', '/register', '/auth-handler'];
  const isPublicPage = publicPages.includes(router.pathname);
  
  // Show page if it's public or we're authenticated or still verifying
  if (isPublicPage || isAuthenticated || !verified) {
    return children;
  }
  
  // Redirect to login if private page and not authenticated
  if (verified && !isAuthenticated) {
    console.log('Not authenticated, redirecting to login from:', router.pathname);
    router.replace('/login');
    return null;
  }
  
  return null;
}

function MyApp({ Component, pageProps, emotionCache = clientSideEmotionCache }) {
  const router = useRouter();
  
  useEffect(() => {
    // Remove the server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement.removeChild(jssStyles);
    }
    
    // Initialize UI state (dark mode, etc.)
    store.dispatch(initUI());
    
    // Initialize socket connection
    console.log('Initializing socket in _app.js');
    socket = initializeSocket(store);
    
    // Periodically check and reconnect socket if needed
    const socketCheckInterval = setInterval(() => {
      if (!socket || !socket.connected) {
        console.log('Socket disconnected, attempting to reconnect');
        socket = initializeSocket(store);
      }
    }, 10000); // Check every 10 seconds
    
    // Clean up socket on unmount
    return () => {
      clearInterval(socketCheckInterval);
      disconnectSocket();
    };
  }, []);
  
  // Create MUI theme
  const theme = createTheme({
    palette: {
      mode: 'light',
      primary: {
        main: '#1890ff',
      },
      secondary: {
        main: '#f50057',
      },
    },
  });
  
  // Get layout from page component or use default
  const getLayout = Component.getLayout || ((page) => page);
  
  return (
    <CacheProvider value={emotionCache}>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Head>
            <title>Project Management Tool</title>
            <meta name="description" content="SaaS Project Management Tool" />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <AuthChecker>
            {getLayout(<Component {...pageProps} />)}
            {/* Real-time notification component */}
            <div id="notifications-container">
              <RealTimeNotificationsWrapper />
            </div>
          </AuthChecker>
        </ThemeProvider>
      </Provider>
    </CacheProvider>
  );
}

export default MyApp;
