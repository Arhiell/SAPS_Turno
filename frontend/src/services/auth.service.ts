import authApi from './auth-api';
import api from './api';

import type {
  RegisterPatientInput,
  PasswordRecoveryInput,
  ResetPasswordInput,
  CompletePatientProfileInput,
  ProfileResponse,
  LoginRequest,
  LoginResponse,
  LoginResultResponse,
  LoginResponseData,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
} from '../types/auth.types';

export const login = async (
  data: LoginRequest,
): Promise<LoginResultResponse> => {
  const response = await authApi.post<LoginResultResponse>(
    '/auth/login',
    data,
  );

  return response.data;
};

let pendingRefresh: Promise<RefreshResponse> | null = null;

export const refreshSession = (
  data: RefreshRequest,
): Promise<RefreshResponse> => {
  // Comparte la renovación entre el contexto y las
  // peticiones simultáneas.
  pendingRefresh ??=
    authApi
      .post<RefreshResponse>(
        '/auth/refresh',
        data,
      )
      .then((response) => response.data)
      .finally(() => {
        pendingRefresh = null;
      });

  return pendingRefresh;
};

export const logout = async (
  data: LogoutRequest,
): Promise<void> => {
  await authApi.post(
    '/auth/logout',
    data,
  );
};

export const registerPatient = async (
  data: RegisterPatientInput,
) => {
  const response = await authApi.post<{
    data: {
      verificationExpiresAt: string;
    };
  }>(
    '/auth/register',
    data,
  );

  return response.data.data;
};

export const loginWithGoogle = async (
  credential: string,
): Promise<LoginResponse> =>
  (
    await authApi.post<LoginResponse>(
      '/auth/google',
      {
        credential,
      },
    )
  ).data;

export const requestPasswordRecovery = async (
  data: PasswordRecoveryInput,
) => {
  await authApi.post(
    '/auth/password/forgot',
    data,
  );
};

export const resetPassword = async (
  data: ResetPasswordInput,
) => {
  await authApi.post(
    '/auth/password/reset',
    data,
  );
};

export const verifyEmail = async (
  verification:
    | string
    | {
        email: string;
        code: string;
      }
    | {
        loginVerificationToken: string;
        code: string;
      },
) => {
  const response = await authApi.post<{
    success: boolean;
    message: string;
    data?: {
      user: LoginResponseData['user'];
      accessToken: string;
      refreshToken: string;
    };
  }>(
    '/auth/email/verify',
    typeof verification === 'string'
      ? {
          token: verification,
        }
      : verification,
  );

  return response.data;
};

export const requestEmailVerification = async (
  email: string,
) =>
  (
    await authApi.post<{
      verificationExpiresAt?: string | null;
      resendAvailableAt?: string | null;
    }>(
      '/auth/email/request',
      {
        email,
      },
    )
  ).data;

export const getProfile = async (): Promise<ProfileResponse> =>
  (
    await api.get<ProfileResponse>(
      '/auth/me',
    )
  ).data;

export const changeUsername = async (
  nombre_usuario: string,
) => {
  await api.patch(
    '/auth/username',
    {
      nombre_usuario,
    },
  );
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
) => {
  await api.patch(
    '/auth/password',
    {
      currentPassword,
      newPassword,
    },
  );
};

export const requestEmailChange = async (
  email: string,
) =>
  (
    await api.post<{
      data: {
        verificationExpiresAt: string;
      };
    }>(
      '/auth/email/change/request',
      {
        email,
      },
    )
  ).data.data;

export const confirmEmailChange = async (
  email: string,
  code: string,
) => {
  await api.post(
    '/auth/email/change/verify',
    {
      email,
      code,
    },
  );
};

export const completePatientProfile = async (
  data: CompletePatientProfileInput,
): Promise<ProfileResponse> =>
  (
    await api.post<ProfileResponse>(
      '/auth/profile',
      data,
    )
  ).data;

export const createInternalAccount = async (
  kind: 'admins' | 'professionals',
  data: {
    nombre_usuario: string;
    email: string;
    password: string;
    id_salita?: string;
    id_profesional?: string;
  },
) => {
  await api.post(
    `/users/${kind}`,
    data,
  );
};