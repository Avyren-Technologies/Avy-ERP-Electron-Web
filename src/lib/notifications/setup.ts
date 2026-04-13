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
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
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

      // Prefer modern `userAgentData` (Chromium) for structured device info,
      // fall back to userAgent parsing. `navigator.platform` is deprecated and
      // should not be used.
      const uaData = (navigator as Navigator & {
        userAgentData?: { platform?: string; brands?: Array<{ brand: string; version: string }> };
      }).userAgentData;

      await client.post('/notifications/register-device', {
        fcmToken: token,
        tokenType: 'FCM_WEB',
        platform: 'WEB',
        deviceName: navigator.userAgent.substring(0, 100),
        deviceModel: uaData?.platform ?? undefined,
        osVersion: uaData?.brands?.[0]
          ? `${uaData.brands[0].brand} ${uaData.brands[0].version}`
          : undefined,
        appVersion: import.meta.env.VITE_APP_VERSION ?? 'unknown',
        locale: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
    } catch {
      // Silently fail — token registration is non-critical
    }

    // Handle foreground messages
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        showSuccess(`${title}: ${body || ''}`);
      }
    });

    return token;
  } catch {
    // Silently fail — web push setup is non-critical
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
  } catch {
    // Silently fail — token unregistration is non-critical
  }
}

export function getFcmToken(): string | null {
  return fcmToken;
}
