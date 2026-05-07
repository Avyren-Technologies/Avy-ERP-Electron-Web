import { useMutation, useQueryClient } from '@tanstack/react-query';
import { biometricApi } from '@/lib/api/biometric';
import { biometricKeys } from './use-biometric-queries';
import { showSuccess, showApiError } from '@/lib/toast';

export function useClaimBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { serialNumber: string; deviceName: string; locationId?: string; timezone?: string }) =>
      biometricApi.claimDevice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biometricKeys.devices() });
      showSuccess('Device Claimed', 'Device has been registered to your company');
    },
    onError: showApiError,
  });
}

export function useUpdateBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      biometricApi.updateDevice(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biometricKeys.all });
      showSuccess('Device Updated');
    },
    onError: showApiError,
  });
}

export function useDeactivateBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => biometricApi.deactivateDevice(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biometricKeys.devices() });
      showSuccess('Device Deactivated');
    },
    onError: showApiError,
  });
}

export function useCreateBiometricMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { employeeId: string; deviceSerialNumber: string; deviceUserId: string }) =>
      biometricApi.createMapping(data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: biometricKeys.mappings() });
      qc.invalidateQueries({ queryKey: biometricKeys.unmappedPunches() });
      const count = res?.data?.backfilledCount ?? 0;
      showSuccess('Mapping Created', count > 0 ? `${count} historical punches linked` : 'Employee linked to device');
    },
    onError: showApiError,
  });
}

export function useDeleteBiometricMapping() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => biometricApi.deleteMapping(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biometricKeys.mappings() });
      showSuccess('Mapping Removed');
    },
    onError: showApiError,
  });
}

export function useAssignBiometricDevice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { companyId: string; deviceName: string; locationId?: string } }) =>
      biometricApi.assignDevice(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: biometricKeys.unassignedDevices() });
      qc.invalidateQueries({ queryKey: biometricKeys.unassignedCount() });
      showSuccess('Device Assigned');
    },
    onError: showApiError,
  });
}
