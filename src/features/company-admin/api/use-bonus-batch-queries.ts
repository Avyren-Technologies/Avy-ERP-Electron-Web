import { useQuery } from '@tanstack/react-query';
import { bonusBatchApi } from '@/lib/api/bonus-batch';

export const bonusBatchKeys = {
    all: ['bonus-batch'] as const,
    batches: (params?: Record<string, unknown>) => [...bonusBatchKeys.all, 'list', params] as const,
    batch: (id: string) => [...bonusBatchKeys.all, 'detail', id] as const,
};

export function useBonusBatches(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: bonusBatchKeys.batches(params),
        queryFn: () => bonusBatchApi.listBatches(params),
    });
}

export function useBonusBatch(id: string) {
    return useQuery({
        queryKey: bonusBatchKeys.batch(id),
        queryFn: () => bonusBatchApi.getBatch(id),
        enabled: !!id,
    });
}
