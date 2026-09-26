import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
} from '../utils/auth-storage';

import { refreshSession } from './auth.service';

interface RetryableRequestConfig
  extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    'http://localhost:3000/api',

  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest =
      error.config as RetryableRequestConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();

    if (!refreshToken) {
      clearAuthSession();

      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const response = await refreshSession({
        refreshToken,
      });

      updateAuthTokens(
        response.data.accessToken,
        response.data.refreshToken,
      );

      originalRequest.headers.Authorization =
        `Bearer ${response.data.accessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearAuthSession();

      return Promise.reject(refreshError);
    }
  },
);

export default api;