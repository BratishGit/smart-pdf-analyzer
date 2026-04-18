// Central Axios instance — reads base URL from environment or falls back to localhost
// In production build, set REACT_APP_API_URL=https://your-domain.com/api
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
});

// Attach JWT token automatically to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 (expired/invalid token) → clear storage and redirect to login
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/** Conversational chat with a document */
export const chatWithDocument = (documentId, question, mode = 'detailed') =>
  api.post('/chat', { documentId, question, mode });

/** Get saved Q&A history for a document */
export const getDocumentChatHistory = (documentId) =>
  api.get(`/history/${documentId}`);

/** Get system analytics */
export const getSystemAnalytics = () =>
  api.get('/analytics');

export default api;
