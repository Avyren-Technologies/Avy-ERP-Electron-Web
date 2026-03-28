import { useQuery } from '@tanstack/react-query';
import { shiftRotationApi } from '@/lib/api/shift-rotation';

export const shiftRotationKeys = {
    all: ['shift-rotation'] as const,
    rotations: (params?: Record<string, unknown>) => [...shiftRotationKeys.all, 'list', params] as const,
    rotation: (id: string) => [...shiftRotationKeys.all, 'detail', id] as const,
};

export function useShiftRotations(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: shiftRotationKeys.rotations(params),
        queryFn: () => shiftRotationApi.listRotations(params),
    });
}

export function useShiftRotation(id: string) {
    return useQuery({
        queryKey: shiftRotationKeys.rotation(id),
        queryFn: () => shiftRotationApi.getRotation(id),
        enabled: !!id,
    });
}
