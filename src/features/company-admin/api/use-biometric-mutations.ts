import { useMutation, useQueryClient } from '@tanstack/react-query';
import { biometricApi } from '@/lib/api/biometric';
import { biometricKeys } from './use-biometric-queries';

export function useCreateBiometricDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => biometricApi.createDevice(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: biometricKeys.devices() }); },
    });
}

export function useUpdateBiometricDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => biometricApi.updateDevice(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: biometricKeys.all }); },
    });
}

export function useDeleteBiometricDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => biometricApi.deleteDevice(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: biometricKeys.devices() }); },
    });
}

export function useTestBiometricDevice() {
    return useMutation({
        mutationFn: (id: string) => biometricApi.testDevice(id),
    });
}

export function useSyncBiometricDevice() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => biometricApi.syncDevice(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: biometricKeys.all }); },
    });
}
