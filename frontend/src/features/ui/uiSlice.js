import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  darkMode: false,
  notifications: [],
  isMobile: false,
  notification: {
    open: false,
    message: '',
    type: 'info',
    relatedResource: null,
  },
};

export const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarState: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', state.darkMode ? 'true' : 'false');
        
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('darkMode', state.darkMode ? 'true' : 'false');
        
        if (state.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    },
    showNotification: (state, action) => {
      // Legacy notifications array
      state.notifications.push({
        id: Date.now(),
        message: action.payload.message,
        type: action.payload.type || 'info',
      });
      
      // New notification system for snackbar
      state.notification = {
        open: true,
        message: action.payload.message,
        type: action.payload.type || 'info',
        relatedResource: action.payload.relatedResource || null,
        duration: action.payload.duration || 5000,
      };
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    setIsMobile: (state, action) => {
      state.isMobile = action.payload;
    },
    initUI: (state) => {
      if (typeof window !== 'undefined') {
        const darkMode = localStorage.getItem('darkMode') === 'true';
        state.darkMode = darkMode;
        
        if (darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        
        state.isMobile = window.innerWidth < 768;
        if (state.isMobile) {
          state.sidebarOpen = false;
        }
      }
    },
    hideNotification: (state) => {
      state.notification.open = false;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarState, 
  toggleDarkMode, 
  setDarkMode,
  showNotification,
  removeNotification,
  hideNotification,
  setIsMobile,
  initUI
} = uiSlice.actions;

export default uiSlice.reducer;
