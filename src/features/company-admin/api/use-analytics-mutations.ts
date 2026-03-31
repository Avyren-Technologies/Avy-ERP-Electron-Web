import { useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';
import { showSuccess, showApiError } from '@/lib/toast';
import { analyticsKeys } from './use-analytics-queries';

export function useAcknowledgeAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyticsApi.acknowledgeAlert(id),
    onSuccess: () => {
      showSuccess('Alert acknowledged');
      qc.invalidateQueries({ queryKey: analyticsKeys.alerts() });
    },
    onError: showApiError,
  });
}

export function useResolveAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => analyticsApi.resolveAlert(id),
    onSuccess: () => {
      showSuccess('Alert resolved');
      qc.invalidateQueries({ queryKey: analyticsKeys.alerts() });
    },
    onError: showApiError,
  });
}

export function useRecompute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data?: { date?: string }) => analyticsApi.recompute(data),
    onSuccess: () => {
      showSuccess('Recomputation triggered');
      qc.invalidateQueries({ queryKey: analyticsKeys.all });
    },
    onError: showApiError,
  });
}
