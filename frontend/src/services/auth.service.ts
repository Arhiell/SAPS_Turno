import authApi from './auth-api';

import type {
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
} from '../types/auth.types';

export const login = async (
  data: LoginRequest,
): Promise<LoginResponse> => {
  const response = await authApi.post<LoginResponse>(
    '/auth/login',
    data,
  );

  return response.data;
};

export const refreshSession = async (
  data: RefreshRequest,
): Promise<RefreshResponse> => {
  const response = await authApi.post<RefreshResponse>(
    '/auth/refresh',
    data,
  );

  return response.data;
};

export const logout = async (
  data: LogoutRequest,
): Promise<void> => {
  await authApi.post('/auth/logout', data);
};