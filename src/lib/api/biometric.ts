import { client } from './client';

export const biometricApi = {
  // ── Devices ──
  listDevices: (params?: { locationId?: string }) =>
    client.get('/hr/biometric/devices', { params }).then(r => r.data),
  getDevice: (id: string) =>
    client.get(`/hr/biometric/devices/${id}`).then(r => r.data),
  getDeviceStats: (params?: { locationId?: string }) =>
    client.get('/hr/biometric/devices/stats', { params }).then(r => r.data),
  claimDevice: (data: { serialNumber: string; deviceName: string; locationId?: string; timezone?: string }) =>
    client.post('/hr/biometric/devices/claim', data).then(r => r.data),
  updateDevice: (id: string, data: Record<string, unknown>) =>
    client.patch(`/hr/biometric/devices/${id}`, data).then(r => r.data),
  deactivateDevice: (id: string) =>
    client.delete(`/hr/biometric/devices/${id}`).then(r => r.data),

  // ── Employee Mappings ──
  listMappings: () =>
    client.get('/hr/biometric/mappings').then(r => r.data),
  createMapping: (data: { employeeId: string; deviceSerialNumber: string; deviceUserId: string }) =>
    client.post('/hr/biometric/mappings', data).then(r => r.data),
  deleteMapping: (id: string) =>
    client.delete(`/hr/biometric/mappings/${id}`).then(r => r.data),
  getUnmappedPunches: () =>
    client.get('/hr/biometric/mappings/unmapped').then(r => r.data),

  // ── Punch Logs ──
  listPunchLogs: (params?: Record<string, unknown>) =>
    client.get('/hr/biometric/punch-logs', { params }).then(r => r.data),

  // ── Platform (Super Admin) ──
  listUnassignedDevices: () =>
    client.get('/platform/biometric/devices/unassigned').then(r => r.data),
  countUnassigned: () =>
    client.get('/platform/biometric/devices/unassigned/count').then(r => r.data),
  assignDevice: (id: string, data: { companyId: string; deviceName: string; locationId?: string }) =>
    client.post(`/platform/biometric/devices/${id}/assign`, data).then(r => r.data),
};
