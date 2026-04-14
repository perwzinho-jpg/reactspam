import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track shown errors to prevent duplicates
let shownErrors = new Set();

// Clear shown errors after 3 seconds
const clearShownError = (key) => {
  setTimeout(() => shownErrors.delete(key), 3000);
};

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message;

    // Handle 401 - Unauthorized
    if (status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle 403 with specific message - show only once
    if (status === 403 && message) {
      const errorKey = `403-${message}`;
      if (!shownErrors.has(errorKey)) {
        shownErrors.add(errorKey);
        toast.error(message, { id: errorKey });
        clearShownError(errorKey);
      }
      // Mark error as handled to prevent components from showing it again
      error.handled = true;
    }

    return Promise.reject(error);
  }
);

export default api;
