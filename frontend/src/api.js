import axios from 'axios';

// Shared Axios instance that automatically attaches JWT from localStorage.
// Uses Vite proxy in development (configured in vite.config.js)
// In production, set VITE_API_URL environment variable
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sfv_token');
  if (token) {
    // Attach Authorization header for protected backend routes
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;




