import { useQuery } from '@tanstack/react-query';
import { biometricApi } from '@/lib/api/biometric';

export const biometricKeys = {
  all: ['biometric'] as const,
  devices: (locationId?: string) =>
    locationId ? [...biometricKeys.all, 'devices', locationId] as const : [...biometricKeys.all, 'devices'] as const,
  device: (id: string) => [...biometricKeys.all, 'device', id] as const,
  deviceStats: (locationId?: string) =>
    locationId ? [...biometricKeys.all, 'device-stats', locationId] as const : [...biometricKeys.all, 'device-stats'] as const,
  mappings: () => [...biometricKeys.all, 'mappings'] as const,
  unmappedPunches: () => [...biometricKeys.all, 'unmapped-punches'] as const,
  punchLogs: (params?: Record<string, unknown>) =>
    params ? [...biometricKeys.all, 'punch-logs', params] as const : [...biometricKeys.all, 'punch-logs'] as const,
  unassignedDevices: () => [...biometricKeys.all, 'unassigned'] as const,
  unassignedCount: () => [...biometricKeys.all, 'unassigned-count'] as const,
};

export function useBiometricDevices(locationId?: string) {
  return useQuery({
    queryKey: biometricKeys.devices(locationId),
    queryFn: () => biometricApi.listDevices(locationId ? { locationId } : undefined),
  });
}

export function useBiometricDevice(id: string) {
  return useQuery({
    queryKey: biometricKeys.device(id),
    queryFn: () => biometricApi.getDevice(id),
    enabled: !!id,
  });
}

export function useBiometricDeviceStats(locationId?: string) {
  return useQuery({
    queryKey: biometricKeys.deviceStats(locationId),
    queryFn: () => biometricApi.getDeviceStats(locationId ? { locationId } : undefined),
    refetchInterval: 30_000,
  });
}

export function useBiometricMappings() {
  return useQuery({
    queryKey: biometricKeys.mappings(),
    queryFn: () => biometricApi.listMappings(),
  });
}

export function useUnmappedPunches() {
  return useQuery({
    queryKey: biometricKeys.unmappedPunches(),
    queryFn: () => biometricApi.getUnmappedPunches(),
  });
}

export function useBiometricPunchLogs(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: biometricKeys.punchLogs(params),
    queryFn: () => biometricApi.listPunchLogs(params),
  });
}

export function useUnassignedDevices() {
  return useQuery({
    queryKey: biometricKeys.unassignedDevices(),
    queryFn: () => biometricApi.listUnassignedDevices(),
  });
}

export function useUnassignedDeviceCount() {
  return useQuery({
    queryKey: biometricKeys.unassignedCount(),
    queryFn: () => biometricApi.countUnassigned(),
    refetchInterval: 60_000,
  });
}
