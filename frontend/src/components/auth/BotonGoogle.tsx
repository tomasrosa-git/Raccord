'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GSI_SRC = 'https://accounts.google.com/gsi/client';

/** true si hay un Client ID configurado (permite ocultar el divisor "o"). */
export const googleHabilitado = Boolean(CLIENT_ID);

// Tipos mínimos de Google Identity Services (no hay @types oficial liviano).
interface CredentialResponse {
  credential?: string;
}
interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (res: CredentialResponse) => void;
  }) => void;
  renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleAccountsId } };
  }
}

/** Carga el script de GSI una sola vez y resuelve cuando `window.google` está listo. */
function cargarGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existente = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (existente) {
      existente.addEventListener('load', () => resolve());
      existente.addEventListener('error', () => reject(new Error('No se pudo cargar Google')));
      return;
    }
    const script = document.createElement('script');
    script.src = GSI_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google'));
    document.head.appendChild(script);
  });
}

interface Props {
  /** Texto del botón: "signin_with" (Ingresar) o "signup_with" (Registrarse). */
  texto?: 'signin_with' | 'signup_with';
  onError?: (mensaje: string) => void;
}

export function BotonGoogle({ texto = 'signin_with', onError }: Props) {
  const { loginGoogle } = useAuth();
  const router = useRouter();
  const contenedorRef = useRef<HTMLDivElement>(null);
  // Ref para que el callback de Google siempre vea la última versión.
  const manejarRef = useRef<(res: CredentialResponse) => void>(() => {});

  manejarRef.current = async (res: CredentialResponse) => {
    if (!res.credential) return;
    try {
      await loginGoogle(res.credential);
      router.push('/');
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'No se pudo ingresar con Google');
    }
  };

  useEffect(() => {
    if (!CLIENT_ID || !contenedorRef.current) return;
    let cancelado = false;

    cargarGsi()
      .then(() => {
        if (cancelado || !contenedorRef.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => manejarRef.current(res),
        });
        window.google.accounts.id.renderButton(contenedorRef.current, {
          type: 'standard',
          theme: 'filled_black',
          text: texto,
          shape: 'rectangular',
          width: 320,
          logo_alignment: 'center',
        });
      })
      .catch(() => onError?.('No se pudo cargar el inicio de sesión con Google'));

    return () => {
      cancelado = true;
    };
  }, [texto, onError]);

  // Sin Client ID configurado, el botón no se muestra (fallback silencioso).
  if (!CLIENT_ID) return null;

  return <div ref={contenedorRef} className="flex justify-center" />;
}
