import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket, getSocket } from '@/lib/socket';

/**
 * Subscribes to 'notification:new' Socket.io events and invalidates React Query
 * notification keys so the bell icon and notification list re-fetch instantly.
 *
 * Contract: the socket payload is treated as a UI hint only. We always re-fetch
 * via React Query — never append the payload directly to state.
 */
export function useNotificationSocket() {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = connectSocket();

        const handler = () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        };
        socket.on('notification:new', handler);

        return () => {
            getSocket().off('notification:new', handler);
        };
    }, [queryClient]);
}
