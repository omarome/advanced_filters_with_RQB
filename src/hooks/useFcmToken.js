import { useEffect, useRef } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app } from '../config/firebase';
import toast from 'react-hot-toast';
import { apiJson } from '../services/apiClient';
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

/**
 * Initializes Firebase Cloud Messaging for the current user.
 *
 * - Requests notification permission on first call
 * - Retrieves the FCM registration token and POSTs it to POST /api/fcm/register
 * - Listens for foreground messages (onMessage) and shows an in-app toast
 * - Cleans up the onMessage listener on unmount
 *
 * Must be called inside a component that renders only when the user is authenticated.
 *
 * @param {boolean} enabled  Set to false to skip initialization (e.g. while loading)
 */
export function useFcmToken(enabled = true) {
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    if (!('Notification' in window)) return; // SSR / unsupported browser guard

    let cancelled = false;

    async function init() {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          console.info('[FCM] Notification permission not granted');
          return;
        }

        const messaging = getMessaging(app);

        // Get (or refresh) the registration token
        const token = await getToken(messaging, {
          vapidKey: VAPID_KEY,
          serviceWorkerRegistration: await navigator.serviceWorker.register('/firebase-messaging-sw.js'),
        });

        if (!token || cancelled) return;

        // Send the token to the backend
        await registerTokenWithBackend(token);

        // Listen for foreground messages
        unsubscribeRef.current = onMessage(messaging, (payload) => {
          const { title = 'HumintFlow', body = '' } = payload.notification || {};
          toast(
            (t) => (
              <span>
                <strong>{title}</strong>
                {body && <><br />{body}</>}
              </span>
            ),
            { duration: 6000, icon: '🔔' }
          );
          console.log('[FCM] Foreground message:', payload);
        });
      } catch (err) {
        console.warn('[FCM] Initialization error:', err);
      }
    }

    init();

    return () => {
      cancelled = true;
      unsubscribeRef.current?.();
    };
  }, [enabled]);
}

async function registerTokenWithBackend(token) {
  try {
    await apiJson('/fcm/register', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  } catch (err) {
    console.warn('[FCM] Failed to register token with backend:', err);
  }
}
