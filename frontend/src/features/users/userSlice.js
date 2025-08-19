import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  users: [],
  user: null,
  isLoading: false,
  error: null,
  success: false,
};

// Get all users
export const getUsers = createAsyncThunk(
  'users/getAll',
  async (_, thunkAPI) => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      // If it's a 404 error, just return empty array instead of error
      if (error.response?.status === 404) {
        return { data: [] };
      }
      
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get user by ID
export const getUser = createAsyncThunk(
  'users/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/users/${id}`);
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

// Invite user
export const inviteUser = createAsyncThunk(
  'users/invite',
  async (userData, thunkAPI) => {
    try {
      const response = await api.post('/auth/invite', userData);
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

// Update user role
export const updateUserRole = createAsyncThunk(
  'users/updateRole',
  async ({ userId, role }, thunkAPI) => {
    try {
      const response = await api.put(`/users/${userId}`, { role });
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

// Delete user
export const deleteUser = createAsyncThunk(
  'users/delete',
  async (userId, thunkAPI) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return { userId, ...response.data };
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

const userSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    resetUserState: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get all users
      .addCase(getUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.data || [];
        state.success = true;
      })
      .addCase(getUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get user by ID
      .addCase(getUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.data;
        state.success = true;
      })
      .addCase(getUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Invite user
      .addCase(inviteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(inviteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.push(action.payload.data);
        state.success = true;
      })
      .addCase(inviteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update user role
      .addCase(updateUserRole.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.isLoading = false;
        const updatedUser = action.payload.data;
        state.users = state.users.map(user => 
          user._id === updatedUser._id ? updatedUser : user
        );
        state.success = true;
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user._id !== action.payload.userId);
        state.success = true;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  }
});

export const { resetUserState } = userSlice.actions;
export default userSlice.reducer;
