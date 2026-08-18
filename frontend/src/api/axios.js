import axios from 'axios';

const API = axios.create({
  baseURL: 'https://laevateinn707-gnit-api.hf.space',
  headers: {
    'Content-Type': 'application/json'
  }
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const esRutaAuth = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/forgot-password');
    if (error.response?.status === 401 && !esRutaAuth) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default API;
