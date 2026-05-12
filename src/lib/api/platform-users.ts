import { client } from './client';

export interface PlatformUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  updatedAt: string;
  companyId: string | null;
  employeeId: string | null;
  mfaEnabled: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  company: { id: string; name: string } | null;
  companyName: string | null;
  tenantRoleId: string | null;
  tenantRoleName: string | null;
}

export interface PlatformUserStats {
  total: number;
  active: number;
  inactive: number;
  superAdmins: number;
  companyAdmins: number;
  regularUsers: number;
  companies: number;
}

export interface CompanyOption {
  id: string;
  name: string;
}

export interface PlatformUserListParams {
  page?: number;
  limit?: number;
  search?: string;
  companyId?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreatePlatformUserPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyId: string;
  role: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
}

export interface UpdatePlatformUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string | null;
  companyId?: string;
  role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'USER';
}

async function listUsers(params: PlatformUserListParams = {}) {
  const response = await client.get('/platform/users', { params });
  return response.data;
}

async function getUserById(id: string) {
  const response = await client.get(`/platform/users/${id}`);
  return response.data;
}

async function createUser(data: CreatePlatformUserPayload) {
  const response = await client.post('/platform/users', data);
  return response.data;
}

async function updateUser(id: string, data: UpdatePlatformUserPayload) {
  const response = await client.patch(`/platform/users/${id}`, data);
  return response.data;
}

async function resetPassword(id: string, password: string) {
  const response = await client.patch(`/platform/users/${id}/password`, { password });
  return response.data;
}

async function updateStatus(id: string, isActive: boolean) {
  const response = await client.patch(`/platform/users/${id}/status`, { isActive });
  return response.data;
}

async function deleteUser(id: string) {
  const response = await client.delete(`/platform/users/${id}`);
  return response.data;
}

async function getStats() {
  const response = await client.get('/platform/users/stats');
  return response.data;
}

async function listCompanies() {
  const response = await client.get('/platform/users/companies');
  return response.data;
}

export const platformUsersApi = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  updateStatus,
  deleteUser,
  getStats,
  listCompanies,
};
