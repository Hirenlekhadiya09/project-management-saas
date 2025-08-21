import { useEffect } from 'react';
import { Typography, Box, Grid, Paper, Card, CardContent, Chip, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';

// Import the layout component dynamically to avoid hydration issues
const DashboardLayout = dynamic(() => import('../components/layouts/DashboardLayout'), {
  ssr: false
});
import { getProjects } from '../features/projects/projectSlice';
import { getTasks } from '../features/tasks/taskSlice';
import { getProfile } from '../features/auth/authSlice';

export default function Dashboard() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  
  useEffect(() => {
    // Fetch projects and tasks when dashboard loads
    dispatch(getProjects({}));
    dispatch(getTasks({ myTasks: true, limit: 5 }));
  }, [dispatch]);
  
  useEffect(() => {
    if (isAuthenticated && !user) {
      dispatch(getProfile());
    }
  }, [isAuthenticated, user, dispatch]);
  
  useEffect(() => {
    dispatch(getProjects({}));
    dispatch(getTasks({ myTasks: true, limit: 5 }));
  }, [dispatch]);
  
  return (
    <DashboardLayout>
      <Box>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      
      <Typography variant="h6" gutterBottom>
        Welcome back, {user?.name || 'User'}!
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Project Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Projects
            </Typography>
            <Typography variant="h3">
              {projects?.length || 0}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Task Stats */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              My Tasks
            </Typography>
            <Typography variant="h3">
              {tasks?.length || 0}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Status */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Status
            </Typography>
            <Typography variant="body1">
              Role: {user?.role === 'admin' ? 'Administrator' : 
                    user?.role === 'project_manager' ? 'Project Manager' : 'Team Member'}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Recent Projects */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Projects
              </Typography>
              
              {projects && projects.length > 0 ? (
                projects.slice(0, 5).map((project) => (
                  <Paper key={project._id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">{project.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {project.status}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1">No projects found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* Recent Tasks */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Recent Tasks
              </Typography>
              
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <Paper 
                    key={task._id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      borderLeft: '4px solid',
                      borderColor: task.priority === 'high' ? 'error.main' : 
                                  task.priority === 'medium' ? 'warning.main' : 
                                  'success.main',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      }
                    }}
                    onClick={() => router.push(`/tasks?id=${task._id}`)}
                  >
                          <Chip
                            label={task.priority}
                            size="small"
                            color={
                              task.priority === 'high' ? 'error' :
                              task.priority === 'medium' ? 'warning' : 'success'
                            }
                            sx={{ 
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              textTransform: 'capitalize'
                            }}
                          />                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'bold', 
                          pr: 1,
                          textDecoration: task.status === 'done' ? 'line-through' : 'none',
                          color: task.status === 'done' ? 'text.secondary' : 'text.primary'
                        }}
                      >
                        {task.title}
                      </Typography>
                      {task.status === 'done' && <CheckCircleIcon fontSize="small" color="success" />}
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Chip
                        label={task.status === 'todo' ? 'Not Started' : 
                               task.status === 'in-progress' ? 'In Progress' :
                               task.status === 'review' ? 'Under Review' : 'Completed'}
                        size="small"
                        variant="outlined"
                        color={task.status === 'done' ? 'success' : 'default'}
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        Project: {task.project?.name || 'Unknown'}
                      </Typography>
                    </Box>
                    
                    {task.dueDate && (
                      <Typography 
                        variant="body2" 
                        color={new Date(task.dueDate) < new Date() ? "error.main" : "text.secondary"}
                        fontWeight={new Date(task.dueDate) < new Date() ? "bold" : "normal"}
                        sx={{ mt: 1 }}
                      >
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && ' (OVERDUE)'}
                      </Typography>
                    )}
                  </Paper>
                ))
              ) : (
                <Typography variant="body1">No tasks assigned to you</Typography>
              )}
              
              {tasks && tasks.length > 0 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    variant="contained"
                    onClick={() => router.push('/tasks?filter=my')}
                  >
                    View All My Tasks
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </DashboardLayout>
  );
};


