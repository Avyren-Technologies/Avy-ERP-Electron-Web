import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tenantApi } from '@/lib/api/tenant';

export const tenantKeys = {
    all: ['tenants'] as const,
    lists: () => [...tenantKeys.all, 'list'] as const,
    list: (params: any) => [...tenantKeys.lists(), params] as const,
    details: () => [...tenantKeys.all, 'detail'] as const,
    detail: (id: string) => [...tenantKeys.details(), id] as const,
};

export function useTenantList(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    return useQuery({
        queryKey: tenantKeys.list(params),
        queryFn: () => tenantApi.listCompanies(params),
    });
}

export function useTenantDetail(companyId: string) {
    return useQuery({
        queryKey: tenantKeys.detail(companyId),
        queryFn: () => tenantApi.getCompanyDetail(companyId),
        enabled: !!companyId,
    });
}

export function useOnboardTenant() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: any) => tenantApi.onboard(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantKeys.all });
        },
    });
}

export function useUpdateCompanySection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            companyId,
            sectionKey,
            data,
        }: {
            companyId: string;
            sectionKey: string;
            data: any;
        }) => tenantApi.updateSection(companyId, sectionKey, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.companyId) });
            queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
        },
    });
}

export function useUpdateCompanyStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ companyId, status }: { companyId: string; status: string }) =>
            tenantApi.updateStatus(companyId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: tenantKeys.detail(variables.companyId) });
            queryClient.invalidateQueries({ queryKey: tenantKeys.lists() });
        },
    });
}

export function useDeleteCompany() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (companyId: string) => tenantApi.deleteCompany(companyId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: tenantKeys.all });
        },
    });
}
