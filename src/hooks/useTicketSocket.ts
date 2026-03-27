import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { connectSocket } from '@/lib/socket';
import { companyAdminKeys } from '@/features/company-admin/api/use-company-admin-queries';
import { platformSupportKeys } from '@/features/super-admin/api/use-support-queries';

/**
 * Hook to subscribe to real-time ticket updates via Socket.io.
 * Automatically invalidates both company-admin and platform-support query keys.
 */
export function useTicketSocket(ticketId?: string, companyId?: string, isAdmin = false) {
    const queryClient = useQueryClient();

    useEffect(() => {
        const socket = connectSocket();

        // Join rooms
        if (ticketId) socket.emit('join-ticket', ticketId);
        if (companyId) socket.emit('join-company', companyId);
        if (isAdmin) socket.emit('join-admin');

        // Listen for events
        const handleMessage = (data: any) => {
            // Invalidate both query key namespaces so both roles see updates
            if (data.ticketId) {
                queryClient.invalidateQueries({ queryKey: companyAdminKeys.supportTicket(data.ticketId) });
                queryClient.invalidateQueries({ queryKey: platformSupportKeys.ticket(data.ticketId) });
            }
        };

        const handleStatusChanged = (data: any) => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.supportTickets() });
            queryClient.invalidateQueries({ queryKey: platformSupportKeys.tickets() });
            queryClient.invalidateQueries({ queryKey: platformSupportKeys.stats() });
            if (data.ticketId) {
                queryClient.invalidateQueries({ queryKey: companyAdminKeys.supportTicket(data.ticketId) });
                queryClient.invalidateQueries({ queryKey: platformSupportKeys.ticket(data.ticketId) });
            }
        };

        const handleNewTicket = () => {
            queryClient.invalidateQueries({ queryKey: platformSupportKeys.tickets() });
            queryClient.invalidateQueries({ queryKey: platformSupportKeys.stats() });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.supportTickets() });
        };

        const handleResolved = (data: any) => {
            handleStatusChanged(data);
        };

        const handleUpdated = (data: any) => {
            handleStatusChanged(data);
        };

        socket.on('ticket:message', handleMessage);
        socket.on('ticket:status-changed', handleStatusChanged);
        socket.on('ticket:new', handleNewTicket);
        socket.on('ticket:resolved', handleResolved);
        socket.on('ticket:updated', handleUpdated);

        return () => {
            if (ticketId) socket.emit('leave-ticket', ticketId);
            socket.off('ticket:message', handleMessage);
            socket.off('ticket:status-changed', handleStatusChanged);
            socket.off('ticket:new', handleNewTicket);
            socket.off('ticket:resolved', handleResolved);
            socket.off('ticket:updated', handleUpdated);
        };
    }, [ticketId, companyId, isAdmin, queryClient]);
}
