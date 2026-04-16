/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

// Firebase config is injected via message from main thread
let firebaseInitialized = false;

// Queue config messages received before the SW is fully active
let pendingConfig = null;

function initFirebase(config) {
  if (firebaseInitialized) return;
  try {
    firebase.initializeApp(config);
    firebaseInitialized = true;

    const messaging = firebase.messaging();
    messaging.onBackgroundMessage((payload) => {
      const { title, body } = payload.notification || {};
      if (title) {
        self.registration.showNotification(title, {
          body: body || '',
          icon: '/logo.png',
          badge: '/logo.png',
          data: payload.data,
        });
      }
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[firebase-messaging-sw] init failed:', err);
  }
}

self.addEventListener('message', (event) => {
  if (event.data?.type === 'FIREBASE_CONFIG') {
    if (self.registration.active) {
      initFirebase(event.data.config);
    } else {
      pendingConfig = event.data.config;
    }
  }
});

self.addEventListener('activate', () => {
  if (pendingConfig) {
    initFirebase(pendingConfig);
    pendingConfig = null;
  }
});
