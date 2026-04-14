import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyAdminRolesApi } from '@/lib/api/company-admin-roles';
import { showApiError, showSuccess } from '@/lib/toast';

export const companyAdminRolesKeys = {
  all: ['company-admin-roles'] as const,
  list: () => [...companyAdminRolesKeys.all, 'list'] as const,
};

export function useCompanyAdminRoles() {
  return useQuery({
    queryKey: companyAdminRolesKeys.list(),
    queryFn: () => companyAdminRolesApi.list(),
  });
}

export function useUpdateCompanyAdminPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: string[] }) =>
      companyAdminRolesApi.updatePermissions(roleId, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyAdminRolesKeys.all });
      showSuccess('Permissions updated and cache invalidated');
    },
    onError: (err: unknown) => showApiError(err),
  });
}

export function useSyncAllCompanyAdminPermissions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => companyAdminRolesApi.syncAll(),
    onSuccess: (data: unknown) => {
      queryClient.invalidateQueries({ queryKey: companyAdminRolesKeys.all });
      const result = (data as any)?.data;
      showSuccess(`Synced: ${result?.updated ?? 0} updated, ${result?.skipped ?? 0} already current`);
    },
    onError: (err: unknown) => showApiError(err),
  });
}
