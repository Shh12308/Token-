// src/services/api.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'https://api.yourbackend.com/v1', // Your backend API
  timeout: 10000,
});

// Request interceptor to add the auth token (if any)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken'); // Or get from context
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling common errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access, e.g., redirect to login
      console.error('Unauthorized, please log in.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;
