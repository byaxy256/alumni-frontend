// Client-side Firebase (Auth). Uses same env vars as push messaging.
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

export function isFirebaseAuthConfigured(): boolean {
  const { apiKey, projectId, appId, authDomain } = firebaseConfig;
  return !!(apiKey && projectId && appId && authDomain);
}

function ensureApp(): FirebaseApp {
  if (!isFirebaseAuthConfigured()) {
    throw new Error(
      'Firebase is not configured. Set VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_APP_ID (and related) in your environment and rebuild.'
    );
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApp();
}

/**
 * Opens Google sign-in popup and returns a Firebase ID token for the backend `/api/auth/google` route.
 */
export async function signInWithGoogleIdToken(): Promise<string> {
  const app = ensureApp();
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  provider.addScope('email');
  provider.addScope('profile');

  try {
    const result = await signInWithPopup(auth, provider);
    return await result.user.getIdToken();
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled.');
    }
    if (code === 'auth/popup-blocked') {
      throw new Error('Pop-up was blocked. Allow pop-ups for this site and try again.');
    }
    if (code === 'auth/unauthorized-domain') {
      throw new Error(
        'This domain is not authorized for Google sign-in. Add it in Firebase Console → Authentication → Settings → Authorized domains.'
      );
    }
    if (code === 'auth/configuration-not-found') {
      throw new Error(
        'Firebase Authentication is not enabled for this Firebase project (or the web app is misconfigured). Use Google Sign-In with VITE_GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_ID instead, or open Firebase Console → Authentication → Get started, enable Email/Password and Google, then redeploy.'
      );
    }
    throw err instanceof Error ? err : new Error('Google sign-in failed');
  }
}
