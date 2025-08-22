import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import RealTimeNotifications from './RealTimeNotifications';

// This is a wrapper component that will only render in client-side
const RealTimeNotificationsWrapper = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const [isMounted, setIsMounted] = useState(false);
  
  // Use useEffect for client-side rendering
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // Only render on client-side and when authenticated
  if (!isMounted || !isAuthenticated || !user) {
    return null;
  }
  
  return <RealTimeNotifications />;
};

export default RealTimeNotificationsWrapper;
