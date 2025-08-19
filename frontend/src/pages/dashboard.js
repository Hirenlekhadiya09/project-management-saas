import { useEffect } from 'react';
import { Typography, Box, Grid, Paper, Card, CardContent } from '@mui/material';
import { useSelector, useDispatch } from 'react-redux';
import dynamic from 'next/dynamic';

// Import the layout component dynamically to avoid hydration issues
const DashboardLayout = dynamic(() => import('../components/layouts/DashboardLayout'), {
  ssr: false
});
import { getProjects } from '../features/projects/projectSlice';
import { getTasks } from '../features/tasks/taskSlice';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useSelector((state) => state.tasks);
  
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
                  <Paper key={task._id} sx={{ p: 2, mb: 2 }}>
                    <Typography variant="subtitle1">{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Status: {task.status}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Project: {task.project?.name || 'Unknown'}
                    </Typography>
                  </Paper>
                ))
              ) : (
                <Typography variant="body1">No tasks found</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
    </DashboardLayout>
  );
};


