import { useQuery } from '@tanstack/react-query';
import { auditApi } from '@/lib/api/audit';
import type { AuditLogParams } from '@/lib/api/audit';

export const auditKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditKeys.all, 'list'] as const,
  list: (params: AuditLogParams) => [...auditKeys.lists(), params] as const,
  filters: () => [...auditKeys.all, 'filters'] as const,
  details: () => [...auditKeys.all, 'detail'] as const,
  detail: (id: string) => [...auditKeys.details(), id] as const,
};

export function useAuditLogs(params: AuditLogParams = {}) {
  return useQuery({
    queryKey: auditKeys.list(params),
    queryFn: () => auditApi.listAuditLogs(params),
  });
}

export function useAuditFilterOptions() {
  return useQuery({
    queryKey: auditKeys.filters(),
    queryFn: () => auditApi.getFilterOptions(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useAuditLogDetail(id: string) {
  return useQuery({
    queryKey: auditKeys.detail(id),
    queryFn: () => auditApi.getAuditLogById(id),
    enabled: !!id,
  });
}

export function useEntityAuditLogs(entityType: string, entityId: string) {
  return useQuery({
    queryKey: [...auditKeys.all, 'entity', entityType, entityId] as const,
    queryFn: () => auditApi.getEntityAuditLogs(entityType, entityId),
    enabled: !!entityType && !!entityId,
  });
}
