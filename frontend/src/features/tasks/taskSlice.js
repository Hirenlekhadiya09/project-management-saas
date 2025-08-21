import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';

export const statusMapping = {
  frontendToBackend: {
    'Not Started': 'todo',
    'In Progress': 'in-progress',
    'Under Review': 'review',
    'Completed': 'done'
  },
  backendToFrontend: {
    'todo': 'Not Started',
    'in-progress': 'In Progress',
    'review': 'Under Review',
    'done': 'Completed'
  }
};

const initialState = {
  tasks: [],
  tasksByStatus: {
    todo: [],
    'in-progress': [],
    review: [],
    done: []
  },
  task: null,
  isLoading: false,
  error: null,
  success: false,
  totalPages: 0,
  currentPage: 1,
};

export const getTasks = createAsyncThunk(
  'tasks/getAll',
  async (params, thunkAPI) => {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        priority, 
        project, 
        assignedTo,
        myTasks 
      } = params || {};
      
      let queryParams = `?page=${page}&limit=${limit}`;
      
      if (status) {
        queryParams += `&status=${status}`;
      }
      
      if (priority) {
        queryParams += `&priority=${priority}`;
      }
      
      if (project) {
        queryParams += `&project=${project}`;
      }
      
      if (assignedTo) {
        queryParams += `&assignedTo=${assignedTo}`;
      }
      
      if (myTasks) {
        queryParams += `&myTasks=true`;
      }
      
      const response = await api.get(`/tasks${queryParams}`);
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

// Get single task
export const getTask = createAsyncThunk(
  'tasks/getOne',
  async (id, thunkAPI) => {
    try {
      const response = await api.get(`/tasks/${id}`);
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

// Create new task
export const createTask = createAsyncThunk(
  'tasks/create',
  async (taskData, thunkAPI) => {
    try {
      const mappedData = {
        ...taskData,
        project: taskData.projectId
      };
      
      if (mappedData.status) {
        mappedData.status = statusMapping.frontendToBackend[mappedData.status] || 'todo';
      }
      
      delete mappedData.projectId;
      
      const response = await api.post('/tasks', mappedData);
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

// Update task
export const updateTask = createAsyncThunk(
  'tasks/update',
  async ({ taskId, taskData }, thunkAPI) => {
    try {
      const mappedData = {
        ...taskData,
        project: taskData.projectId
      };
      
      if (mappedData.status) {
        mappedData.status = statusMapping.frontendToBackend[mappedData.status] || 'todo';
      }
      
      delete mappedData.projectId;
      
      const response = await api.put(`/tasks/${taskId}`, mappedData);
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

// Delete task
export const deleteTask = createAsyncThunk(
  'tasks/delete',
  async (id, thunkAPI) => {
    try {
      await api.delete(`/tasks/${id}`);
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

// Add comment to task
export const addComment = createAsyncThunk(
  'tasks/addComment',
  async ({ id, commentData }, thunkAPI) => {
    try {
      const response = await api.post(`/tasks/${id}/comments`, commentData);
      return { taskId: id, comment: response.data.data };
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

// Get tasks by project, grouped by status (for Kanban board)
export const getTasksByProject = createAsyncThunk(
  'tasks/getByProject',
  async (projectId, thunkAPI) => {
    try {
      const response = await api.get(`/tasks?project=${projectId}&limit=100`);
      
      // Group tasks by status
      const tasksByStatus = {
        todo: [],
        'in-progress': [],
        review: [],
        done: []
      };
      
      response.data.data.forEach(task => {
        if (tasksByStatus[task.status]) {
          tasksByStatus[task.status].push(task);
        } else {
          tasksByStatus.todo.push(task);
        }
      });
      
      return { tasks: response.data.data, tasksByStatus };
    } catch (error) {
      const message = 
        error.response?.data?.message || 
        error.message || 
        'Something went wrong';
      
      return thunkAPI.rejectWithValue(message);
    }
  }
);

export const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.error = null;
      state.success = false;
    },
    clearTask: (state) => {
      state.task = null;
    },
    updateLocalTask: (state, action) => {
      // Used for real-time updates
      const updatedTask = action.payload;
      
      // Update task if it's the currently selected task
      if (state.task && state.task._id === updatedTask._id) {
        state.task = updatedTask;
      }
      
      // Update task in tasks array
      state.tasks = state.tasks.map(task => 
        task._id === updatedTask._id ? updatedTask : task
      );
      
      // Update task in tasksByStatus
      const oldStatus = Object.keys(state.tasksByStatus).find(status => 
        state.tasksByStatus[status].some(task => task._id === updatedTask._id)
      );
      
      if (oldStatus) {
        // Remove from old status column
        state.tasksByStatus[oldStatus] = state.tasksByStatus[oldStatus].filter(
          task => task._id !== updatedTask._id
        );
        
        // Add to new status column
        if (state.tasksByStatus[updatedTask.status]) {
          state.tasksByStatus[updatedTask.status].push(updatedTask);
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Get all tasks
      .addCase(getTasks.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTasks.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Map the status values in the tasks
        const mappedTasks = action.payload.data.map(task => ({
          ...task,
          status: statusMapping.backendToFrontend[task.status] || 'Not Started'
        }));
        
        state.tasks = mappedTasks;
        state.totalPages = action.payload.pagination?.pages || 1;
        state.currentPage = action.payload.pagination?.page || 1;
        state.success = true;
      })
      .addCase(getTasks.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get tasks by project for Kanban
      .addCase(getTasksByProject.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTasksByProject.fulfilled, (state, action) => {
        state.isLoading = false;
        state.tasks = action.payload.tasks;
        state.tasksByStatus = action.payload.tasksByStatus;
        state.success = true;
      })
      .addCase(getTasksByProject.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Get single task
      .addCase(getTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getTask.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Map backend status values to frontend status values
        // Map the task status
        if (action.payload.data) {
          state.task = {
            ...action.payload.data,
            status: statusMapping.backendToFrontend[action.payload.data.status] || 'Not Started'
          };
        }
        
        state.success = true;
      })
      .addCase(getTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create task
      .addCase(createTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Map backend status values to frontend status values
        const newTask = {
          ...action.payload.data,
          status: statusMapping.backendToFrontend[action.payload.data.status] || 'Not Started'
        };
        
        // Add to tasks array
        state.tasks.unshift(newTask);
        
        // Add to appropriate status column
        if (state.tasksByStatus[newTask.status]) {
          state.tasksByStatus[newTask.status].push(newTask);
        }
        
        state.success = true;
      })
      .addCase(createTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Update task
      .addCase(updateTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Map backend status values to frontend status values
        const updatedTask = {
          ...action.payload.data,
          status: statusMapping.backendToFrontend[action.payload.data.status] || 'Not Started'
        };
        
        // Update in tasks array
        state.tasks = state.tasks.map(task => 
          task._id === updatedTask._id ? updatedTask : task
        );
        
        // Update currently selected task if it's the same
        if (state.task && state.task._id === updatedTask._id) {
          state.task = updatedTask;
        }
        
        // Update in tasksByStatus
        const oldStatus = Object.keys(state.tasksByStatus).find(status => 
          state.tasksByStatus[status].some(task => task._id === updatedTask._id)
        );
        
        if (oldStatus && oldStatus !== updatedTask.status) {
          // Remove from old status column
          state.tasksByStatus[oldStatus] = state.tasksByStatus[oldStatus].filter(
            task => task._id !== updatedTask._id
          );
          
          // Add to new status column
          if (state.tasksByStatus[updatedTask.status]) {
            state.tasksByStatus[updatedTask.status].push(updatedTask);
          }
        } else if (oldStatus === updatedTask.status) {
          // Update in the same column
          state.tasksByStatus[oldStatus] = state.tasksByStatus[oldStatus].map(
            task => task._id === updatedTask._id ? updatedTask : task
          );
        }
        
        state.success = true;
      })
      .addCase(updateTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.success = false;
      })
      
      // Delete task
      .addCase(deleteTask.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const taskId = action.payload;
        
        // Remove from tasks array
        state.tasks = state.tasks.filter(task => task._id !== taskId);
        
        // Remove from tasksByStatus
        Object.keys(state.tasksByStatus).forEach(status => {
          state.tasksByStatus[status] = state.tasksByStatus[status].filter(
            task => task._id !== taskId
          );
        });
        
        // Clear task if it's the deleted one
        if (state.task && state.task._id === taskId) {
          state.task = null;
        }
        
        state.success = true;
      })
      .addCase(deleteTask.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add comment
      .addCase(addComment.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addComment.fulfilled, (state, action) => {
        state.isLoading = false;
        
        const { taskId, comment } = action.payload;
        
        // Add comment to current task if it's the same
        if (state.task && state.task._id === taskId) {
          state.task.comments.unshift(comment);
        }
        
        state.success = true;
      })
      .addCase(addComment.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { reset, clearTask, updateLocalTask } = taskSlice.actions;
export default taskSlice.reducer;
