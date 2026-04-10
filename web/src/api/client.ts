import axios, { type AxiosInstance } from 'axios';
import { getAuthToken, useAuthStore } from '../stores/auth.store';

const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:4919/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response.data?.data || response.data,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/');
    if (
      !isAuthRequest &&
      (error.response?.status === 401 || error.response?.status === 403)
    ) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    const serverMessage = error.response?.data?.error?.message;
    if (serverMessage) {
      error.message = serverMessage;
    }
    return Promise.reject(error);
  },
);
