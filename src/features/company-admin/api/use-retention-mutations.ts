import { useMutation, useQueryClient } from '@tanstack/react-query';
import { retentionApi } from '@/lib/api/retention';
import { retentionKeys } from './use-retention-queries';

export function useCreateRetentionPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => retentionApi.createPolicy(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: retentionKeys.policies() }); },
    });
}

export function useDeleteRetentionPolicy() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => retentionApi.deletePolicy(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: retentionKeys.policies() }); },
    });
}

export function useCreateRetentionDataRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => retentionApi.createDataRequest(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: retentionKeys.dataRequests() }); },
    });
}

export function useUpdateRetentionDataRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => retentionApi.updateDataRequest(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: retentionKeys.dataRequests() }); },
    });
}

export function useAnonymiseEmployee() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (employeeId: string) => retentionApi.anonymiseEmployee(employeeId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: retentionKeys.all }); },
    });
}

export function useCreateRetentionConsent() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ employeeId, data }: { employeeId: string; data: Record<string, unknown> }) =>
            retentionApi.createConsent(employeeId, data),
        onSuccess: (_data, variables) => {
            qc.invalidateQueries({ queryKey: retentionKeys.consents(variables.employeeId) });
        },
    });
}
