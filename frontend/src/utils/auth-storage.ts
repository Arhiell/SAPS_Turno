import type { AuthUser } from '../types/auth.types';

const ACCESS_TOKEN_KEY = 'saps_access_token';
const REFRESH_TOKEN_KEY = 'saps_refresh_token';
const USER_KEY = 'saps_user';

export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

export const getStoredUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as AuthUser;
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const saveAuthSession = (
  accessToken: string,
  refreshToken: string,
  user: AuthUser,
): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const updateAuthTokens = (
  accessToken: string,
  refreshToken: string,
): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearAuthSession = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const saveStoredUser = (
  user: AuthUser,
): void => {
  localStorage.setItem(
    USER_KEY,
    JSON.stringify(user),
  );
};