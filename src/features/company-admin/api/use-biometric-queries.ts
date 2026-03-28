import { useQuery } from '@tanstack/react-query';
import { biometricApi } from '@/lib/api/biometric';

export const biometricKeys = {
    all: ['biometric'] as const,
    devices: (params?: Record<string, unknown>) => [...biometricKeys.all, 'devices', params] as const,
    device: (id: string) => [...biometricKeys.all, 'device', id] as const,
};

export function useBiometricDevices(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: biometricKeys.devices(params),
        queryFn: () => biometricApi.listDevices(params),
    });
}

export function useBiometricDevice(id: string) {
    return useQuery({
        queryKey: biometricKeys.device(id),
        queryFn: () => biometricApi.getDevice(id),
        enabled: !!id,
    });
}
