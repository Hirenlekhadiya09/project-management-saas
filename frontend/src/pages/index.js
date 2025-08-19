import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Typography, Button, Box, Container, Grid, Paper } from '@mui/material';
import { useSelector } from 'react-redux';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);
  
  return (
    <Container maxWidth="xl">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Hero section */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 8,
          }}
        >
          <Box sx={{ maxWidth: '600px', mb: { xs: 4, md: 0 } }}>
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{ fontWeight: 'bold' }}
            >
              Manage projects with ease
            </Typography>
            <Typography variant="h5" color="text.secondary" paragraph>
              A powerful, intuitive project management platform designed for teams of all sizes.
              Stay organized, collaborate efficiently, and deliver projects on time.
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => router.push('/register')}
                sx={{ mr: 2, mb: { xs: 2, sm: 0 } }}
              >
                Get Started
              </Button>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                onClick={() => router.push('/login')}
              >
                Sign In
              </Button>
            </Box>
          </Box>
          <Box
            sx={{
              width: { xs: '100%', md: '50%' },
              maxWidth: '600px',
            }}
          >
            <img
              src="/hero-image.svg"
              alt="Project Management"
              style={{ width: '100%', height: 'auto' }}
            />
          </Box>
        </Box>
        
        {/* Features section */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h3"
            component="h2"
            align="center"
            gutterBottom
            sx={{ mb: 6 }}
          >
            Key Features
          </Typography>
          
          <Grid container spacing={4}>
            {[
              {
                title: 'Task Management',
                description: 'Create, assign, and track tasks with ease. Update statuses, set priorities, and manage deadlines.',
                image: '/task-management.svg',
              },
              {
                title: 'Team Collaboration',
                description: 'Work together in real-time with comments, file sharing, and notifications to keep everyone in sync.',
                image: '/team-collaboration.svg',
              },
              {
                title: 'Progress Tracking',
                description: 'Visual dashboards and reporting tools to monitor project progress and team performance.',
                image: '/progress-tracking.svg',
              },
              {
                title: 'Role-Based Access',
                description: 'Control who can view and edit projects with customizable permissions and user roles.',
                image: '/role-based-access.svg',
              },
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  elevation={2}
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      mb: 2,
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={feature.image}
                      alt={feature.title}
                      style={{ maxWidth: '100%', maxHeight: '100%' }}
                    />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>
        
        {/* Call to action */}
        <Box
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            py: 8,
            borderRadius: 2,
            mt: 4,
            mb: 8,
            textAlign: 'center',
          }}
        >
          <Container maxWidth="md">
            <Typography variant="h4" component="h2" gutterBottom>
              Ready to boost your team's productivity?
            </Typography>
            <Typography variant="h6" paragraph sx={{ mb: 4 }}>
              Join thousands of teams already using our platform to manage their projects efficiently.
            </Typography>
            <Button
              variant="contained"
              color="secondary"
              size="large"
              onClick={() => router.push('/register')}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              Start Your Free Trial
            </Button>
          </Container>
        </Box>
        
        {/* Footer */}
        <Box
          component="footer"
          sx={{
            py: 3,
            mt: 'auto',
            backgroundColor: (theme) =>
              theme.palette.mode === 'light'
                ? theme.palette.grey[200]
                : theme.palette.grey[800],
          }}
        >
          <Container maxWidth="lg">
            <Typography variant="body1" align="center">
              © {new Date().getFullYear()} Project Management Tool. All rights reserved.
            </Typography>
          </Container>
        </Box>
      </Box>
    </Container>
  );
}
