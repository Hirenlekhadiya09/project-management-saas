import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
} from '@mui/material';
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
  const { tasks, isLoading, error } = useSelector((state) => state.tasks);
  const { projects } = useSelector((state) => state.projects);
  const { user } = useSelector((state) => state.auth);
  
  const [openTaskDialog, setOpenTaskDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    status: 'Not Started',
    priority: 'medium',
    projectId: '',
    assignee: '',
  });
  const [taskFilter, setTaskFilter] = useState('all');
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuTaskId, setMenuTaskId] = useState(null);
  
  useEffect(() => {
    dispatch(getTasks({}));
    dispatch(getProjects({})); // Load projects when component mounts
  }, [dispatch]);
  
  const handleOpenTaskDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setTaskForm({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: task.projectId,
        assignee: task.assignee,
      });
    } else {
      setSelectedTask(null);
      setTaskForm({
        title: '',
        description: '',
        status: 'Not Started',
        priority: 'medium',
        projectId: '',
        assignee: user?._id || '',
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
    } else {
      dispatch(createTask(taskForm));
      handleCloseTaskDialog();
    }
  };
  
  const handleDeleteTask = (taskId) => {
    dispatch(deleteTask(taskId));
    handleCloseMenu();
  };
  
  const handleOpenMenu = (event, taskId) => {
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
  };
  
  const handleFilterChange = (filter) => {
    setTaskFilter(filter);
  };
  
  const getFilteredTasks = () => {
    if (taskFilter === 'all') return tasks;
    if (taskFilter === 'my') return tasks.filter(task => task.assignee === user?._id);
    return tasks.filter(task => task.status === taskFilter);
  };
  
  const filteredTasks = getFilteredTasks();
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Tasks</Typography>
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
                      projects.find(p => p._id === task.projectId)?.name || 'Unknown'
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
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </Typography>
                      <Avatar sx={{ width: 30, height: 30 }}>
                        {task.assigneeName ? task.assigneeName.charAt(0) : 'U'}
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
                {projects.map((project) => (
                  <MenuItem key={project._id} value={project._id}>
                    {project.name}
                  </MenuItem>
                ))}
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
        <MenuItem
          onClick={() => handleDeleteTask(menuTaskId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
}
