// Re-exports the raw axios instance so pages can call custom endpoints directly
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8082/api',
  headers: { 'Content-Type': 'application/json' },
});

// sessionStorage : propre à chaque onglet/fenêtre, voir services/api.js pour le détail.
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('auth_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      if (window.location.pathname !== '/login') {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
