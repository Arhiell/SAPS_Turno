import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  login as loginRequest,
  logout as logoutRequest,
  refreshSession,
} from '../services/auth.service';

import type {
  AuthUser,
  LoginRequest,
} from '../types/auth.types';

import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuthSession,
  updateAuthTokens,
} from '../utils/auth-storage';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
);

export const AuthProvider = ({
  children,
}: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(
    getStoredUser(),
  );

  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessToken(),
  );

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await refreshSession({
          refreshToken: storedRefreshToken,
        });

        updateAuthTokens(
          response.data.accessToken,
          response.data.refreshToken,
        );

        setAccessToken(response.data.accessToken);
      } catch {
        clearAuthSession();

        setAccessToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = async (
    data: LoginRequest,
  ): Promise<void> => {
    const response = await loginRequest(data);

    saveAuthSession(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.user,
    );

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
  };

  const logout = async (): Promise<void> => {
    const storedRefreshToken = getRefreshToken();

    try {
      if (storedRefreshToken) {
        await logoutRequest({
          refreshToken: storedRefreshToken,
        });
      }
    } finally {
      clearAuthSession();

      setAccessToken(null);
      setUser(null);
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(accessToken && user),
      isLoading,
      login,
      logout,
    }),
    [user, accessToken, isLoading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de un AuthProvider',
    );
  }

  return context;
};