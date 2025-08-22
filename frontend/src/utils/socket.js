import { io } from 'socket.io-client';
import { updateLocalTask } from '../features/tasks/taskSlice';
import { updateLocalProject } from '../features/projects/projectSlice';
import { addNotification } from '../features/notifications/notificationSlice';
import { showNotification } from '../features/ui/uiSlice';

let socket;

export const initializeSocket = (store) => {
  console.log("🔌 Initializing socket connection");
  const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';
  
  // Close existing socket if any
  if (socket) {
    console.log("Disconnecting existing socket");
    socket.disconnect();
  }
  
  // Get current user ID before initializing socket
  const currentState = store.getState();
  const currentUser = currentState?.auth?.user;
  const userIdFromRedux = currentUser?._id;
  
  // Try to get user ID from localStorage as backup
  let userIdFromStorage = null;
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsedUser = JSON.parse(userData);
      userIdFromStorage = parsedUser?._id;
    }
  } catch (e) {
    console.error("Error parsing user from localStorage", e);
  }
  
  // Use Redux user ID if available, otherwise localStorage
  const userId = userIdFromRedux || userIdFromStorage;
  console.log(`🔑 User ID for socket connection: ${userId || 'Not found'}`);
  
  socket = io(SOCKET_URL, {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    autoConnect: true,
    reconnection: true,
    extraHeaders: {
      'x-tenant-id': localStorage.getItem('tenantId') || '',
      'x-user-id': userId || ''  // Add user ID in headers for easier authentication
    },
    timeout: 10000,
    query: {
      userId: userId  // Also include in query for servers that prefer query params
    }
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
    
    // Join user-specific room from all possible sources
    let userId = null;
    
    // Try localStorage
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        if (user && user._id) {
          userId = user._id;
          console.log('Found user ID in localStorage:', userId);
        }
      }
    } catch (err) {
      console.error('Error parsing user data from localStorage:', err);
    }
    
    // Try Redux store if not found in localStorage
    if (!userId) {
      const currentUser = store.getState().auth.user;
      if (currentUser && currentUser._id) {
        userId = currentUser._id;
        console.log('Found user ID in Redux store:', userId);
      }
    }
    
    // Join user room if we found a user ID
    if (userId) {
      console.log('Joining user room:', `user:${userId}`);
      socket.emit('join-user-room', userId);
      
      // Also emit a request for test notification to verify connection
      socket.emit('request-test-notification', { userId });
    } else {
      console.warn('No user ID found, cannot join user-specific room');
    }
  });
  
  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });
  
  // Add test notification handler with enhanced visibility
  socket.on('test-notification', (data) => {
    console.log('📣 TEST NOTIFICATION RECEIVED:', data);
    
    // Always show test notifications visibly for debugging
    store.dispatch(showNotification({
      message: data.message || 'Test notification',
      type: 'warning', // Use warning color to make it more visible
      relatedResource: null,
      duration: 10000 // Show for longer (10 seconds)
    }));
    
    // Also add to notification collection for debugging
    store.dispatch(addNotification({
      _id: new Date().getTime().toString(),
      type: 'test',
      title: 'Test Notification',
      message: data.message || 'Test notification',
      read: false,
      createdAt: new Date().toISOString()
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
      console.log('📬 NOTIFICATION RECEIVED:', data);
      
      // Get current user ID from store
      const currentUserId = store.getState().auth.user?._id;
      
      if (!currentUserId) {
        console.log('⚠️ No currentUserId found, skipping notification');
        return;
      }
      
      console.log('👤 Current user ID:', currentUserId);
      console.log('🎯 Notification recipient:', data?.recipient);
      
      // Convert both IDs to strings for reliable comparison
      const recipientId = typeof data?.recipient === 'object' ? 
        data?.recipient?._id?.toString() : 
        data?.recipient?.toString();
      
      const currentUserIdStr = currentUserId.toString();
      
      // Log the exact comparison values for debugging
      console.log(`🔍 Comparing recipient ID: "${recipientId}" with current user ID: "${currentUserIdStr}"`);
      
      // Check if notification is for current user with string comparison
      const isForCurrentUser = recipientId === currentUserIdStr;
      
      console.log('✓ Is notification for current user:', isForCurrentUser);
      
      // Always show notification during debugging to see what's happening
      console.log('💬 Processing notification: ', data.title || data.message);
      
      // Add to notifications collection in Redux
      store.dispatch(addNotification({
        ...data,
        _id: data._id || new Date().getTime().toString() // Ensure we have an ID
      }));
      
      // Show toast notification
      store.dispatch(showNotification({
        message: data.title || data.message || 'New notification',
        type: 'info',
        relatedResource: data.relatedResource || null,
        duration: 8000 // Show for 8 seconds to make sure it's seen
      }));
    } catch (error) {
      console.error('❌ Error handling notification event:', error);
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
