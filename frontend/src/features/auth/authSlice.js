import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const checkAuth = () => {
  if (typeof window === 'undefined') return false;
  
  const token = localStorage.getItem('token');
  if (token) return true;
  
  // Also check URL parameters for initial login
  if (typeof window !== 'undefined' && 
      window.location.pathname.includes('/dashboard') && 
      window.location.search.includes('token=')) {
    return true;
  }
  
  return false;
};

// Get user from localStorage
const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenantId') : null;

const initialState = {
  user: user ? user : null,
  token: token ? token : null,
  tenantId: tenantId ? tenantId : null,
  isAuthenticated: checkAuth(),
  isLoading: false,
  error: null,
};

// Register user
export const register = createAsyncThunk(
  'auth/register',
  async (userData, thunkAPI) => {
    try {
      const response = await api.post('/auth/register', userData);
      
      if (response.data) {
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('tenantId', response.data.user.tenantId);
        }
      }
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Login user
export const login = createAsyncThunk(
  'auth/login',
  async (userData, thunkAPI) => {
    try {
      const response = await api.post('/auth/login', userData);
      
      if (response.data) {
        // Save to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          localStorage.setItem('tenantId', response.data.user.tenantId);
        }
      }
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Logout user
export const logout = createAsyncThunk('auth/logout', async (_, thunkAPI) => {
  try {
    await api.get('/auth/logout');
    
    // Remove from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
    }
    
    return null;
  } catch (error) {
    // Even if API fails, we clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('tenantId');
    }
    
    return null;
  }
});

// Get user profile
export const getProfile = createAsyncThunk(
  'auth/getProfile',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/auth/me');
      
      // Save to localStorage for persistent auth
      if (response.data && response.data.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.data));
          
          // If there's no token in localStorage but we have a valid user response,
          // we're likely authenticated via cookies, so create a dummy token
          if (!localStorage.getItem('token')) {
            localStorage.setItem('token', 'cookie-auth');
          }
          
          if (response.data.data.tenantId) {
            localStorage.setItem('tenantId', response.data.data.tenantId);
          }
        }
      }
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Update user profile
export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData, thunkAPI) => {
    try {
      const response = await api.put('/auth/update', userData);
      
      // Update localStorage
      if (response.data) {
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(response.data.data));
        }
      }
      
      return response.data;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.tenantId = action.payload.user.tenantId;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.tenantId = action.payload.user.tenantId;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.tenantId = null;
        state.isAuthenticated = false;
      })
      // Get Profile
      .addCase(getProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.isAuthenticated = true;
        if (action.payload.data?.tenantId) {
          state.tenantId = action.payload.data.tenantId;
        }
      })
      .addCase(getProfile.rejected, (state, action) => {
        // If getting profile fails, we're not authenticated
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      })
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, clearError } = authSlice.actions;
export default authSlice.reducer;
