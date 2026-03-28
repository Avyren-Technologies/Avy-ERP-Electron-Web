import { useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftRotationApi } from '@/lib/api/shift-rotation';
import { shiftRotationKeys } from './use-shift-rotation-queries';

export function useCreateShiftRotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => shiftRotationApi.createRotation(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.rotations() }); },
    });
}

export function useUpdateShiftRotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => shiftRotationApi.updateRotation(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.all }); },
    });
}

export function useDeleteShiftRotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => shiftRotationApi.deleteRotation(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.rotations() }); },
    });
}

export function useAssignShiftRotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => shiftRotationApi.assignRotation(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.all }); },
    });
}

export function useUnassignShiftRotation() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, employeeId }: { id: string; employeeId: string }) => shiftRotationApi.unassignRotation(id, employeeId),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.all }); },
    });
}

export function useExecuteShiftRotations() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => shiftRotationApi.executeRotations(),
        onSuccess: () => { qc.invalidateQueries({ queryKey: shiftRotationKeys.all }); },
    });
}
