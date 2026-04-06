import { showSuccess } from '@/lib/toast';

let fcmToken: string | null = null;

/**
 * Initialize Firebase Messaging for web push.
 * Call after user authentication.
 */
export async function initWebPushNotifications(): Promise<string | null> {
  try {
    // Dynamic import to avoid bundling firebase in the main chunk
    const { initializeApp, getApps } = await import('firebase/app');
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging');

    const firebaseConfig = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };

    // Skip if no config
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      console.warn('Firebase config not set — web push notifications disabled');
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission not granted');
      return null;
    }

    // Get FCM token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    // Post Firebase config to service worker for background message handling
    swRegistration.active?.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseConfig,
    });

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    fcmToken = token;

    // Register with backend
    try {
      const { client } = await import('@/lib/api/client');
      await client.post('/notifications/register-device', {
        fcmToken: token,
        platform: 'WEB',
        deviceName: navigator.userAgent.substring(0, 100),
      });
    } catch (err) {
      console.error('Failed to register FCM token with backend:', err);
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        showSuccess(`${title}: ${body || ''}`);
      }
    });

    return token;
  } catch (err) {
    console.warn('Web push notification setup failed:', err);
    return null;
  }
}

/**
 * Unregister device token on logout.
 */
export async function unregisterWebPush(): Promise<void> {
  if (!fcmToken) return;
  try {
    const { client } = await import('@/lib/api/client');
    await client.delete('/notifications/register-device', { data: { fcmToken } });
    fcmToken = null;
  } catch (err) {
    console.error('Failed to unregister FCM token:', err);
  }
}

export function getFcmToken(): string | null {
  return fcmToken;
}
