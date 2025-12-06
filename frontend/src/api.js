// import axios from 'axios';

// // Shared Axios instance that automatically attaches JWT from localStorage.
// const api = axios.create();

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem('sfv_token');
//   if (token) {
//     // Attach Authorization header for protected backend routes
//     config.headers = config.headers || {};
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

// export default api;




// api.js - UPDATED WITH DEBUGGING
import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:4000', // Adjust if your backend runs on different port
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sfv_token');
  console.log('API Request - Token exists:', !!token);
  console.log('API Request - Token value:', token ? token.substring(0, 20) + '...' : 'No token');
  
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    console.log('API Request - Headers:', config.headers);
  }
  return config;
});

// Response interceptor for debugging
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('API Response Error:', {
      url: error.config?.url,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.config?.headers
    });
    
    // If token is invalid, clear it and redirect to login
    if (error.response?.status === 401) {
      console.log('Token invalid, clearing...');
      localStorage.removeItem('sfv_token');
      localStorage.removeItem('sfv_user');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;