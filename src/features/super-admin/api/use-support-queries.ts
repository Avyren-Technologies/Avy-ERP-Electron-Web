import { useQuery } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';

export const platformSupportKeys = {
    all: ['platform-support'] as const,
    tickets: (params?: Record<string, unknown>) => params ? [...platformSupportKeys.all, 'tickets', params] as const : [...platformSupportKeys.all, 'tickets'] as const,
    ticket: (id: string) => [...platformSupportKeys.all, 'ticket', id] as const,
    stats: () => [...platformSupportKeys.all, 'stats'] as const,
};

export function usePlatformSupportTickets(params?: { status?: string; category?: string; search?: string; page?: number }) {
    return useQuery({
        queryKey: platformSupportKeys.tickets(params as Record<string, unknown>),
        queryFn: () => supportApi.listTickets(params),
    });
}

export function usePlatformSupportTicket(id: string) {
    return useQuery({
        queryKey: platformSupportKeys.ticket(id),
        queryFn: () => supportApi.getTicket(id),
        enabled: !!id,
        refetchInterval: 10000,
    });
}

export function usePlatformSupportStats() {
    return useQuery({
        queryKey: platformSupportKeys.stats(),
        queryFn: () => supportApi.getStats(),
        refetchInterval: 30000,
    });
}
