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
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      const storedTenantId = localStorage.getItem('tenantId');
      
      // Only restore if we have token and either no auth or different token
      if (storedToken && (!token || storedToken !== token)) {
        try {
          const userData = storedUser ? JSON.parse(storedUser) : { tenantId: storedTenantId };
          console.log('Restoring authentication from localStorage');
          dispatch(loginSuccess({ token: storedToken, user: userData }));
        } catch (e) {
          console.error('Error restoring auth state:', e);
        }
      }
      
      setVerified(true);
    }
  }, [dispatch, token]);
  
  // Public pages that don't require authentication
  const publicPages = ['/', '/login', '/register'];
  const isPublicPage = publicPages.includes(router.pathname);
  
  // Show page if it's public or we're authenticated or still verifying
  if (isPublicPage || isAuthenticated || !verified) {
    return children;
  }
  
  // Redirect to login if private page and not authenticated
  if (typeof window !== 'undefined' && verified && !isAuthenticated) {
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
    socket = initializeSocket(store);
    
    // Clean up socket on unmount
    return () => {
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
          </AuthChecker>
        </ThemeProvider>
      </Provider>
    </CacheProvider>
  );
}

export default MyApp;
