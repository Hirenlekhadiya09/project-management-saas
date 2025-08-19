import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';

// Import the layout component dynamically to avoid hydration issues
const DashboardLayout = dynamic(() => import('../components/layouts/DashboardLayout'), {
  ssr: false
});
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../features/projects/projectSlice';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  CircularProgress,
  LinearProgress,
  Chip,
  Menu,
} from '@mui/material';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Assignment as AssignmentIcon,
} from '@mui/icons-material';

export default function Projects() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { projects, isLoading, error } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);
  
  const [openProjectDialog, setOpenProjectDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
  });
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuProjectId, setMenuProjectId] = useState(null);
  
  // Function to calculate progress
  const calculateProgress = (projectId) => {
    if (!tasks) return 0;
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    if (projectTasks.length === 0) return 0;
    
    const completedTasks = projectTasks.filter(task => task.status === 'Completed').length;
    return Math.round((completedTasks / projectTasks.length) * 100);
  };
  
  // Function to get task count
  const getTasksCount = (projectId) => {
    if (!tasks) return 0;
    return tasks.filter(task => task.projectId === projectId).length;
  };
  
  // Function to view tasks for a project
  const handleViewTasks = (projectId) => {
    router.push({
      pathname: '/tasks',
      query: { project: projectId },
    });
  };
  
  useEffect(() => {
    dispatch(getProjects({}));
  }, [dispatch]);
  
  const handleOpenProjectDialog = (project = null) => {
    if (project) {
      setSelectedProject(project);
      setProjectForm({
        name: project.name,
        description: project.description,
        status: project.status,
        priority: project.priority || 'medium',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
    } else {
      setSelectedProject(null);
      setProjectForm({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
      });
    }
    setOpenProjectDialog(true);
  };
  
  const handleCloseProjectDialog = () => {
    setOpenProjectDialog(false);
  };
  
  const handleProjectFormChange = (e) => {
    setProjectForm({
      ...projectForm,
      [e.target.name]: e.target.value,
    });
  };
  
  const handleSubmitProject = (e) => {
    e.preventDefault();
    if (selectedProject) {
      dispatch(updateProject({ projectId: selectedProject._id, projectData: projectForm }));
    } else {
      const projectData = {
        ...projectForm,
        manager: user._id,
        members: [user._id]
      };
      dispatch(createProject(projectData));
    }
    handleCloseProjectDialog();
  };
  
  const handleDeleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      dispatch(deleteProject(projectId));
    }
    handleCloseMenu();
  };
  
  const handleOpenMenu = (event, projectId) => {
    setAnchorEl(event.currentTarget);
    setMenuProjectId(projectId);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuProjectId(null);
  };
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenProjectDialog()}
        >
          New Project
        </Button>
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.length === 0 ? (
            <Grid item xs={12}>
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" color="textSecondary">
                    No projects found
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    sx={{ mt: 2 }}
                    onClick={() => handleOpenProjectDialog()}
                  >
                    Create Your First Project
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ) : (
            projects.map((project) => {
              const progress = calculateProgress(project._id);
              const tasksCount = getTasksCount(project._id);
              
              return (
                <Grid item xs={12} md={6} lg={4} key={project._id}>
                  <Card>
                    <CardHeader
                      action={
                        <IconButton onClick={(e) => handleOpenMenu(e, project._id)}>
                          <MoreVertIcon />
                        </IconButton>
                      }
                      title={project.name}
                    />
                    <CardContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {project.description}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">Progress</Typography>
                        <Typography variant="body2">{progress}%</Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={progress}
                        sx={{ mb: 2 }}
                      />
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Chip
                          label={project.status?.charAt(0).toUpperCase() + project.status?.slice(1)}
                          color={
                            project.status === 'completed'
                              ? 'success'
                              : project.status === 'active'
                              ? 'primary'
                              : project.status === 'on-hold'
                              ? 'warning'
                              : project.status === 'cancelled'
                              ? 'error'
                              : 'default'
                          }
                          size="small"
                        />
                        <Chip
                          icon={<AssignmentIcon />}
                          label={`${tasksCount} tasks`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button
                        size="small"
                        onClick={() => handleViewTasks(project._id)}
                        fullWidth
                      >
                        View Tasks
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              );
            })
          )}
        </Grid>
      )}
      
      {/* Project Dialog */}
      <Dialog open={openProjectDialog} onClose={handleCloseProjectDialog} fullWidth>
        <DialogTitle>{selectedProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Project Name"
            fullWidth
            variant="outlined"
            value={projectForm.name}
            onChange={handleProjectFormChange}
            required
            autoFocus
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            fullWidth
            variant="outlined"
            value={projectForm.description}
            onChange={handleProjectFormChange}
            multiline
            rows={3}
          />
          <TextField
            margin="dense"
            name="startDate"
            label="Start Date"
            type="date"
            fullWidth
            variant="outlined"
            value={projectForm.startDate}
            onChange={handleProjectFormChange}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
          
          <TextField
            margin="dense"
            name="endDate"
            label="End Date"
            type="date"
            fullWidth
            variant="outlined"
            value={projectForm.endDate}
            onChange={handleProjectFormChange}
            InputLabelProps={{
              shrink: true,
            }}
            required
          />
          
          <TextField
            margin="dense"
            name="status"
            label="Status"
            fullWidth
            variant="outlined"
            value={projectForm.status}
            onChange={handleProjectFormChange}
            select
            required
          >
            <MenuItem value="planning">Planning</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="on-hold">On Hold</MenuItem>
            <MenuItem value="completed">Completed</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </TextField>
          
          <TextField
            margin="dense"
            name="priority"
            label="Priority"
            fullWidth
            variant="outlined"
            value={projectForm.priority}
            onChange={handleProjectFormChange}
            select
            required
          >
            <MenuItem value="low">Low</MenuItem>
            <MenuItem value="medium">Medium</MenuItem>
            <MenuItem value="high">High</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseProjectDialog}>Cancel</Button>
          <Button onClick={handleSubmitProject} variant="contained">
            {selectedProject ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Project action menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl && menuProjectId)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            const project = projects.find((p) => p._id === menuProjectId);
            handleOpenProjectDialog(project);
            handleCloseMenu();
          }}
        >
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => handleViewTasks(menuProjectId)}
        >
          <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
          View Tasks
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteProject(menuProjectId)}
          sx={{ color: 'error.main' }}
        >
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </DashboardLayout>
  );
}
