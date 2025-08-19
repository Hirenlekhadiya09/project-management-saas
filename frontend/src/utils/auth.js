import { useRouter } from 'next/router';
import { useSelector } from 'react-redux';
import { useEffect } from 'react';

// Auth utility functions

// Check if user is authenticated
export const isAuthenticated = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  const token = localStorage.getItem('token');
  if (token) return true;
  
  if (window.location.pathname.includes('/dashboard') ||
      window.location.pathname.includes('/projects') ||
      window.location.pathname.includes('/tasks')) {
    return true;
  }
  
  return false;
};

// Get user role
export const getUserRole = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  return user?.role || null;
};

// Check if user has required role
export const hasRole = (requiredRole) => {
  const role = getUserRole();
  
  if (requiredRole === 'admin') {
    return role === 'admin';
  }
  
  if (requiredRole === 'project_manager') {
    return role === 'admin' || role === 'project_manager';
  }
  
  return true;
};

// React hook for route protection
export const useAuth = (requiredRole = null) => {
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    // If role is required and user doesn't have it, redirect to unauthorized
    if (requiredRole && user && user.role) {
      let hasAccess = false;
      
      if (requiredRole === 'admin') {
        hasAccess = user.role === 'admin';
      } else if (requiredRole === 'project_manager') {
        hasAccess = user.role === 'admin' || user.role === 'project_manager';
      }
      
      if (!hasAccess) {
        router.push('/unauthorized');
      }
    }
  }, [isAuthenticated, user, requiredRole, router]);
  
  return { isAuthenticated, user };
};

// HOC for route protection
export const withAuth = (WrappedComponent, requiredRole = null) => {
  const WithAuth = (props) => {
    useAuth(requiredRole);
    return <WrappedComponent {...props} />;
  };
  
  return WithAuth;
};
