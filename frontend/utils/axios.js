import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:8000/GCWC/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add an interceptor to include the Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Retrieve the token from localStorage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
