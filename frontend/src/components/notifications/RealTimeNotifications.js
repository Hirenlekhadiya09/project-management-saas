import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { addNotification } from '../../features/notifications/notificationSlice';
import { showNotification, hideNotification } from '../../features/ui/uiSlice';
import { useRouter } from 'next/router';

// For debugging
const DEBUG = true; // Enable debugging to track notifications

const RealTimeNotifications = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const uiState = useSelector((state) => state.ui);
  
  // Make sure the notification object exists with proper structure
  const notification = uiState?.notification || { 
    open: false, 
    message: '', 
    type: 'info',
    relatedResource: null
  };
  
  // Log for debugging
  useEffect(() => {
    if (DEBUG) {
      console.log('RealTimeNotifications rendered with:', { notification, uiState });
    }
  }, [notification, uiState]);
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideNotification());
  };
  
  const handleViewDetails = () => {
    try {
      if (notification.relatedResource) {
        const { resourceType, resourceId } = notification.relatedResource;
        
        if (resourceType === 'task') {
          router.push(`/tasks/${resourceId}`);
        } else if (resourceType === 'project') {
          router.push(`/projects/${resourceId}`);
        }
      }
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
    dispatch(hideNotification());
  };
  
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'top', // Changed to top to make more visible
        horizontal: 'center', // Changed to center to make more visible
      }}
      open={Boolean(notification.open)}
      autoHideDuration={notification.duration || 6000}
      onClose={handleClose}
    >
      <Alert
        onClose={handleClose}
        severity={notification.type || 'info'}
        variant="filled" // Make alerts more visible
        elevation={6}
        sx={{ 
          width: '100%', 
          minWidth: '300px',
          cursor: 'pointer',
          '& .MuiAlert-message': {
            fontSize: '1rem', // Larger text
          }
        }}
        onClick={handleViewDetails}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={(e) => {
              e.stopPropagation(); // Prevent triggering onClick of parent Alert
              handleClose(e);
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {notification.message || ''}
      </Alert>
    </Snackbar>
  );
};

export default RealTimeNotifications;
