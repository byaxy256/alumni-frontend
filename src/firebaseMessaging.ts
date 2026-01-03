// src/firebaseMessaging.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getMessaging, getToken, isSupported, onMessage, Messaging } from 'firebase/messaging';
import { toast } from 'sonner';
import { api } from './api';
import type { User } from './App';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string,
};

const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY as string;

let messaging: Messaging | null = null;

function ensureFirebaseApp() {
  if (!firebaseConfig.apiKey) {
    console.warn('Firebase config missing; push notifications disabled.');
    return null;
  }
  if (!getApps().length) {
    initializeApp(firebaseConfig);
  }
  return getApp();
}

export async function initPushNotifications(user: User | null) {
  try {
    if (!user) return;
    const supported = await isSupported();
    if (!supported) {
      console.warn('Push messaging not supported in this browser.');
      return;
    }
    const app = ensureFirebaseApp();
    if (!app) return;

    messaging = getMessaging(app);

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // Obtain token
    const pushToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!pushToken) {
      console.warn('Failed to obtain push token');
      return;
    }

    const authToken = localStorage.getItem('token') || '';
    await api.registerPushToken(pushToken, 'web', authToken);

    // Foreground handler to surface incoming notifications
    onMessage(messaging, (payload) => {
      const title = payload.notification?.title || payload.data?.title || 'New notification';
      const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
      const targetPath = payload.data?.targetPath;
      toast.info(title, {
        description: body,
        action: targetPath
          ? {
              label: 'Open',
              onClick: () => {
                if (targetPath) window.location.href = targetPath;
              },
            }
          : undefined,
      });
    });
  } catch (err) {
    console.error('Failed to init push notifications:', err);
  }
}
