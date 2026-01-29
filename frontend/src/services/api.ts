import axios from 'axios';

// Determine the correct base URL based on environment
const getBaseURL = () => {
  // In development, use relative URL to leverage Vite proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // In production/preview, use the actual backend URL
  // You can set this via environment variable or use a default
  return import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
};

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if the error is 401 and we are not already on the login page
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;