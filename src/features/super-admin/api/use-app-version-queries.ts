import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appVersionApi } from '@/lib/api/app-version';
import type { UpsertAppVersionPayload, UpdateAppVersionPayload } from '@/lib/api/app-version';
import { showApiError, showSuccess } from '@/lib/toast';

export const appVersionKeys = {
  all: ['app-versions'] as const,
  list: () => [...appVersionKeys.all, 'list'] as const,
};

export function useAppVersionList() {
  return useQuery({
    queryKey: appVersionKeys.list(),
    queryFn: () => appVersionApi.list(),
  });
}

export function useUpsertAppVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpsertAppVersionPayload) => appVersionApi.upsert(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
      showSuccess('App version config saved');
    },
    onError: (err: any) => showApiError(err),
  });
}

export function useUpdateAppVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAppVersionPayload }) =>
      appVersionApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
      showSuccess('App version config updated');
    },
    onError: (err: any) => showApiError(err),
  });
}

export function useDeleteAppVersion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => appVersionApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appVersionKeys.all });
      showSuccess('App version config deleted');
    },
    onError: (err: any) => showApiError(err),
  });
}
