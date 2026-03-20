import { useQuery } from '@tanstack/react-query';
import { transferApi } from '@/lib/api/transfer';

export const transferKeys = {
    all: ['transfer'] as const,
    transfers: (params?: Record<string, unknown>) => [...transferKeys.all, 'transfers', params] as const,
    transfer: (id: string) => [...transferKeys.all, 'transfer', id] as const,
    promotions: (params?: Record<string, unknown>) => [...transferKeys.all, 'promotions', params] as const,
    promotion: (id: string) => [...transferKeys.all, 'promotion', id] as const,
    delegates: (params?: Record<string, unknown>) => [...transferKeys.all, 'delegates', params] as const,
};

// ── Transfers ──

export function useTransfers(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: transferKeys.transfers(params),
        queryFn: () => transferApi.listTransfers(params as any),
    });
}

export function useTransfer(id: string) {
    return useQuery({
        queryKey: transferKeys.transfer(id),
        queryFn: () => transferApi.getTransfer(id),
        enabled: !!id,
    });
}

// ── Promotions ──

export function usePromotions(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: transferKeys.promotions(params),
        queryFn: () => transferApi.listPromotions(params as any),
    });
}

export function usePromotion(id: string) {
    return useQuery({
        queryKey: transferKeys.promotion(id),
        queryFn: () => transferApi.getPromotion(id),
        enabled: !!id,
    });
}

// ── Delegates ──

export function useDelegates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: transferKeys.delegates(params),
        queryFn: () => transferApi.listDelegates(params as any),
    });
}
