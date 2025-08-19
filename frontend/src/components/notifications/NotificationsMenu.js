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
  deleteNotification
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
  
  const handleNavigate = (notification) => {
    // Close menu
    onClose();
    
    // Mark as read
    if (!notification.read) {
      dispatch(markAsRead([notification._id]));
    }
    
    // Navigate to related resource
    if (notification.relatedResource) {
      const { resourceType, resourceId } = notification.relatedResource;
      
      if (resourceType === 'task') {
        router.push(`/tasks/${resourceId}`);
      } else if (resourceType === 'project') {
        router.push(`/projects/${resourceId}`);
      } else if (resourceType === 'user') {
        router.push(`/team/${resourceId}`);
      }
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
          p: 1,
          px: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          Notifications {unreadCount > 0 && `(${unreadCount})`}
        </Typography>
        <Box>
          <IconButton size="small" onClick={handleRefresh}>
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
                whiteSpace: 'normal',
              }}
            >
              <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
              <ListItemText
                primary={notification.title}
                secondary={
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Typography variant="body2" noWrap>
                      {notification.message}
                    </Typography>
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
              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {!notification.read && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(notification._id);
                    }}
                  >
                    <ReadIcon fontSize="small" />
                  </IconButton>
                )}
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(notification._id);
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
      
      {unreadCount > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 1 }}>
          <Button 
            size="small" 
            onClick={handleMarkAllAsRead}
            disabled={isLoading}
          >
            Mark all as read
          </Button>
        </Box>
      )}
    </Menu>
  );
};

export default NotificationsMenu;
