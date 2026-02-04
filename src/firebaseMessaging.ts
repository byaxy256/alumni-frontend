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

// Ensure VAPID key is present and trimmed (common cause of InvalidAccessError)
const rawVapidKey = (import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined)?.trim();
const vapidKey = rawVapidKey && rawVapidKey.replace(/^"|"$/g, '');

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
    if (!vapidKey || vapidKey.length < 20) {
      console.error('VAPID key missing/invalid. Set VITE_FIREBASE_VAPID_KEY to your Web Push certificate public key.');
      return;
    }
    const app = ensureFirebaseApp();
    if (!app) return;

    messaging = getMessaging(app);

    // Register service worker FIRST
    console.log('Registering service worker...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
    console.log('Service worker registered:', registration);

    // Check current permission state
    let permission = Notification.permission;
    console.log('Current notification permission:', permission);

    // Only ask for permission if not already denied
    if (permission === 'default') {
      console.log('Requesting notification permission...');
      permission = await Notification.requestPermission();
      console.log('User responded to permission prompt:', permission);
    }

    if (permission !== 'granted') {
      console.warn('Notification permission:', permission);
      if (permission === 'denied') {
        console.warn('User blocked notifications. They can re-enable in browser settings.');
      }
      // Still continue - token can be obtained even without permission on some browsers
    }

    // Obtain token
    console.log('Requesting FCM token...');
    const pushToken = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
    if (!pushToken) {
      console.warn('Failed to obtain push token');
      return;
    }

    console.log('FCM token obtained:', pushToken.substring(0, 20) + '...');

    // Register token on backend
    const authToken = localStorage.getItem('token') || '';
    console.log('Registering token on backend...');
    await api.registerPushToken(pushToken, 'web', authToken);
    console.log('Token registered successfully');

    // Foreground handler to surface incoming notifications as native notifications
    onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      const title = payload.notification?.title || payload.data?.title || 'New notification';
      const body = payload.notification?.body || payload.data?.body || payload.data?.message || '';
      const targetPath = payload.data?.targetPath;

      // Show native notification if permission is granted
      if (permission === 'granted' && registration.active) {
        registration.active.postMessage({
          type: 'FOREGROUND_NOTIFICATION',
          payload: {
            title,
            body,
            targetPath,
            icon: '/icon-192.png',
            badge: '/icon-192.png'
          }
        });
      }

      // Also show toast as fallback
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

