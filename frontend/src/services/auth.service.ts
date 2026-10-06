import api from './api';
import authApi from './auth-api';

import type {
  AccountDisplay,
} from '../types/account-display.types';

import type {
  CompletePatientProfileInput,
  LoginRequest,
  LoginResponse,
  LoginResponseData,
  LoginResultResponse,
  LogoutRequest,
  PasswordRecoveryInput,
  ProfileResponse,
  RefreshRequest,
  RefreshResponse,
  RegisterPatientInput,
  ResetPasswordInput,
} from '../types/auth.types';

// Inicia sesión con email y contraseña.
export const login = async (
  data: LoginRequest
): Promise<LoginResultResponse> => {
  const response =
    await authApi.post<LoginResultResponse>(
      '/auth/login',
      data
    );

  return response.data;
};

// Mantiene una única renovación activa para peticiones simultáneas.
let pendingRefresh:
  Promise<RefreshResponse> | null =
  null;

// Renueva la sesión utilizando el refresh token.
export const refreshSession = (
  data: RefreshRequest
): Promise<RefreshResponse> => {
  // Comparte la renovación entre el contexto y las peticiones simultáneas.
  pendingRefresh ??=
    authApi
      .post<RefreshResponse>(
        '/auth/refresh',
        data
      )
      .then(
        (response) =>
          response.data
      )
      .finally(() => {
        pendingRefresh = null;
      });

  return pendingRefresh;
};

// Cierra la sesión actual.
export const logout = async (
  data: LogoutRequest
): Promise<void> => {
  await authApi.post(
    '/auth/logout',
    data
  );
};

// Registra una nueva cuenta de paciente.
export const registerPatient =
  async (
    data: RegisterPatientInput
  ) => {
    const response =
      await authApi.post<{
        data: {
          verificationExpiresAt: string;
        };
      }>(
        '/auth/register',
        data
      );

    return response.data.data;
  };

// Inicia sesión utilizando una credencial de Google.
export const loginWithGoogle =
  async (
    credential: string
  ): Promise<LoginResponse> =>
    (
      await authApi.post<LoginResponse>(
        '/auth/google',
        {
          credential,
        }
      )
    ).data;

// Solicita la recuperación de contraseña.
export const requestPasswordRecovery =
  async (
    data: PasswordRecoveryInput
  ) => {
    await authApi.post(
      '/auth/password/forgot',
      data
    );
  };

// Restablece la contraseña.
export const resetPassword =
  async (
    data: ResetPasswordInput
  ) => {
    await authApi.post(
      '/auth/password/reset',
      data
    );
  };

// Verifica el correo mediante token o código.
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
      }
) => {
  const response =
    await authApi.post<{
      success: boolean;
      message: string;
      data?: {
        user:
          LoginResponseData['user'];
        accessToken: string;
        refreshToken: string;
      };
    }>(
      '/auth/email/verify',
      typeof verification ===
        'string'
        ? {
            token:
              verification,
          }
        : verification
    );

  return response.data;
};

// Solicita un nuevo código de verificación de correo.
export const requestEmailVerification =
  async (
    email: string
  ) =>
    (
      await authApi.post<{
        verificationExpiresAt?:
          | string
          | null;
        resendAvailableAt?:
          | string
          | null;
      }>(
        '/auth/email/request',
        {
          email,
        }
      )
    ).data;

// Obtiene el perfil del usuario autenticado.
export const getProfile =
  async (): Promise<ProfileResponse> =>
    (
      await api.get<ProfileResponse>(
        '/auth/me'
      )
    ).data;

// Actualiza el nombre de usuario.
export const changeUsername =
  async (
    nombre_usuario: string
  ) => {
    await api.patch(
      '/auth/username',
      {
        nombre_usuario,
      }
    );
  };

// Actualiza la contraseña del usuario autenticado.
export const changePassword =
  async (
    currentPassword: string,
    newPassword: string
  ) => {
    await api.patch(
      '/auth/password',
      {
        currentPassword,
        newPassword,
      }
    );
  };

// Solicita el cambio de correo electrónico.
export const requestEmailChange =
  async (
    email: string
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
        }
      )
    ).data.data;

// Confirma el cambio de correo mediante el código recibido.
export const confirmEmailChange =
  async (
    email: string,
    code: string
  ) => {
    await api.post(
      '/auth/email/change/verify',
      {
        email,
        code,
      }
    );
  };

// Completa los datos del perfil del paciente.
export const completePatientProfile =
  async (
    data: CompletePatientProfileInput
  ): Promise<ProfileResponse> =>
    (
      await api.post<ProfileResponse>(
        '/auth/profile',
        data
      )
    ).data;

// Crea una cuenta interna para un administrador o profesional.
export const createInternalAccount =
  async (
    kind:
      | 'admins'
      | 'professionals',
    data: {
      nombre_usuario: string;
      email: string;
      password: string;
      id_salita?: string;
      id_profesional?: string;
    }
  ) => {
    const response =
      await api.post<{
        data: {
          user:
            Omit<
              AccountDisplay,
              'rol'
            > & {
              rol: string;
            };
        };
      }>(
        `/users/${kind}`,
        data
      );

    const user =
      response.data.data.user;

    // Adapta el rol recibido al formato utilizado por AccountDisplay.
    return {
      id_usuario:
        user.id_usuario,

      nombre_usuario:
        user.nombre_usuario,

      email:
        user.email,

      email_verificado:
        user.email_verificado,

      activo:
        user.activo,

      rol: {
        codigo: user.rol,
      },
    };
  };