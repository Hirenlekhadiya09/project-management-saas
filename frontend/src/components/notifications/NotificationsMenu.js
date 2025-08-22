import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Menu, 
  MenuItem, 
  Typography, 
  Button, 
  Divider, 
  Box, 
  IconButton, 
  ListItemIcon, 
  ListItemText,
  CircularProgress
} from '@mui/material';
import { 
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as ReadIcon,
  Assignment as TaskIcon,
  Dashboard as ProjectIcon,
  People as UserIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/router';
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from '../../features/notifications/notificationSlice';
import { formatDistanceToNow } from 'date-fns';

const NotificationsMenu = ({ anchorEl, open, onClose }) => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { notifications, isLoading, unreadCount } = useSelector((state) => state.notifications);
  const [selectedId, setSelectedId] = useState(null);
  
  const handleRefresh = () => {
    dispatch(getNotifications());
  };
  
  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };
  
  const handleMarkAsRead = (id) => {
    dispatch(markAsRead([id]));
  };
  
  const handleDelete = (id) => {
    setSelectedId(id);
    dispatch(deleteNotification(id));
  };
  
  const [clearingAll, setClearingAll] = useState(false);
  
  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      setClearingAll(true);
      await dispatch(clearAllNotifications());
      setClearingAll(false);
    }
  };
  
  const handleNavigate = (notification) => {
    // Close menu
    onClose();
    
    // Mark as read first to prevent any issues
    if (!notification.read) {
      console.log(`Marking notification ${notification._id} as read`);
      dispatch(markAsRead([notification._id]));
    }
    
    try {
      // Navigate to related resource
      if (notification.relatedResource) {
        const { resourceType, resourceId } = notification.relatedResource;
        
        // Make sure resourceId exists before navigating
        if (resourceId) {
          if (resourceType === 'task') {
            router.push(`/tasks/${resourceId}`);
          } else if (resourceType === 'project') {
            router.push(`/projects/${resourceId}`);
          } else if (resourceType === 'user') {
            router.push(`/team/${resourceId}`);
          }
        } else {
          console.error('Missing resourceId in notification:', notification);
        }
      } else {
        // If there's no related resource, just acknowledge the notification
        console.log('Notification has no related resource to navigate to');
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
      // Show a user-friendly error message
      alert('Unable to open the related item. It may have been deleted or moved.');
    }
  };
  
  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    if (type.includes('task')) {
      return <TaskIcon fontSize="small" />;
    } else if (type.includes('project')) {
      return <ProjectIcon fontSize="small" />;
    } else if (type.includes('user')) {
      return <UserIcon fontSize="small" />;
    }
    return null;
  };
  
  // Format date
  const formatDate = (date) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch (error) {
      return '';
    }
  };
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: 320, maxWidth: '100%', maxHeight: 400 },
      }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1.5,
          px: 2,
          backgroundColor: theme => theme.palette.primary.main,
          color: 'white'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Typography>
        <Box>
          <IconButton size="small" onClick={handleRefresh} sx={{ color: 'white' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      <Divider />
      
      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress size={24} />
        </Box>
      ) : notifications.length > 0 ? (
        <>
          {notifications.map((notification) => (
            <MenuItem
              key={notification._id}
              onClick={() => handleNavigate(notification)}
              selected={notification._id === selectedId}
              sx={{
                backgroundColor: notification.read ? 'transparent' : 'rgba(25, 118, 210, 0.08)',
                borderLeft: notification.read ? 'none' : '4px solid #1890ff',
                whiteSpace: 'normal',
                '&:hover': {
                  backgroundColor: theme => theme.palette.action.hover
                }
              }}
            >
              <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
              <ListItemText
                primary={
                  <Typography variant="subtitle2" fontWeight="medium">
                    {notification.title || 'Notification'}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" sx={{ whiteSpace: 'normal' }}>
                      {notification.message || 'You have a new notification'}
                    </Typography>
                    
                    {notification.type === 'task_assigned' && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 0.5,
                          color: theme => theme.palette.info.dark,
                          fontStyle: 'italic'
                        }}
                      >
                        Click to view task details
                      </Typography>
                    )}
                    
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      {formatDate(notification.createdAt)}
                    </Typography>
                  </Box>
                }
                sx={{ mr: 1 }}
              />
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {!notification.read && (
                  <IconButton
                    size="small"
                    title="Mark as read"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification._id);
                    }}
                    sx={{ 
                      color: theme => theme.palette.info.main,
                      '&:hover': { bgcolor: 'rgba(25, 118, 210, 0.1)' }
                    }}
                  >
                    <ReadIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  title="Delete notification"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
                  }}
                  sx={{ 
                    color: theme => theme.palette.error.main,
                    '&:hover': { bgcolor: 'rgba(211, 47, 47, 0.1)' }
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </MenuItem>
          ))}
        </>
      ) : (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography>No notifications</Typography>
        </Box>
      )}
      
      <Divider />
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          p: 1.5, 
          bgcolor: theme => theme.palette.grey[100]
        }}
      >
        {unreadCount > 0 ? (
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            disabled={isLoading}
            color="primary"
            variant="outlined"
            startIcon={<ReadIcon />}
          >
            Mark all read
          </Button>
        ) : (
          <div></div> // Empty div to maintain flex spacing
        )}
        
        {notifications.length > 0 && (
          <Button 
            size="small" 
            onClick={handleClearAll}
            disabled={isLoading || clearingAll}
            color="error"
            variant="contained"
            startIcon={clearingAll ? <CircularProgress size={16} color="inherit" /> : <DeleteIcon />}
          >
            {clearingAll ? 'Clearing...' : 'Clear all'}
          </Button>
        )}
      </Box>
    </Menu>
  );
};

export default NotificationsMenu;
