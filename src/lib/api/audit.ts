import { client } from './client';

export interface AuditLogParams {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

async function listAuditLogs(params: AuditLogParams = {}) {
  const response = await client.get('/platform/audit-logs', { params });
  return response.data;
}

async function getAuditLogById(id: string) {
  const response = await client.get(`/platform/audit-logs/${id}`);
  return response.data;
}

async function getFilterOptions() {
  const response = await client.get('/platform/audit-logs/filters');
  return response.data;
}

async function getEntityAuditLogs(entityType: string, entityId: string) {
  const response = await client.get(`/platform/audit-logs/entity/${entityType}/${entityId}`);
  return response.data;
}

export const auditApi = {
  listAuditLogs,
  getAuditLogById,
  getFilterOptions,
  getEntityAuditLogs,
};
