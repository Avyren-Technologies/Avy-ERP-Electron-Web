import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';

const isElectron = navigator.userAgent.includes('Electron');

/**
 * Subscribes to `notification:new` Socket.io events and invalidates
 * notification React Query keys so the bell icon and notification list
 * re-fetch instantly.
 *
 * In Electron, also shows a native system notification since FCM Web Push
 * is not available.
 *
 * Invalidates explicitly the `['notifications', 'unread-count']` and
 * `['notifications', 'list']` branches so it does NOT also refetch
 * `['notification-preferences']` on every bell ping.
 */
export function useNotificationSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = connectSocket();

        const handler = (data?: { title?: string; body?: string }) => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });

            // In Electron, FCM is unavailable — show native OS notification via Socket.IO payload
            if (isElectron && data?.title && Notification.permission === 'granted') {
                new Notification(data.title, {
                    body: data.body || '',
                    icon: '/logo.png',
                });
            }
        };
        socket.on('notification:new', handler);

        // Request notification permission once for Electron native notifications
        if (isElectron && Notification.permission === 'default') {
            Notification.requestPermission();
        }

        // Capture the socket variable for cleanup — not getSocket() at cleanup time.
        return () => {
            socket.off('notification:new', handler);
        };
    }, [queryClient]);
}
