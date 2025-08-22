import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { initializeSocket } from '../../utils/socket';

/**
 * Component to handle socket initialization based on auth state
 * This ensures sockets are properly connected when users log in
 * and properly join their user-specific rooms
 */
const SocketHandler = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  useEffect(() => {
    // Only initialize socket when user is authenticated
    if (isAuthenticated && user && user._id) {
      console.log('🔄 Auth state changed, re-initializing socket connection');
      initializeSocket(window.__REDUX_STORE__);
    }
  }, [isAuthenticated, user]);
  
  // No UI rendered
  return null;
};

export default SocketHandler;
