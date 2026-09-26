export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN_SALITA'
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