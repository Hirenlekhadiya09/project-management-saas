import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../features/auth/authSlice';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Container,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as AssignmentIcon,
  EventNote as EventNoteIcon,
  People as PeopleIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';

const drawerWidth = 260;

export default function DashboardLayout({ children }) {
  const theme = useTheme();
  const router = useRouter();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { notifications } = useSelector((state) => state.notifications);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsMenuAnchor, setNotificationsMenuAnchor] = useState(null);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // If user is not authenticated, redirect to login
  useEffect(() => {
    // Check local storage first
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // If we have token and user in local storage but not in Redux
    if (token && storedUser && !user) {
      try {
        const parsedUser = JSON.parse(storedUser);
        // Dispatch login success to restore session
        dispatch(loginSuccess({ token, user: parsedUser }));
        return; // Don't redirect yet
      } catch (e) {
        console.error('Error parsing stored user data:', e);
      }
    }
    
    // If no token or no user after restoration attempt, redirect to login
    if (!token || !user) {
      console.log('No authentication detected, redirecting to login');
      router.push('/login');
    }
  }, [user, router, dispatch]);
  
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };
  
  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };
  
  const handleNotificationsMenuOpen = (event) => {
    setNotificationsMenuAnchor(event.currentTarget);
  };
  
  const handleNotificationsMenuClose = () => {
    setNotificationsMenuAnchor(null);
  };
  
  const handleLogout = () => {
    dispatch(logout());
    router.push('/login');
  };
  
  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Projects', icon: <AssignmentIcon />, path: '/projects' },
    { text: 'Tasks', icon: <EventNoteIcon />, path: '/tasks' },
    { text: 'Team', icon: <PeopleIcon />, path: '/team' },
  ];
  
  const unreadNotificationsCount = notifications?.filter(n => !n.read).length || 0;
  
  const drawer = (
    <Box>
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: [1],
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6" component="div" color="primary.main">
            ProjectFlow
          </Typography>
        </Box>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle}>
            <ChevronLeftIcon />
          </IconButton>
        )}
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component="a"
              href={item.path}
              selected={router.pathname === item.path}
              onClick={(e) => {
                e.preventDefault();
                router.push(item.path);
                if (isMobile) setMobileOpen(false);
              }}
              sx={{
                '&.Mui-selected': {
                  bgcolor: 'primary.light',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: router.pathname === item.path ? 'primary.main' : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
  
  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
  }
  
  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          boxShadow: 1,
          bgcolor: 'background.paper',
          color: 'text.primary',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                size="large"
                aria-label={`show ${unreadNotificationsCount} new notifications`}
                color="inherit"
                onClick={handleNotificationsMenuOpen}
              >
                <Badge badgeContent={unreadNotificationsCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* Profile Avatar */}
            <Tooltip title="Account settings">
              <IconButton
                onClick={handleProfileMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={Boolean(profileMenuAnchor) ? 'account-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={Boolean(profileMenuAnchor) ? 'true' : undefined}
              >
                <Avatar sx={{ width: 32, height: 32 }}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="dashboard folders"
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          pt: { xs: 8, md: 10 },
        }}
      >
        <Container maxWidth="xl">{children}</Container>
      </Box>
      
      {/* Profile menu */}
      <Menu
        anchorEl={profileMenuAnchor}
        id="account-menu"
        open={Boolean(profileMenuAnchor)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => router.push('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={() => router.push('/profile')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
      
      {/* Notifications menu */}
      <Menu
        anchorEl={notificationsMenuAnchor}
        id="notifications-menu"
        open={Boolean(notificationsMenuAnchor)}
        onClose={handleNotificationsMenuClose}
        onClick={handleNotificationsMenuClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: 360,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Notifications</Typography>
          <Link href="/notifications" passHref legacyBehavior>
            <Typography component="a" variant="body2" color="primary" sx={{ cursor: 'pointer' }}>
              View All
            </Typography>
          </Link>
        </Box>
        <Divider />
        {notifications && notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification) => (
            <MenuItem key={notification._id} onClick={() => router.push('/notifications')}>
              <ListItemIcon>
                <Badge
                  variant="dot"
                  color="primary"
                  invisible={notification.read}
                >
                  <NotificationsIcon fontSize="small" />
                </Badge>
              </ListItemIcon>
              <Box>
                <Typography variant="body2" noWrap>
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {new Date(notification.createdAt).toLocaleString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography variant="body2" sx={{ py: 1 }}>No notifications yet</Typography>
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
