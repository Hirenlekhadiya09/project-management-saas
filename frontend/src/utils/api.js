import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 10000,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

api.interceptors.request.use(
  (config) => {
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId) {
      config.headers['x-tenant-id'] = tenantId;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    config.withCredentials = false;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    
    if (error.response?.status === 404) {
      if (originalRequest.url.includes('/users') || 
          originalRequest.url.includes('/tasks') || 
          originalRequest.url.includes('/projects')) {
        return Promise.resolve({ data: { success: true, data: [] } });
      }
    }
    
    if (error.message === 'Network Error' || !error.response) {
      console.error('Network error detected - possible CORS issue:', error);
      return Promise.reject({
        response: {
          data: {
            success: false,
            message: 'Unable to connect to the server. Please check your connection and try again.'
          }
        }
      });
    }
    
    return Promise.reject(error);
  }
);

export default api;
