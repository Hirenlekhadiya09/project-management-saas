import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import dynamic from 'next/dynamic';

// Dynamically import RealTimeNotifications with no SSR to avoid hydration issues
const RealTimeNotifications = dynamic(() => import('./RealTimeNotifications'), { 
  ssr: false 
});

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
