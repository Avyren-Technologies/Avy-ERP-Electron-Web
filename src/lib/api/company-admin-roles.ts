import { client } from './client';

export interface CompanyAdminRole {
  roleId: string;
  tenantId: string;
  companyId: string | null;
  companyName: string;
  companyStatus: string;
  permissions: string[];
  updatedAt: string;
}

async function list() {
  const response = await client.get('/platform/rbac/company-admin-roles');
  return response.data;
}

async function updatePermissions(roleId: string, permissions: string[]) {
  const response = await client.patch(`/platform/rbac/company-admin-roles/${roleId}`, { permissions });
  return response.data;
}

async function syncAll() {
  const response = await client.post('/platform/rbac/sync-admin-permissions');
  return response.data;
}

export const companyAdminRolesApi = { list, updatePermissions, syncAll };
