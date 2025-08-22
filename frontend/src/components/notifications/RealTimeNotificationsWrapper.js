import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import RealTimeNotifications from './RealTimeNotifications';

// This is a wrapper component that will only render in client-side
const RealTimeNotificationsWrapper = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <RealTimeNotifications />;
};

export default RealTimeNotificationsWrapper;
