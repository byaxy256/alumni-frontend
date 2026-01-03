/* eslint-disable no-undef */
// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');
importScripts('/firebase-messaging-config.js');

const firebaseConfig = self.__FIREBASE_CONFIG__;
const vapidKey = self.__FIREBASE_VAPID_KEY__;

if (!firebaseConfig || !firebaseConfig.apiKey) {
  console.warn('Firebase config missing in service worker; push notifications disabled.');
} else {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const data = payload?.data || {};
    const notificationTitle = data.title || payload.notification?.title || 'New notification';
    const notificationOptions = {
      body: data.body || payload.notification?.body || data.message || '',
      data: { targetPath: data.targetPath || '/' },
      icon: '/icon-192.png',
      badge: '/icon-192.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });

  self.addEventListener('notificationclick', (event) => {
    const targetPath = event.notification?.data?.targetPath || '/';
    event.notification.close();
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        for (const client of clientList) {
          const url = new URL(client.url);
          if (url.pathname === targetPath) {
            return client.focus();
          }
        }
        return clients.openWindow(targetPath);
      })
    );
  });
}
