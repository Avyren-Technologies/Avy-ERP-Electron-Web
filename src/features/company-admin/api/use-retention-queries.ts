import { useQuery } from '@tanstack/react-query';
import { retentionApi } from '@/lib/api/retention';

export const retentionKeys = {
    all: ['retention'] as const,
    policies: (params?: Record<string, unknown>) => [...retentionKeys.all, 'policies', params] as const,
    dataRequests: (params?: Record<string, unknown>) => [...retentionKeys.all, 'data-requests', params] as const,
    dataExport: (employeeId: string) => [...retentionKeys.all, 'data-export', employeeId] as const,
    consents: (employeeId: string) => [...retentionKeys.all, 'consents', employeeId] as const,
    checkDue: () => [...retentionKeys.all, 'check-due'] as const,
};

export function useRetentionPolicies(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: retentionKeys.policies(params),
        queryFn: () => retentionApi.listPolicies(params),
    });
}

export function useRetentionDataRequests(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: retentionKeys.dataRequests(params),
        queryFn: () => retentionApi.listDataRequests(params),
    });
}

export function useRetentionDataExport(employeeId: string) {
    return useQuery({
        queryKey: retentionKeys.dataExport(employeeId),
        queryFn: () => retentionApi.getDataExport(employeeId),
        enabled: !!employeeId,
    });
}

export function useRetentionConsents(employeeId: string) {
    return useQuery({
        queryKey: retentionKeys.consents(employeeId),
        queryFn: () => retentionApi.listConsents(employeeId),
        enabled: !!employeeId,
    });
}

export function useRetentionCheckDue() {
    return useQuery({
        queryKey: retentionKeys.checkDue(),
        queryFn: () => retentionApi.checkDue(),
    });
}
