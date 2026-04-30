import axios from 'axios';

// 🔥 Base URL (backend)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// -----------------------------
// 🔐 AUTH TOKEN INTERCEPTOR
// -----------------------------
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cryptoBean_token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// -----------------------------
// 🔁 GLOBAL ERROR HANDLER
// -----------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error?.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default api;
