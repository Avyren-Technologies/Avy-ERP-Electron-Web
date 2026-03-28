import { useQuery } from '@tanstack/react-query';
import { productionIncentiveApi } from '@/lib/api/production-incentive';

export const productionIncentiveKeys = {
    all: ['production-incentive'] as const,
    configs: (params?: Record<string, unknown>) => [...productionIncentiveKeys.all, 'configs', params] as const,
    config: (id: string) => [...productionIncentiveKeys.all, 'config', id] as const,
    records: (params?: Record<string, unknown>) => [...productionIncentiveKeys.all, 'records', params] as const,
};

export function useProductionIncentiveConfigs(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: productionIncentiveKeys.configs(params),
        queryFn: () => productionIncentiveApi.listConfigs(params),
    });
}

export function useProductionIncentiveConfig(id: string) {
    return useQuery({
        queryKey: productionIncentiveKeys.config(id),
        queryFn: () => productionIncentiveApi.getConfig(id),
        enabled: !!id,
    });
}

export function useProductionIncentiveRecords(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: productionIncentiveKeys.records(params),
        queryFn: () => productionIncentiveApi.listRecords(params),
    });
}
