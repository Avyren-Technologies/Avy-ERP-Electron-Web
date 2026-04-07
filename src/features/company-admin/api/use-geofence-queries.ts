import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyAdminApi } from '@/lib/api/company-admin';
import { showApiError } from '@/lib/toast';

export const geofenceKeys = {
    all: ['geofences'] as const,
    byLocation: (locationId: string) => [...geofenceKeys.all, locationId] as const,
    dropdown: (locationId: string) => [...geofenceKeys.all, 'dropdown', locationId] as const,
};

export function useGeofences(locationId: string) {
    return useQuery({
        queryKey: geofenceKeys.byLocation(locationId),
        queryFn: () => companyAdminApi.listGeofences(locationId),
        enabled: !!locationId,
    });
}

export function useGeofencesForDropdown(locationId?: string) {
    return useQuery({
        queryKey: geofenceKeys.dropdown(locationId!),
        queryFn: () => companyAdminApi.listGeofencesForDropdown(locationId!),
        enabled: !!locationId,
    });
}

export function useCreateGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ locationId, data }: { locationId: string; data: any }) =>
            companyAdminApi.createGeofence(locationId, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: geofenceKeys.byLocation(vars.locationId) });
            qc.invalidateQueries({ queryKey: geofenceKeys.dropdown(vars.locationId) });
        },
        onError: (err) => showApiError(err),
    });
}

export function useUpdateGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ locationId, id, data }: { locationId: string; id: string; data: any }) =>
            companyAdminApi.updateGeofence(locationId, id, data),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: geofenceKeys.byLocation(vars.locationId) });
            qc.invalidateQueries({ queryKey: geofenceKeys.dropdown(vars.locationId) });
        },
        onError: (err) => showApiError(err),
    });
}

export function useDeleteGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ locationId, id }: { locationId: string; id: string }) =>
            companyAdminApi.deleteGeofence(locationId, id),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: geofenceKeys.byLocation(vars.locationId) });
            qc.invalidateQueries({ queryKey: geofenceKeys.dropdown(vars.locationId) });
        },
        onError: (err) => showApiError(err),
    });
}

export function useSetDefaultGeofence() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ locationId, id }: { locationId: string; id: string }) =>
            companyAdminApi.setDefaultGeofence(locationId, id),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: geofenceKeys.byLocation(vars.locationId) });
            qc.invalidateQueries({ queryKey: geofenceKeys.dropdown(vars.locationId) });
        },
        onError: (err) => showApiError(err),
    });
}
