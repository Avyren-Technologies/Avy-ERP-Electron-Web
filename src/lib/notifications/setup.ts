import { showSuccess } from '@/lib/toast';

let fcmToken: string | null = null;

/**
 * Wait for a service worker registration to have an active worker.
 * Handles install → activate lifecycle so postMessage never targets null.
 */
function waitForActiveWorker(reg: ServiceWorkerRegistration): Promise<ServiceWorker> {
  if (reg.active) return Promise.resolve(reg.active);

  return new Promise((resolve) => {
    const sw = reg.installing ?? reg.waiting;
    if (!sw) {
      // Fallback: wait for navigator.serviceWorker.ready
      navigator.serviceWorker.ready.then((r) => resolve(r.active!));
      return;
    }
    sw.addEventListener('statechange', () => {
      if (sw.state === 'activated') resolve(sw);
    });
  });
}

/**
 * Initialize Firebase Messaging for web push.
 * Call after user authentication.
 */
export async function initWebPushNotifications(): Promise<string | null> {
  try {
    // Electron does not support FCM Web Push (no Web Push Protocol / VAPID).
    // Notifications in Electron are handled via Socket.IO + native Notification API.
    if (navigator.userAgent.includes('Electron')) {
      console.info('[WebPush] Electron detected — skipping FCM, using Socket.IO for notifications');
      return null;
    }

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
      console.warn('[WebPush] Firebase config missing — skipping');
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    const messaging = getMessaging(app);

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('[WebPush] Notification permission denied');
      return null;
    }

    // Get FCM token
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY || '';
    const swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // Wait for the service worker to be fully active before posting config
    const activeSw = await waitForActiveWorker(swRegistration);

    // Post Firebase config to service worker for background message handling
    activeSw.postMessage({
      type: 'FIREBASE_CONFIG',
      config: firebaseConfig,
    });

    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: swRegistration,
    });

    if (!token) {
      console.warn('[WebPush] getToken returned empty — check VAPID key and browser support');
      return null;
    }

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
    } catch (err) {
      console.error('[WebPush] Device registration failed:', err);
    }

    // Handle foreground messages — show both toast and system notification
    onMessage(messaging, (payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        showSuccess(`${title}: ${body || ''}`);
        // Also show a system notification so it's visible even if the user isn't
        // looking at the tab (foreground = tab is open, not necessarily focused)
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body: body || '',
            icon: '/logo.png',
            data: payload.data,
          });
        }
      }
    });

    return token;
  } catch (err) {
    console.error('[WebPush] Initialization failed:', err);
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
