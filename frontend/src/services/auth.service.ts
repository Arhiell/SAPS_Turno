import authApi from './auth-api';
import api from './api';
import type { RegisterPatientInput, PasswordRecoveryInput, ResetPasswordInput, CompletePatientProfileInput, ProfileResponse } from '../types/auth.types';

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

let pendingRefresh: Promise<RefreshResponse> | null = null;
export const refreshSession = (
  data: RefreshRequest,
): Promise<RefreshResponse> => {
  // Comparte la renovación entre el contexto y las peticiones simultáneas.
  pendingRefresh ??= authApi.post<RefreshResponse>('/auth/refresh', data)
    .then(response => response.data).finally(() => { pendingRefresh = null; });
  return pendingRefresh;
};

export const logout = async (
  data: LogoutRequest,
): Promise<void> => {
  await authApi.post('/auth/logout', data);
};

export const registerPatient = async (data: RegisterPatientInput) => {
  const response = await authApi.post<{
    data: { verificationExpiresAt: string };
  }>('/auth/register', data);
  return response.data.data;
};
export const loginWithGoogle = async (credential: string): Promise<LoginResponse> =>
  (await authApi.post<LoginResponse>('/auth/google', { credential })).data;
export const requestPasswordRecovery = async (data: PasswordRecoveryInput) => {
  await authApi.post('/auth/password/forgot', data);
};
export const resetPassword = async (data: ResetPasswordInput) => {
  await authApi.post('/auth/password/reset', data);
};
export const verifyEmail = async (verification: string | { email: string; code: string }) => {
  await authApi.post('/auth/email/verify', typeof verification === 'string'
    ? { token: verification }
    : verification);
};
export const requestEmailVerification = async (email: string) => (await authApi.post<{
  verificationExpiresAt?: string | null;
  resendAvailableAt?: string | null;
}>('/auth/email/request', { email })).data;
export const getProfile = async (): Promise<ProfileResponse> => (await api.get<ProfileResponse>('/auth/me')).data;
export const completePatientProfile = async (data: CompletePatientProfileInput): Promise<ProfileResponse> =>
  (await api.post<ProfileResponse>('/auth/profile', data)).data;

export const createInternalAccount = async (kind: 'admins' | 'professionals', data: {
  nombre_usuario: string; email: string; password: string; id_salita?: string; id_profesional?: string;
}) => { await api.post(`/users/${kind}`, data); };
