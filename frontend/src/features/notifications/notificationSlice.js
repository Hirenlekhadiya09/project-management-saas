import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  totalPages: 0,
  currentPage: 1,
};

// Get user notifications
export const getNotifications = createAsyncThunk(
  'notifications/getAll',
  async (params, thunkAPI) => {
    try {
      const { page = 1, limit = 15, read } = params || {};
      
      let queryParams = `?page=${page}&limit=${limit}`;
      
      if (read !== undefined) {
        queryParams += `&read=${read}`;
      }
      
      const response = await api.get(`/notifications${queryParams}`);
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

// Mark notifications as read
export const markAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (ids, thunkAPI) => {
    try {
      const response = await api.post('/notifications/read', { ids });
      return { ids, count: response.data.count };
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Mark all notifications as read
export const markAllAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, thunkAPI) => {
    try {
      const response = await api.post('/notifications/read-all');
      return { count: response.data.count };
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Delete notification
export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/notifications/${id}`);
      return id;
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
    },
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get notifications
      .addCase(getNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload.data || [];
        state.unreadCount = action.payload.unreadCount || 0;
        state.totalPages = action.payload.pagination?.pages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
      })
      .addCase(getNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark as read
      .addCase(markAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Mark notifications as read
        state.notifications = state.notifications.map(notification => 
          action.payload.ids.includes(notification._id) 
            ? { ...notification, read: true } 
            : notification
        );
        
        // Update unread count
        state.unreadCount = Math.max(0, state.unreadCount - action.payload.count);
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Mark all as read
      .addCase(markAllAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.isLoading = false;
        
        // Mark all notifications as read
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        
        // Reset unread count
        state.unreadCount = 0;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Delete notification
      .addCase(deleteNotification.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteNotification.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Find notification to check if it was unread
        const deletedNotification = state.notifications.find(
          notification => notification._id === action.payload
        );
        
        // If it was unread, decrease unread count
        if (deletedNotification && !deletedNotification.read) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
        
        // Remove notification from array
        state.notifications = state.notifications.filter(
          notification => notification._id !== action.payload
        );
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, addNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
