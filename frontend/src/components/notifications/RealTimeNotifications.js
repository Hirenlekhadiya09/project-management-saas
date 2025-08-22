import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Snackbar, Alert, IconButton } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { addNotification } from '../../features/notifications/notificationSlice';
import { showNotification, hideNotification } from '../../features/ui/uiSlice';
import { useRouter } from 'next/router';

const RealTimeNotifications = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const { notification, open } = useSelector((state) => state.ui.notification || { notification: null, open: false });
  
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    dispatch(hideNotification());
  };
  
  const handleViewDetails = () => {
    if (notification && notification.relatedResource) {
      const { resourceType, resourceId } = notification.relatedResource;
      
      if (resourceType === 'task') {
        router.push(`/tasks/${resourceId}`);
      } else if (resourceType === 'project') {
        router.push(`/projects/${resourceId}`);
      }
    }
    dispatch(hideNotification());
  };

  if (!notification || typeof notification !== 'object') {
    return null;
  }
  
  return (
    <Snackbar
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      open={Boolean(open)}
      autoHideDuration={6000}
      onClose={handleClose}
      action={
        <>
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </>
      }
    >
      <Alert
        onClose={handleClose}
        severity={notification?.type || 'info'}
        sx={{ width: '100%', cursor: 'pointer' }}
        onClick={handleViewDetails}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      >
        {notification?.message}
      </Alert>
    </Snackbar>
  );
};

export default RealTimeNotifications;
