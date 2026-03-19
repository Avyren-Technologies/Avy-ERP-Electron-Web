import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyAdminApi } from '@/lib/api/company-admin';
import { companyAdminKeys } from './use-company-admin-queries';

// ── Profile ──

export function useUpdateProfileSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionKey, data }: { sectionKey: string; data: any }) =>
            companyAdminApi.updateProfileSection(sectionKey, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.profile() });
        },
    });
}

// ── Locations ──

export function useUpdateLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateLocation(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.location(variables.id) });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.locations() });
        },
    });
}

export function useDeleteLocation() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteLocation(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.locations() });
        },
    });
}

// ── Shifts ──

export function useCreateShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.createShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.shifts() });
        },
    });
}

export function useUpdateShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateShift(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.shifts() });
        },
    });
}

export function useDeleteShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteShift(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.shifts() });
        },
    });
}

// ── Contacts ──

export function useCreateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.createContact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.contacts() });
        },
    });
}

export function useUpdateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateContact(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.contacts() });
        },
    });
}

export function useDeleteContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteContact(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.contacts() });
        },
    });
}

// ── No Series ──

export function useCreateNoSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.createNoSeries(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.noSeries() });
        },
    });
}

export function useUpdateNoSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateNoSeries(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.noSeries() });
        },
    });
}

export function useDeleteNoSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteNoSeries(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.noSeries() });
        },
    });
}

// ── IOT Reasons ──

export function useCreateIOTReason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.createIOTReason(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.iotReasons() });
        },
    });
}

export function useUpdateIOTReason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateIOTReason(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.iotReasons() });
        },
    });
}

export function useDeleteIOTReason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteIOTReason(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.iotReasons() });
        },
    });
}

// ── Controls ──

export function useUpdateControls() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.updateControls(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.controls() });
        },
    });
}

// ── Settings ──

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.settings() });
        },
    });
}

// ── Users ──

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => companyAdminApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.all });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            companyAdminApi.updateUser(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.user(variables.id) });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.all });
        },
    });
}

export function useUpdateUserStatus() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            companyAdminApi.updateUserStatus(id, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.user(variables.id) });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.all });
        },
    });
}
