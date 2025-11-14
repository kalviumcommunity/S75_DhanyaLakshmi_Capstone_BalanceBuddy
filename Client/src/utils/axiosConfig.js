import axios from 'axios';

// Create a reusable axios instance with credentials configuration
const api = axios.create({
  baseURL: 'https://s75-dhanyalakshmi-capstone-balancebuddy.onrender.com/api', // Use localhost for development
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// For production, you can uncomment and use this instead:
// const api = axios.create({
//   baseURL: 'https://s75-dhanyalakshmi-capstone-balancebuddy.onrender.com/api',
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

// Add a request interceptor to ensure the token is included
api.interceptors.request.use(
  config => {
    // Get the token from cookies if it exists
    const cookies = document.cookie.split(';').reduce((cookies, cookie) => {
      const [name, value] = cookie.trim().split('=');
      cookies[name] = value;
      return cookies;
    }, {});
    
    // Try to get token from cookies first
    let token = cookies.token;
    
    // If not in cookies, try localStorage
    if (!token) {
      token = localStorage.getItem('authToken');
    }
    
    // If token exists, add it to the headers
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Token added to request headers');
    } else {
      console.log('No token found in cookies or localStorage');
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle authentication errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      console.log('Authentication error detected, redirecting to login');
      // Clear any existing tokens
      localStorage.removeItem('authToken');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      // Redirect to login page if unauthorized
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;