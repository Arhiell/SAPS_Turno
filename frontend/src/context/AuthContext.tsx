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
  loginWithGoogle as googleRequest,
  getProfile,
} from '../services/auth.service';
import type { Patient } from '../types/patient.types';

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
  saveStoredUser,
} from '../utils/auth-storage';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  patient: Patient | null;
  reloadProfile: () => Promise<void>;
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
  const [patient, setPatient] = useState<Patient | null>(null);
  const reloadProfile = async () => {
    const response = await getProfile();
    setUser(response.data.user);
    saveStoredUser(response.data.user);
    setPatient(response.data.patient);
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        clearAuthSession(); setUser(null); setAccessToken(null);
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
        await reloadProfile();
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

  useEffect(() => {
    const sync = () => {
      setAccessToken(getAccessToken()); setUser(getStoredUser());
      if (!getAccessToken()) setPatient(null);
    };
    window.addEventListener('saps-session', sync);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('saps-session', sync); window.removeEventListener('storage', sync); };
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
    try { await reloadProfile(); } catch (error) { clearAuthSession(); throw error; }
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await googleRequest(credential);
    saveAuthSession(response.data.accessToken, response.data.refreshToken, response.data.user);
    setAccessToken(response.data.accessToken); setUser(response.data.user);
    try { await reloadProfile(); } catch (error) { clearAuthSession(); throw error; }
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
      setPatient(null);
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
      loginWithGoogle,
      patient,
      reloadProfile,
    }),
    [user, accessToken, isLoading, patient],
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
