export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_SALITA'
  | 'PROFESIONAL'
  | 'PACIENTE';

export interface AuthUser {
  id_usuario: string;
  email: string;
  nombre_usuario: string;
  rol: UserRole | string;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface LoginResponseData {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginResponseData;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponseData {
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  success: boolean;
  message: string;
  data: RefreshResponseData;
}

export interface LogoutRequest {
  refreshToken: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface RegisterPatientInput { email: string; password: string }
export interface PasswordRecoveryInput { email: string }
export interface ResetPasswordInput { token: string; newPassword: string }
export type CompletePatientProfileInput = Omit<import('./patient.types').CreatePatientRequest, 'email'>;
export interface ProfileResponse {
  success: boolean;
  data: { user: AuthUser; patient: import('./patient.types').Patient | null };
}
