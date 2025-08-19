import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

const initialState = {
  projects: [],
  project: null,
  isLoading: false,
  error: null,
  success: false,
  totalPages: 0,
  currentPage: 1,
};

// Get all projects
export const getProjects = createAsyncThunk(
  'projects/getAll',
  async (params, thunkAPI) => {
    try {
      const { page = 1, limit = 10, status, priority } = params || {};
      
      let queryParams = `?page=${page}&limit=${limit}`;
      
      if (status) {
        queryParams += `&status=${status}`;
      }
      
      if (priority) {
        queryParams += `&priority=${priority}`;
      }
      
      const response = await api.get(`/projects${queryParams}`);
      return response.data;
    } catch (error) {
      // If it's a 404 error, just return empty array instead of error
      if (error.response?.status === 404) {
        return { data: [], pagination: { page: 1, pages: 1 } };
      }
      
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get single project
export const getProject = createAsyncThunk(
  'projects/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/projects/${id}`);
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

// Create new project
export const createProject = createAsyncThunk(
  'projects/create',
  async (projectData, thunkAPI) => {
    try {
      const response = await api.post('/projects', projectData);
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

// Update project
export const updateProject = createAsyncThunk(
  'projects/update',
  async ({ id, projectData }, thunkAPI) => {
    try {
      const response = await api.put(`/projects/${id}`, projectData);
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

// Delete project
export const deleteProject = createAsyncThunk(
  'projects/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/projects/${id}`);
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

export const projectSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    },
    clearProject: (state) => {
      state.project = null;
    },
    updateLocalProject: (state, action) => {
      // Used for real-time updates
      if (state.project && state.project._id === action.payload._id) {
        state.project = action.payload;
      }
      
      state.projects = state.projects.map(project => 
        project._id === action.payload._id ? action.payload : project
      );
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all projects
      .addCase(getProjects.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProjects.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = action.payload.data || [];
        state.totalPages = action.payload.pagination?.pages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
        state.success = true;
      })
      .addCase(getProjects.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get single project
      .addCase(getProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.project = action.payload.data;
        state.success = true;
      })
      .addCase(getProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create project
      .addCase(createProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects.unshift(action.payload.data);
        state.success = true;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = state.projects.map(project => 
          project._id === action.payload.data._id ? action.payload.data : project
        );
        
        if (state.project && state.project._id === action.payload.data._id) {
          state.project = action.payload.data;
        }
        
        state.success = true;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.projects = state.projects.filter(project => 
          project._id !== action.payload
        );
        state.success = true;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, clearProject, updateLocalProject } = projectSlice.actions;
export default projectSlice.reducer;
