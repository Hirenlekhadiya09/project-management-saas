import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSelector, useDispatch } from 'react-redux';
import Link from 'next/link';
import Image from 'next/image';
import { 
  AppBar, 
  Toolbar, 
  IconButton, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Divider,
  Box,
  Menu,
  MenuItem,
  Badge,
  Avatar,
  Typography,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Assignment as TaskIcon,
  People as PeopleIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle,
  Brightness4,
  Brightness7,
  ChevronLeft,
} from '@mui/icons-material';

import { toggleSidebar, setSidebarState, toggleDarkMode } from '../../features/ui/uiSlice';
import { logout } from '../../features/auth/authSlice';
import { getNotifications } from '../../features/notifications/notificationSlice';
import NotificationsMenu from '../notifications/NotificationsMenu';

const drawerWidth = 240;

const DashboardLayout = ({ children }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, darkMode } = useSelector((state) => state.ui);
  const { unreadCount } = useSelector((state) => state.notifications);
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const isMenuOpen = Boolean(anchorEl);
  const isNotificationsOpen = Boolean(notificationsAnchor);
  
  const isMobile = useMediaQuery('(max-width:768px)');
  
  useEffect(() => {
    // Close sidebar on mobile
    if (isMobile) {
      dispatch(setSidebarState(false));
    }
    
    // Get notifications
    dispatch(getNotifications());
    
    // Set up notification polling interval
    const interval = setInterval(() => {
      dispatch(getNotifications());
    }, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, [dispatch, isMobile]);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };
  
  const handleLogout = () => {
    handleMenuClose();
    dispatch(logout());
    router.push('/login');
  };
  
  const menuItems = [
    {
      text: 'Dashboard',
      icon: <DashboardIcon />,
      path: '/dashboard',
    },
    {
      text: 'Projects',
      icon: <DashboardIcon />,
      path: '/projects',
    },
    {
      text: 'Tasks',
      icon: <TaskIcon />,
      path: '/tasks',
    },
  ];
  
  // Add admin-only menu items
  if (user && user.role === 'admin') {
    menuItems.push({
      text: 'Team',
      icon: <PeopleIcon />,
      path: '/team',
    });
    
    menuItems.push({
      text: 'Settings',
      icon: <SettingsIcon />,
      path: '/settings',
    });
  }
  
  const profileMenu = (
    <Menu
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      keepMounted
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      open={isMenuOpen}
      onClose={handleMenuClose}
    >
      <MenuItem onClick={() => { handleMenuClose(); router.push('/profile'); }}>
        Profile
      </MenuItem>
      <MenuItem onClick={handleLogout}>Logout</MenuItem>
    </Menu>
  );
  
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          transition: (theme) => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && {
            marginLeft: drawerWidth,
            width: `calc(100% - ${drawerWidth}px)`,
            transition: (theme) => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={() => dispatch(toggleSidebar())}
            edge="start"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Project Management
          </Typography>
          
          {/* Dark mode toggle */}
          <IconButton color="inherit" onClick={() => dispatch(toggleDarkMode())}>
            {darkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
          
          {/* Notifications */}
          <IconButton
            color="inherit"
            aria-label="notifications"
            aria-haspopup="true"
            onClick={handleNotificationsOpen}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          {/* User menu */}
          <IconButton
            edge="end"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleProfileMenuOpen}
            color="inherit"
          >
            {user?.avatar ? (
              <Avatar alt={user.name} src={user.avatar} sx={{ width: 32, height: 32 }} />
            ) : (
              <AccountCircle />
            )}
          </IconButton>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar / Drawer */}
      <Drawer
        variant={isMobile ? 'temporary' : 'persistent'}
        open={sidebarOpen}
        onClose={() => dispatch(setSidebarState(false))}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
          },
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <Typography variant="h6" noWrap component="div">
              Menu
            </Typography>
            <IconButton onClick={() => dispatch(toggleSidebar())}>
              <ChevronLeft />
            </IconButton>
          </Box>
        </Toolbar>
        <Divider />
        <List>
          {menuItems.map((item) => (
            <ListItem
              button
              key={item.text}
              component={Link}
              href={item.path}
              sx={{
                backgroundColor: router.pathname === item.path ? 'rgba(0, 0, 0, 0.08)' : 'transparent',
              }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)` },
          marginTop: '64px', // Height of the AppBar
          transition: (theme) => theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(sidebarOpen && {
            transition: (theme) => theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
            marginLeft: 0,
          }),
        }}
      >
        {children}
      </Box>
      
      {/* Notifications menu */}
      <NotificationsMenu
        anchorEl={notificationsAnchor}
        open={isNotificationsOpen}
        onClose={handleNotificationsClose}
      />
      
      {/* Profile menu */}
      {profileMenu}
    </Box>
  );
};

export default DashboardLayout;
