import { io } from 'socket.io-client';
import { updateLocalTask } from '../features/tasks/taskSlice';
import { updateLocalProject } from '../features/projects/projectSlice';
import { addNotification } from '../features/notifications/notificationSlice';
import { showNotification } from '../features/ui/uiSlice';

let socket;

export const initializeSocket = (store) => {
  console.log("Initializing socket connection");
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  
  // Close existing socket if any
  if (socket) {
    socket.disconnect();
  }
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    reconnection: true,
    extraHeaders: {
      'x-tenant-id': localStorage.getItem('tenantId') || ''
    },
    timeout: 10000
  });
  // Listen for connect event
  socket.on('connect', () => {
    console.log('Socket connected with ID:', socket.id);
    
    // Join tenant room
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      console.log('Joining tenant room:', tenantId);
      socket.emit('join-tenant', tenantId);
    }
    
    // Join user-specific room
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        if (user && user._id) {
          console.log('Joining user room:', `user:${user._id}`);
          socket.emit('join-user-room', user._id);
        }
      } catch (err) {
        console.error('Error parsing user data for socket room:', err);
      }
    }
    
    // Also get user from Redux store as backup
    const currentUser = store.getState().auth.user;
    if (currentUser && currentUser._id) {
      console.log('Joining user room from Redux state:', `user:${currentUser._id}`);
      socket.emit('join-user-room', currentUser._id);
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  // Add test notification handler
  socket.on('test-notification', (data) => {
    console.log('Test notification received:', data);
    store.dispatch(showNotification({
      message: data.message || 'Test notification',
      type: 'success',
      relatedResource: null
    }));
  });
  socket.on('task-updated', (data) => {
    store.dispatch(updateLocalTask(data));
    
    store.dispatch(showNotification({
      message: `Task "${data.title}" was updated`,
      type: 'info'
    }));
  });
  
  socket.on('task-assigned', (data) => {
    try {
      console.log('Received task assignment:', data);
      
      // Update task in state if it exists
      if (data && data.task) {
        store.dispatch(updateLocalTask(data.task));
      }
      
      // Get current user ID from store
      const currentUserId = store.getState().auth.user?._id;
      console.log('Current user ID:', currentUserId);
      console.log('Task assigned to:', data?.assignedTo);
      
      // Check if this task is assigned to the current user
      const isAssignedToCurrentUser = 
        data?.assignedTo === currentUserId || 
        data.task?.assignedTo === currentUserId ||
        data.task?.assignedTo?._id === currentUserId;
      
      console.log('Is assigned to current user:', isAssignedToCurrentUser);
      
      // Only show notification if task is assigned to current user
      if (isAssignedToCurrentUser) {
        const taskTitle = data.task?.title || 'New task';
        const taskId = data.task?._id;
        
        if (taskId) {
          console.log('Showing task assignment notification');
          
          // Add to notifications collection
          const notificationData = {
            _id: new Date().getTime().toString(),
            type: 'task_assigned',
            title: 'Task assigned to you',
            message: `Task "${taskTitle}" was assigned to you`,
            read: false,
            createdAt: new Date().toISOString(),
            relatedResource: {
              resourceType: 'task',
              resourceId: taskId
            }
          };
          
          // Add to notifications collection
          store.dispatch(addNotification(notificationData));
          
          // Show toast notification
          store.dispatch(showNotification({
            message: `Task "${taskTitle}" was assigned to you`,
            type: 'info',
            relatedResource: {
              resourceType: 'task',
              resourceId: taskId
            }
          }));
        }
      }
    } catch (error) {
      console.error('Error handling task-assigned event:', error);
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
    try {
      console.log('Received notification:', data);
      
      // Get current user ID from store
      const currentUserId = store.getState().auth.user?._id;
      
      if (!currentUserId) {
        console.log('No currentUserId found, skipping notification');
        return;
      }
      
      console.log('Current user ID:', currentUserId);
      console.log('Notification recipient:', data?.recipient);
      
      // Check if notification is for current user
      const isForCurrentUser = 
        data?.recipient === currentUserId || 
        data?.recipient?._id === currentUserId;
      
      console.log('Is notification for current user:', isForCurrentUser);
      
      // Only process notifications meant for this user
      if (isForCurrentUser || !data.recipient) {
        console.log('Processing notification for current user');
        
        // Add to notifications collection in Redux
        store.dispatch(addNotification(data));
        
        // Show toast notification
        console.log('Showing notification:', data.title || data.message);
        store.dispatch(showNotification({
          message: data.title || data.message || 'New notification',
          type: 'info',
          relatedResource: data.relatedResource || null
        }));
      } else {
        console.log('Ignoring notification not intended for current user');
      }
    } catch (error) {
      console.error('Error handling notification event:', error);
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
