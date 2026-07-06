'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  loginApi,
  registroApi,
  refreshApi,
  logoutApi,
  type Usuario,
  type Sesion,
} from '@/lib/api/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// El access token dura 15 min: se renueva antes de que venza.
const REFRESH_INTERVAL_MS = 13 * 60 * 1000;

interface AuthContextValue {
  usuario: Usuario | null;
  /** true mientras se intenta restaurar la sesión inicial. */
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  registro: (email: string, username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** fetch a la API con Authorization; reintenta una vez tras refresh si da 401. */
  fetchAuth: (path: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);
  const tokenRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const aplicarSesion = useCallback((sesion: Sesion | null) => {
    tokenRef.current = sesion?.accessToken ?? null;
    setUsuario(sesion?.usuario ?? null);

    if (timerRef.current) clearTimeout(timerRef.current);
    if (sesion) {
      timerRef.current = setTimeout(() => {
        void refreshApi().then(aplicarSesion);
      }, REFRESH_INTERVAL_MS);
    }
  }, []);

  useEffect(() => {
    let activo = true;
    refreshApi()
      .then((sesion) => {
        if (activo) aplicarSesion(sesion);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });
    return () => {
      activo = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [aplicarSesion]);

  const login = useCallback(
    async (email: string, password: string) => {
      aplicarSesion(await loginApi(email, password));
    },
    [aplicarSesion]
  );

  const registro = useCallback(
    async (email: string, username: string, password: string) => {
      aplicarSesion(await registroApi(email, username, password));
    },
    [aplicarSesion]
  );

  const logout = useCallback(async () => {
    await logoutApi();
    aplicarSesion(null);
  }, [aplicarSesion]);

  const fetchAuth = useCallback(
    async (path: string, init: RequestInit = {}) => {
      const hacer = () =>
        fetch(`${API_URL}/api${path}`, {
          ...init,
          headers: {
            ...init.headers,
            ...(tokenRef.current && { Authorization: `Bearer ${tokenRef.current}` }),
          },
        });

      let res = await hacer();
      if (res.status === 401) {
        const sesion = await refreshApi();
        aplicarSesion(sesion);
        if (sesion) res = await hacer();
      }
      return res;
    },
    [aplicarSesion]
  );

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, registro, logout, fetchAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
