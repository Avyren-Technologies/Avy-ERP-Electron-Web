import { client } from './client';

export interface AppVersionConfig {
  id: string;
  platform: string;
  latestVersion: string;
  minimumVersion: string;
  recommendedVersion: string | null;
  updateUrl: string | null;
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertAppVersionPayload {
  platform: 'ANDROID' | 'IOS';
  latestVersion: string;
  minimumVersion: string;
  recommendedVersion?: string;
  updateUrl?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  isActive?: boolean;
}

export interface UpdateAppVersionPayload {
  latestVersion?: string;
  minimumVersion?: string;
  recommendedVersion?: string;
  updateUrl?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  isActive?: boolean;
}

async function list() {
  const response = await client.get('/platform/app-versions');
  return response.data;
}

async function getByPlatform(platform: string) {
  const response = await client.get(`/platform/app-versions/by-platform/${platform}`);
  return response.data;
}

async function upsert(data: UpsertAppVersionPayload) {
  const response = await client.post('/platform/app-versions', data);
  return response.data;
}

async function update(id: string, data: UpdateAppVersionPayload) {
  const response = await client.patch(`/platform/app-versions/${id}`, data);
  return response.data;
}

async function remove(id: string) {
  const response = await client.delete(`/platform/app-versions/${id}`);
  return response.data;
}

export const appVersionApi = { list, getByPlatform, upsert, update, remove };
