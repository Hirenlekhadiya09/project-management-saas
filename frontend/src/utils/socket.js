import { io } from 'socket.io-client';
import { updateLocalTask } from '../features/tasks/taskSlice';
import { updateLocalProject } from '../features/projects/projectSlice';
import { addNotification } from '../features/notifications/notificationSlice';
import { showNotification } from '../features/ui/uiSlice';

let socket;

export const initializeSocket = (store) => {
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    extraHeaders: {
      'x-tenant-id': localStorage.getItem('tenantId') || ''
    },
    timeout: 10000
  });
  socket.on('connect', () => {
    console.log('Socket connected');
    
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      socket.emit('join-tenant', tenantId);
    }
    
    // Join user-specific room
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user._id) {
          socket.emit('join-user-room', user._id);
        }
      } catch (err) {
        console.error('Error parsing user data for socket room:', err);
      }
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  socket.on('task-updated', (data) => {
    store.dispatch(updateLocalTask(data));
    
    store.dispatch(showNotification({
      message: `Task "${data.title}" was updated`,
      type: 'info'
    }));
  });
  
  socket.on('task-assigned', (data) => {
    // Update task in state if it exists
    if (data.task) {
      store.dispatch(updateLocalTask(data.task));
    }
    
    // Get current user ID from store
    const currentUserId = store.getState().auth.user?._id;
    
    // Only show notification if the current user is the assignee
    if (currentUserId && data.assignedTo && data.assignedTo._id === currentUserId) {
      store.dispatch(showNotification({
        message: `Task "${data.task.title}" was assigned to you`,
        type: 'info',
        relatedResource: {
          resourceType: 'task',
          resourceId: data.task._id
        }
      }));
    }
  });
  
  socket.on('project-updated', (data) => {
    // Update project in state
    store.dispatch(updateLocalProject(data));
    
    // Show notification
    store.dispatch(showNotification({
      message: `Project "${data.name}" was updated`,
      type: 'info'
    }));
  });
  
  socket.on('notification', (data) => {
    // Get current user ID from store
    const currentUserId = store.getState().auth.user?._id;
    
    // Only add notification if it's meant for the current user
    if (currentUserId && data.recipient === currentUserId) {
      store.dispatch(addNotification(data));
      
      store.dispatch(showNotification({
        message: data.title,
        type: 'info',
        relatedResource: data.relatedResource
      }));
    }
  });
  
  return socket;
};

export const joinProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('join-project', projectId);
  }
};

export const leaveProjectRoom = (projectId) => {
  if (socket && projectId) {
    socket.emit('leave-project', projectId);
  }
};

export const emitTaskUpdate = (taskData) => {
  if (socket) {
    socket.emit('task-update', taskData);
  }
};

export const emitTaskAssigned = (taskData) => {
  if (socket) {
    socket.emit('task-assigned', taskData);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export default socket;
