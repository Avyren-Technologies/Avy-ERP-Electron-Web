import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bonusBatchApi } from '@/lib/api/bonus-batch';
import { bonusBatchKeys } from './use-bonus-batch-queries';

export function useCreateBonusBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => bonusBatchApi.createBatch(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: bonusBatchKeys.batches() }); },
    });
}

export function useApproveBonusBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => bonusBatchApi.approveBatch(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: bonusBatchKeys.all }); },
    });
}

export function useMergeBonusBatch() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => bonusBatchApi.mergeBatch(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: bonusBatchKeys.all }); },
    });
}
