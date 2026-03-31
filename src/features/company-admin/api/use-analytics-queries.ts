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

export function useReportCatalog() {
  return useQuery({
    queryKey: [...analyticsKeys.all, 'report-catalog'] as const,
    queryFn: () => analyticsApi.getReportCatalog(),
  });
}

export function useReportHistory(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: params ? [...analyticsKeys.all, 'report-history', params] as const : [...analyticsKeys.all, 'report-history'] as const,
    queryFn: () => analyticsApi.getReportHistory(params),
  });
}

export function useRateLimit() {
  return useQuery({
    queryKey: [...analyticsKeys.all, 'rate-limit'] as const,
    queryFn: () => analyticsApi.getRateLimit(),
    refetchInterval: 30000,
  });
}
