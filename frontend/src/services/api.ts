import axios from 'axios';
import { EnhancedSignupFormData, RegistrationPayload } from '@/types/enhanced-signup';

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
    if (error.response?.status === 401 && window.location.pathname !== '/login') {
      // Token expired or invalid — preserve React state by dispatching an event
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }
    return Promise.reject(error);
  }
);

// Enhanced signup API functions
export const enhancedSignupAPI = {
  /**
   * Register a new user with enhanced signup data
   * Maps enhanced form data to backend-compatible format
   */
  register: async (formData: EnhancedSignupFormData): Promise<any> => {
    // Map enhanced form data to existing backend format
    const registrationPayload: RegistrationPayload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      profile_picture: formData.profile_picture || '', // Default to empty string
      store_name: formData.store_name,
      store_address: formData.store_address,
      currency_code: formData.currency_code,
    };

    // Make API call to existing registration endpoint
    const response = await api.post('/users/register', registrationPayload);
    return response.data;
  },
};

export default api;