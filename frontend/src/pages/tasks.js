import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Import the layout component dynamically to avoid hydration issues
const DashboardLayout = dynamic(() => import('../components/layouts/DashboardLayout'), {
  ssr: false
});
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
} from '../features/tasks/taskSlice';
import { getProjects } from '../features/projects/projectSlice';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  CircularProgress,
  Chip,
  Divider,
  Menu,
  Avatar,
  Alert,
  Snackbar,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';

const priorityColors = {
  low: 'success',
  medium: 'warning',
  high: 'error',
};

const statusColors = {
  'Not Started': 'default',
  'In Progress': 'primary',
  'Under Review': 'warning',
  Completed: 'success',
};

export default function Tasks() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { project: projectId } = router.query;
  const { tasks, isLoading, error } = useSelector((state) => state.tasks);
  const { projects } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'medium',
    projectId: '',
    assignee: '',
    dueDate: null,
  });
  const [taskFilter, setTaskFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTaskId, setMenuTaskId] = useState(null);
  
  useEffect(() => {
    const params = projectId ? { project: projectId } : {};
    dispatch(getTasks(params));
    dispatch(getProjects({}));
  }, [dispatch, projectId]);
  
  useEffect(() => {
    console.log('Available projects:', projects);
    if (projectId) {
      console.log(`Filtering tasks for project ID: ${projectId}`);
    }
  }, [projects, projectId]);
  
  const handleOpenTaskDialog = (task = null) => {
    if (task) {
      console.log('Opening task for editing:', task);
      setSelectedTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.project?._id || task.project,
        assignee: task.assignedTo?._id || task.assignedTo,
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
      });
    } else {
      setSelectedTask(null);
      setTaskForm({
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'medium',
        projectId: projectId || '', // Pre-select the current project if we're on a project-specific view
        assignee: user?._id || '',
        dueDate: null,
      });
    }
    setOpenTaskDialog(true);
  };
  
  const handleCloseTaskDialog = () => {
    setOpenTaskDialog(false);
    setFormError(''); // Clear any errors when closing the dialog
  };
  
  const handleTaskFormChange = (e) => {
    setTaskForm({
      ...taskForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleDateChange = (date) => {
    setTaskForm({
      ...taskForm,
      dueDate: date,
    });
  };
  
  // Add state for form errors
  const [formError, setFormError] = useState('');
  
  const handleSubmitTask = (e) => {
    e.preventDefault();
    
    // Validate required fields, especially project
    if (!taskForm.projectId) {
      setFormError('Please select a project');
      return;
    }
    
    setFormError(''); // Clear any errors
        
    if (selectedTask) {
      dispatch(updateTask({ taskId: selectedTask._id, taskData: taskForm }));
      handleCloseTaskDialog();
      
      const message = user?.role === 'admin' 
        ? `Admin action: Task "${taskForm.title}" has been updated`
        : `Task "${taskForm.title}" has been updated`;
      
      setSnackbar({
        open: true,
        message,
        severity: 'info'
      });
    } else {
      dispatch(createTask(taskForm));
      handleCloseTaskDialog();
      
      const message = user?.role === 'admin' 
        ? `Admin action: New task "${taskForm.title}" has been created`
        : `New task "${taskForm.title}" has been created`;
      
      setSnackbar({
        open: true,
        message,
        severity: 'success'
      });
    }
  };
  
  const handleDeleteTask = (taskId) => {
    const task = tasks.find(t => t._id === taskId);
    const taskName = task ? task.title : 'Task';
    
    dispatch(deleteTask(taskId));
    handleCloseMenu();
    
    const message = user?.role === 'admin'
      ? `Admin action: Task "${taskName}" has been deleted`
      : `Task "${taskName}" has been deleted`;
    
    setSnackbar({
      open: true,
      message,
      severity: 'warning'
    });
  };
  
  const handleOpenMenu = (event, taskId) => {
    const task = tasks.find(t => t._id === taskId);
    
    setAnchorEl(event.currentTarget);
    setMenuTaskId(taskId);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuTaskId(null);
  };
  
  const handleUpdateTaskStatus = (taskId, newStatus) => {
    // We don't need to map status here as it's handled in the updateTask thunk
    dispatch(updateTask({ taskId, taskData: { status: newStatus } }));
    
    const task = tasks.find(t => t._id === taskId);
    const taskName = task ? task.title : 'Task';
    
    if (user?.role === 'admin') {
      setSnackbar({
        open: true,
        message: `Admin action: ${taskName} has been marked as ${newStatus}`,
        severity: 'success'
      });
    } else {
      setSnackbar({
        open: true,
        message: `${taskName} has been marked as ${newStatus}`,
        severity: 'success'
      });
    }
  };
  
  const handleFilterChange = (filter) => {
    setTaskFilter(filter);
  };
  
  const getFilteredTasks = () => {
    // First filter by project if we have a projectId from router query
    let filteredByProject = tasks;
    
    // If we're not already filtering by project at the API level and have a projectId,
    // we need to filter the tasks here
    if (!router.query.project && projectId) {
      filteredByProject = tasks.filter(task => {
        return (
          (task.projectId === projectId) || 
          (task.project?._id === projectId) || 
          (task.project === projectId)
        );
      });
    }
    
    // Then apply the other filters
    if (taskFilter === 'all') return filteredByProject;
    if (taskFilter === 'my') return filteredByProject.filter(task => task.assignee === user?._id);
    return filteredByProject.filter(task => task.status === taskFilter);
  };
  
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({...snackbar, open: false});
  };
  
  const filteredTasks = getFilteredTasks();
  
  // Find current project name if we're filtering by project
  const currentProject = projectId ? projects.find(p => p._id === projectId) : null;

  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4">
            {currentProject ? `${currentProject.name} Tasks` : 'Tasks'}
          </Typography>
          {currentProject && (
            <Button 
              variant="text" 
              size="small"
              onClick={() => router.push('/tasks')}
              sx={{ mt: 0.5 }}
            >
              Show All Tasks
            </Button>
          )}
        </Box>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            sx={{ mr: 2 }}
            onClick={(e) => setAnchorEl(e.currentTarget)}
          >
            Filter: {taskFilter.charAt(0).toUpperCase() + taskFilter.slice(1)}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl && !menuTaskId)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem onClick={() => handleFilterChange('all')}>All Tasks</MenuItem>
            <MenuItem onClick={() => handleFilterChange('my')}>My Tasks</MenuItem>
            <Divider />
            <MenuItem onClick={() => handleFilterChange('Not Started')}>Not Started</MenuItem>
            <MenuItem onClick={() => handleFilterChange('In Progress')}>In Progress</MenuItem>
            <MenuItem onClick={() => handleFilterChange('Under Review')}>Under Review</MenuItem>
            <MenuItem onClick={() => handleFilterChange('Completed')}>Completed</MenuItem>
          </Menu>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenTaskDialog()}
          >
            New Task
          </Button>
        </Box>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {filteredTasks.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="textSecondary">
                    No tasks found
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => handleOpenTaskDialog()}
                  >
                    Create Your First Task
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            filteredTasks.map((task) => (
              <Grid item xs={12} md={6} lg={4} key={task._id}>
                <Card>
                  <CardHeader
                    action={
                      <IconButton onClick={(e) => handleOpenMenu(e, task._id)}>
                        <MoreVertIcon />
                      </IconButton>
                    }
                    title={task.title}
                    subheader={`Project: ${
                      task.project?.name || projects.find(p => p._id === task.project)?.name || 'Unknown'
                    }`}
                  />
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        label={task.status}
                        color={statusColors[task.status]}
                        size="small"
                        sx={{ mr: 1 }}
                      />
                      <Chip
                        label={task.priority}
                        color={priorityColors[task.priority]}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        {task.dueDate ? `Due: ${new Date(task.dueDate).toLocaleDateString()}` : 'No due date set'}
                      </Typography>
                      <Avatar sx={{ width: 30, height: 30 }}>
                        {task.assignedTo?.name ? task.assignedTo.name.charAt(0) : 'U'}
                      </Avatar>
                    </Box>
                    {task.status !== 'Completed' && (
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleUpdateTaskStatus(task._id, 'Completed')}
                        sx={{ mt: 2 }}
                      >
                        Mark as Completed
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      )}
      
      {/* Task Dialog */}
      <Dialog open={openTaskDialog} onClose={handleCloseTaskDialog} fullWidth>
        <DialogTitle>{selectedTask ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formError}
            </Alert>
          )}
          <TextField
            margin="dense"
            name="title"
            label="Task Title"
            fullWidth
            variant="outlined"
            value={taskForm.title}
            onChange={handleTaskFormChange}
            required
            autoFocus
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            variant="outlined"
            value={taskForm.description}
            onChange={handleTaskFormChange}
            multiline
            rows={3}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="status"
                label="Status"
                fullWidth
                variant="outlined"
                value={taskForm.status}
                onChange={handleTaskFormChange}
                select
              >
                <MenuItem value="Not Started">Not Started</MenuItem>
                <MenuItem value="In Progress">In Progress</MenuItem>
                <MenuItem value="Under Review">Under Review</MenuItem>
                <MenuItem value="Completed">Completed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                margin="dense"
                name="priority"
                label="Priority"
                fullWidth
                variant="outlined"
                value={taskForm.priority}
                onChange={handleTaskFormChange}
                select
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={taskForm.dueDate}
                  onChange={handleDateChange}
                  minDate={new Date()} // Disables selection of dates before today
                  shouldDisableDate={(date) => {
                    // Additional custom logic if needed
                    return false;
                  }}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth 
                      margin="dense"
                      helperText="Select a future date"
                    />
                  )}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                margin="dense"
                name="projectId"
                label="Project"
                fullWidth
                variant="outlined"
                value={taskForm.projectId}
                onChange={handleTaskFormChange}
                select
                required
              >
                {projects && projects.length > 0 ? (
                  projects.map((project) => (
                    <MenuItem key={project._id} value={project._id}>
                      {project.name}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem disabled value="">
                    No projects available
                  </MenuItem>
                )}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={handleSubmitTask} variant="contained">
            {selectedTask ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Task action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && menuTaskId)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            const task = tasks.find((t) => t._id === menuTaskId);
            handleOpenTaskDialog(task);
            handleCloseMenu();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        {/* Only show delete option for admin users and project managers */}
        {(user?.role === 'admin' || user?.role === 'manager') && (
          <MenuItem
            onClick={() => handleDeleteTask(menuTaskId)}
            sx={{ color: 'error.main' }}
          >
            <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
            Delete
          </MenuItem>
        )}
      </Menu>
      
      {/* Notification Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}
