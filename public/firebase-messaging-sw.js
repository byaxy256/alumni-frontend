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

  // Handle background messages from FCM
  messaging.onBackgroundMessage((payload) => {
    console.log('Background message received:', payload);
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

  // Handle foreground notifications sent from the app
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'FOREGROUND_NOTIFICATION') {
      const payload = event.data.payload;
      console.log('Foreground notification message received in SW:', payload);
      self.registration.showNotification(payload.title, {
        body: payload.body,
        data: { targetPath: payload.targetPath || '/' },
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png'
      });
    }
  });

  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    console.log('Notification clicked:', event.notification.title);
    const targetPath = event.notification?.data?.targetPath || '/';
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
        console.log('Found', clientList.length, 'clients');
        
        // Try to find existing client and navigate it
        for (const client of clientList) {
          if ('navigate' in client) {
            // For an app that uses client-side routing, we navigate to the path
            // The app will handle routing via React Router or similar
            console.log('Navigating existing client to:', targetPath);
            return client.navigate(targetPath).then(client => client.focus());
          }
        }
        
        // If no existing client, open new window with the target path
        console.log('Opening new window with path:', targetPath);
        return clients.openWindow(targetPath);
      })
    );
  });
}
