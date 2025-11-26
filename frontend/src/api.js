import axios from 'axios';

// Shared Axios instance that automatically attaches JWT from localStorage.
const api = axios.create();

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




