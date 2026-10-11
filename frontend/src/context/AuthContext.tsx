import {
  createContext,
  useContext,
  useEffect,
  useRef,
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
  LoginResultResponse,
  PersonProfile,
  ProfileResponse,
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

// Define los datos y funciones disponibles en el contexto de autenticación.
interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<LoginResultResponse>;
  logout: () => Promise<void>;
  loginWithGoogle: (credential: string) => Promise<void>;
  patient: Patient | null;
  person: PersonProfile | null;
  roleInfo: ProfileResponse['data']['roleInfo'] | null;
  reloadProfile: () => Promise<void>;
  updateProfile: (profile: ProfileResponse['data']) => void;
}

// Crea el contexto de autenticación.
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Administra la sesión y los datos del usuario autenticado.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Almacena el usuario y su token de acceso.
  const [user, setUser] = useState<AuthUser | null>(getStoredUser());
  const [accessToken, setAccessToken] = useState<string | null>(
    getAccessToken()
  );

  // Controla la carga inicial de la sesión.
  const [isLoading, setIsLoading] = useState(true);

  // Almacena los datos del perfil y su información asociada.
  const [patient, setPatient] = useState<Patient | null>(null);
  const [person, setPerson] = useState<PersonProfile | null>(null);
  const [roleInfo, setRoleInfo] = useState<
    ProfileResponse['data']['roleInfo'] | null
  >(null);

  const loadedUserId = useRef<string | null>(null);

  // Actualiza los datos del perfil sin generar nuevos tokens.
  const updateProfile = (profile: ProfileResponse['data']) => {
    loadedUserId.current = profile.user.id_usuario;

    setUser(profile.user);
    saveStoredUser(profile.user);

    setPatient(profile.patient);
    setPerson(profile.person);
    setRoleInfo(profile.roleInfo);
  };

  // Consulta el perfil actualizado del usuario autenticado.
  const reloadProfile = async () => {
    updateProfile((await getProfile()).data);
  };

  // Limpia los datos y tokens de la sesión actual.
  const reset = () => {
    loadedUserId.current = null;

    clearAuthSession();

    setAccessToken(null);
    setUser(null);
    setPatient(null);
    setPerson(null);
    setRoleInfo(null);
  };

  // Restaura la sesión al iniciar la aplicación.
  useEffect(() => {
    const restoreSession = async () => {
      const refreshToken = getRefreshToken();

      // Limpia la sesión si no existe un token de renovación.
      if (!refreshToken) {
        reset();
        setIsLoading(false);
        return;
      }

      try {
        // Renueva los tokens y recupera el perfil del usuario.
        const response = await refreshSession({ refreshToken });

        updateAuthTokens(
          response.data.accessToken,
          response.data.refreshToken
        );

        setAccessToken(response.data.accessToken);

        await reloadProfile();
      } catch {
        reset();
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  // Sincroniza la sesión ante cambios en el almacenamiento.
  useEffect(() => {
    const sync = () => {
      const stored = getStoredUser();

      setAccessToken(getAccessToken());
      setUser(stored);

      // Limpia los datos del perfil si no existe una sesión activa.
      if (!getAccessToken()) {
        setPatient(null);
        setPerson(null);
        setRoleInfo(null);
      } else if (
        stored &&
        (
          stored.perfil_completo === undefined ||
          stored.id_usuario !== loadedUserId.current
        )
      ) {
        // Recupera el perfil cuando se detecta una sesión nueva.
        setIsLoading(true);

        void reloadProfile()
          .catch(reset)
          .finally(() => setIsLoading(false));
      }
    };

    window.addEventListener('saps-session', sync);
    window.addEventListener('storage', sync);

    // Elimina los eventos cuando se desmonta el proveedor.
    return () => {
      window.removeEventListener('saps-session', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  // Inicia sesión con las credenciales del usuario.
  const login = async (
    data: LoginRequest
  ): Promise<LoginResultResponse> => {
    const response = await loginRequest(data);

    if (!('accessToken' in response.data)) {
      return response;
    }

    // Guarda los tokens y los datos básicos del usuario.
    saveAuthSession(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.user
    );

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);

    try {
      // Recupera la información completa del perfil.
      await reloadProfile();
    } catch (error) {
      reset();
      throw error;
    }

    return response;
  };

  // Inicia sesión utilizando una credencial de Google.
  const loginWithGoogle = async (credential: string) => {
    const response = await googleRequest(credential);

    // Guarda los tokens y los datos del usuario autenticado.
    saveAuthSession(
      response.data.accessToken,
      response.data.refreshToken,
      response.data.user
    );

    setAccessToken(response.data.accessToken);
    setUser(response.data.user);

    try {
      // Recupera el perfil asociado a la cuenta.
      await reloadProfile();
    } catch (error) {
      reset();
      throw error;
    }
  };

  // Cierra la sesión y elimina los datos almacenados.
  const logout = async () => {
    const refreshToken = getRefreshToken();

    try {
      // Solicita la revocación de la sesión en el servidor.
      if (refreshToken) {
        await logoutRequest({ refreshToken });
      }
    } finally {
      // Limpia la sesión local aunque falle la solicitud.
      reset();
    }
  };

  // Comparte el estado y las funciones de autenticación.
  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: Boolean(accessToken && user),
        isLoading,
        login,
        logout,
        loginWithGoogle,
        patient,
        person,
        roleInfo,
        reloadProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Permite acceder al contexto de autenticación desde otros componentes.
export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de un AuthProvider'
    );
  }

  return context;
};