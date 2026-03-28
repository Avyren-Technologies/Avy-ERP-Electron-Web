import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productionIncentiveApi } from '@/lib/api/production-incentive';
import { productionIncentiveKeys } from './use-production-incentive-queries';

export function useCreateProductionIncentiveConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => productionIncentiveApi.createConfig(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: productionIncentiveKeys.configs() }); },
    });
}

export function useUpdateProductionIncentiveConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => productionIncentiveApi.updateConfig(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: productionIncentiveKeys.all }); },
    });
}

export function useDeleteProductionIncentiveConfig() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => productionIncentiveApi.deleteConfig(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: productionIncentiveKeys.configs() }); },
    });
}

export function useComputeProductionIncentive() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (configId: string) => productionIncentiveApi.computeIncentive(configId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: productionIncentiveKeys.all }); },
    });
}

export function useMergeProductionIncentive() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (configId: string) => productionIncentiveApi.mergeIncentive(configId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: productionIncentiveKeys.all }); },
    });
}
