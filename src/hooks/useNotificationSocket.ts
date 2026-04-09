import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';

/**
 * Subscribes to `notification:new` Socket.io events and invalidates
 * notification React Query keys so the bell icon and notification list
 * re-fetch instantly.
 *
 * Invalidates explicitly the `['notifications', 'unread-count']` and
 * `['notifications', 'list']` branches so it does NOT also refetch
 * `['notification-preferences']` on every bell ping.
 */
export function useNotificationSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = connectSocket();

        const handler = () => {
            queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
            queryClient.invalidateQueries({ queryKey: ['notifications', 'list'] });
        };
        socket.on('notification:new', handler);

        // Capture the socket variable for cleanup — not getSocket() at cleanup time.
        return () => {
            socket.off('notification:new', handler);
        };
    }, [queryClient]);
}
