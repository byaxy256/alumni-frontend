/**
 * Google Identity Services (GIS) — Sign in with Google using the Web client ID.
 * Works without Firebase Authentication being enabled (fixes auth/configuration-not-found).
 * Backend verifies the JWT with GOOGLE_OAUTH_CLIENT_ID (same client ID).
 */

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: string;
              theme?: string;
              size?: string;
              width?: string | number;
              text?: string;
              locale?: string;
            }
          ) => void;
        };
      };
    };
  }
}

const GIS_SCRIPT = 'https://accounts.google.com/gsi/client';

export function isGisConfigured(): boolean {
  const id = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined;
  return !!(id && id.trim().length > 0);
}

export function loadGisScript(): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Sign-In is only available in the browser'));
  }
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${GIS_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Sign-In script')));
      return;
    }
    const script = document.createElement('script');
    script.src = GIS_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Sign-In script'));
    document.head.appendChild(script);
  });
}

/**
 * Renders the official Google button into `container` and calls `onCredential` with the JWT.
 * Returns a cleanup function to clear the container.
 */
export async function mountGoogleSignInButton(
  container: HTMLElement,
  onCredential: (credential: string) => void
): Promise<() => void> {
  const clientId = (import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID as string | undefined)?.trim();
  if (!clientId) {
    throw new Error('VITE_GOOGLE_OAUTH_CLIENT_ID is not set');
  }
  await loadGisScript();
  if (!window.google?.accounts?.id) {
    throw new Error('Google Sign-In script did not load correctly');
  }

  container.innerHTML = '';
  window.google.accounts.id.initialize({
    client_id: clientId,
    callback: (response) => {
      if (response.credential) {
        onCredential(response.credential);
      }
    },
    auto_select: false,
    cancel_on_tap_outside: true,
  });

  window.google.accounts.id.renderButton(container, {
    theme: 'outline',
    size: 'large',
    width: '100%',
    text: 'continue_with',
    locale: 'en',
  });

  return () => {
    container.innerHTML = '';
  };
}
