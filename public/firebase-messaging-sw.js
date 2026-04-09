/* eslint-disable no-undef */
/**
 * Firebase Messaging Service Worker
 *
 * Handles background push notifications when the app is not in the foreground.
 * Must be served at /firebase-messaging-sw.js (root scope).
 *
 * The VAPID key and Firebase config below must match the values in src/config/firebase.js.
 * They are inlined here because service workers cannot access Vite env variables.
 */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// ⚠️  Replace these placeholder values with your actual Firebase project config.
// These must match the values in your .env file (VITE_FIREBASE_*).
firebase.initializeApp({
  apiKey:            self.__FIREBASE_API_KEY__            || 'YOUR_API_KEY',
  authDomain:        self.__FIREBASE_AUTH_DOMAIN__        || 'YOUR_PROJECT.firebaseapp.com',
  projectId:         self.__FIREBASE_PROJECT_ID__         || 'humint-flow',
  storageBucket:     self.__FIREBASE_STORAGE_BUCKET__     || 'humint-flow.appspot.com',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || 'YOUR_SENDER_ID',
  appId:             self.__FIREBASE_APP_ID__             || 'YOUR_APP_ID',
});

const messaging = firebase.messaging();

/**
 * Background message handler.
 * Fires when a push arrives while the app tab is closed or hidden.
 * Shows a system notification using the Notification API.
 */
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw] Background message:', payload);

  const { title = 'HumintFlow', body = '' } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    data,
    tag: data.tag || 'humint-push',
    renotify: true,
  });
});

/**
 * Notification click handler.
 * Opens (or focuses) the app when the user taps the notification.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
