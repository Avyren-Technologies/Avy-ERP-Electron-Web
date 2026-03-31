import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api/analytics';

export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: (name: string, params?: Record<string, unknown>) =>
    params
      ? ([...analyticsKeys.all, 'dashboard', name, params] as const)
      : ([...analyticsKeys.all, 'dashboard', name] as const),
  drilldown: (dashboard: string, params: Record<string, unknown>) =>
    [...analyticsKeys.all, 'drilldown', dashboard, params] as const,
  alerts: (params?: Record<string, unknown>) =>
    params
      ? ([...analyticsKeys.all, 'alerts', params] as const)
      : ([...analyticsKeys.all, 'alerts'] as const),
};

export function useAnalyticsDashboard(dashboard: string, params?: Record<string, unknown>) {
  return useQuery({
    queryKey: analyticsKeys.dashboard(dashboard, params),
    queryFn: () => analyticsApi.getDashboard(dashboard, params),
  });
}

export function useAnalyticsDrilldown(dashboard: string, params: Record<string, unknown>) {
  return useQuery({
    queryKey: analyticsKeys.drilldown(dashboard, params),
    queryFn: () => analyticsApi.getDrilldown(dashboard, params),
    enabled: !!params.type,
  });
}

export function useAnalyticsAlerts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: analyticsKeys.alerts(params),
    queryFn: () => analyticsApi.getAlerts(params),
  });
}
