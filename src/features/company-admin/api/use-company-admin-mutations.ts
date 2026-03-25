import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyAdminApi } from '@/lib/api/company-admin';
import type {
    CompanyLocation,
    CreateShiftPayload,
    CreateContactPayload,
    CreateNoSeriesPayload,
    CreateIOTReasonPayload,
    SystemControls,
    CompanySettings,
    CreateUserPayload,
    UpdateUserPayload,
    CreateRolePayload,
} from '@/lib/api/company-admin';
import { companyAdminKeys } from './use-company-admin-queries';

// ── Profile ──

export function useUpdateProfileSection() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sectionKey, data }: { sectionKey: string; data: Record<string, unknown> }) =>
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
        mutationFn: ({ id, data }: { id: string; data: Partial<CompanyLocation> }) =>
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
        mutationFn: (data: CreateShiftPayload) => companyAdminApi.createShift(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.shifts() });
        },
    });
}

export function useUpdateShift() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateShiftPayload> }) =>
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
        mutationFn: (data: CreateContactPayload) => companyAdminApi.createContact(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.contacts() });
        },
    });
}

export function useUpdateContact() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactPayload> }) =>
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
        mutationFn: (data: CreateNoSeriesPayload) => companyAdminApi.createNoSeries(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.noSeries() });
        },
    });
}

export function useUpdateNoSeries() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateNoSeriesPayload> }) =>
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
        mutationFn: (data: CreateIOTReasonPayload) => companyAdminApi.createIOTReason(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.iotReasons() });
        },
    });
}

export function useUpdateIOTReason() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<CreateIOTReasonPayload> }) =>
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
        mutationFn: (data: SystemControls) => companyAdminApi.updateControls(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.controls() });
        },
    });
}

// ── Settings ──

export function useUpdateSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: Partial<CompanySettings>) => companyAdminApi.updateSettings(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.settings() });
        },
    });
}

// ── Users ──

export function useCreateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserPayload) => companyAdminApi.createUser(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.users() });
        },
    });
}

export function useUpdateUser() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
            companyAdminApi.updateUser(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.user(variables.id) });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.users() });
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
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.users() });
        },
    });
}

// ── RBAC Roles ──

export function useCreateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateRolePayload) => companyAdminApi.createRole(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.roles() });
        },
    });
}

export function useUpdateRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: CreateRolePayload }) =>
            companyAdminApi.updateRole(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.roles() });
        },
    });
}

export function useDeleteRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => companyAdminApi.deleteRole(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.roles() });
        },
    });
}

// ── Role Assignment ──

export function useAssignRole() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
            companyAdminApi.assignRole(userId, roleId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.users() });
            queryClient.invalidateQueries({ queryKey: companyAdminKeys.roles() });
        },
    });
}
