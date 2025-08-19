import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import CssBaseline from '@mui/material/CssBaseline';
import store from '../store';
import { initUI } from '../features/ui/uiSlice';
import { initializeSocket, disconnectSocket } from '../utils/socket';
import '../styles/globals.css';

// Create a client-side emotion cache
const createEmotionCache = () => {
  return createCache({ key: 'css', prepend: true });
};

// Client-side cache
const clientSideEmotionCache = createEmotionCache();

let socket;

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
        {getLayout(<Component {...pageProps} />)}
      </ThemeProvider>
    </Provider>
    </CacheProvider>
  );
}

export default MyApp;
