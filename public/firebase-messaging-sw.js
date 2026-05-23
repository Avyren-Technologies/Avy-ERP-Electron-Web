/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

/**
 * Firebase Messaging requires push / pushsubscriptionchange / notificationclick
 * handlers to be registered during the initial script evaluation.
 * Config is passed as query params when the app registers this worker.
 */
function readFirebaseConfig() {
  const params = new URL(self.location.href).searchParams;
  const apiKey = params.get('apiKey');
  if (!apiKey) return null;
  return {
    apiKey,
    authDomain: params.get('authDomain') || undefined,
    projectId: params.get('projectId') || undefined,
    storageBucket: params.get('storageBucket') || undefined,
    messagingSenderId: params.get('messagingSenderId') || undefined,
    appId: params.get('appId') || undefined,
  };
}

function showBackgroundNotification(payload) {
  const { title, body } = payload.notification || {};
  if (!title) return undefined;
  return self.registration.showNotification(title, {
    body: body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: payload.data || {},
  });
}

const firebaseConfig = readFirebaseConfig();
if (firebaseConfig) {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    firebase.messaging().onBackgroundMessage((payload) => showBackgroundNotification(payload));
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase-messaging-sw] init failed:', err);
  }
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
      return undefined;
    }),
  );
});
