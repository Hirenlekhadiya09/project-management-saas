import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DashboardLayout from '../components/layouts/DashboardLayout';
import {
  fetchNotifications,
  markNotificationAsRead,
  clearAllNotifications,
} from '../features/notifications/notificationSlice';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  IconButton,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Task as TaskIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Project as ProjectIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

export default function Notifications() {
  const dispatch = useDispatch();
  const { notifications, isLoading, error } = useSelector((state) => state.notifications);
  
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);
  
  const handleMarkAsRead = (notificationId) => {
    dispatch(markNotificationAsRead(notificationId));
  };
  
  const handleClearAll = () => {
    dispatch(clearAllNotifications());
  };
  
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task':
        return <TaskIcon />;
      case 'project':
        return <ProjectIcon />;
      case 'user':
        return <PersonIcon />;
      default:
        return <NotificationsIcon />;
    }
  };
  
  const getNotificationAvatar = (type) => {
    const colors = {
      task: '#2196F3', // blue
      project: '#4CAF50', // green
      user: '#FF9800', // orange
      system: '#9C27B0', // purple
    };
    
    return (
      <Avatar sx={{ bgcolor: colors[type] || colors.system }}>
        {getNotificationIcon(type)}
      </Avatar>
    );
  };
  
  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const notificationTime = new Date(timestamp);
    const diffMs = now - notificationTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return notificationTime.toLocaleDateString();
  };
  
  const unreadCount = notifications.filter((n) => !n.read).length;
  
  return (
    <DashboardLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4">Notifications</Typography>
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              color="primary"
              size="small"
              sx={{ ml: 2 }}
            />
          )}
        </Box>
        {notifications.length > 0 && (
          <Button
            variant="outlined"
            onClick={handleClearAll}
            startIcon={<DeleteIcon />}
          >
            Clear All
          </Button>
        )}
      </Box>
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Paper>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                When you get notifications, they'll show up here
              </Typography>
            </Box>
          ) : (
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {notifications.map((notification, index) => (
                <Box key={notification._id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      bgcolor: notification.read ? 'inherit' : 'action.hover',
                      py: 2,
                    }}
                  >
                    <ListItemAvatar>
                      {getNotificationAvatar(notification.type)}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography
                          variant="subtitle1"
                          sx={{
                            fontWeight: notification.read ? 'normal' : 'bold',
                          }}
                        >
                          {notification.title}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            sx={{ my: 1 }}
                          >
                            {notification.message}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                          >
                            {getTimeAgo(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                    />
                    <ListItemSecondaryAction>
                      {!notification.read && (
                        <Tooltip title="Mark as read">
                          <IconButton
                            edge="end"
                            onClick={() => handleMarkAsRead(notification._id)}
                          >
                            <CheckCircleIcon color="primary" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </List>
          )}
        </Paper>
      )}
    </DashboardLayout>
  );
}
