import { useQuery } from '@tanstack/react-query';
import { companyAdminApi } from '@/lib/api/company-admin';

export const companyAdminKeys = {
    all: ['company-admin'] as const,
    profile: () => [...companyAdminKeys.all, 'profile'] as const,
    locations: () => [...companyAdminKeys.all, 'locations'] as const,
    location: (id: string) => [...companyAdminKeys.all, 'location', id] as const,
    shifts: () => [...companyAdminKeys.all, 'shifts'] as const,
    contacts: () => [...companyAdminKeys.all, 'contacts'] as const,
    noSeries: () => [...companyAdminKeys.all, 'no-series'] as const,
    iotReasons: () => [...companyAdminKeys.all, 'iot-reasons'] as const,
    controls: () => [...companyAdminKeys.all, 'controls'] as const,
    settings: () => [...companyAdminKeys.all, 'settings'] as const,
    users: (params?: Record<string, unknown>) => [...companyAdminKeys.all, 'users', params] as const,
    user: (id: string) => [...companyAdminKeys.all, 'user', id] as const,
    auditLogs: (params?: Record<string, unknown>) => [...companyAdminKeys.all, 'audit-logs', params] as const,
    activity: (limit?: number) => [...companyAdminKeys.all, 'activity', limit] as const,
    roles: () => [...companyAdminKeys.all, 'roles'] as const,
};

export function useCompanyProfile() {
    return useQuery({
        queryKey: companyAdminKeys.profile(),
        queryFn: () => companyAdminApi.getProfile(),
    });
}

export function useCompanyLocations() {
    return useQuery({
        queryKey: companyAdminKeys.locations(),
        queryFn: () => companyAdminApi.listLocations(),
    });
}

export function useCompanyLocation(id: string) {
    return useQuery({
        queryKey: companyAdminKeys.location(id),
        queryFn: () => companyAdminApi.getLocation(id),
        enabled: !!id,
    });
}

export function useCompanyShifts() {
    return useQuery({
        queryKey: companyAdminKeys.shifts(),
        queryFn: () => companyAdminApi.listShifts(),
    });
}

export function useCompanyContacts() {
    return useQuery({
        queryKey: companyAdminKeys.contacts(),
        queryFn: () => companyAdminApi.listContacts(),
    });
}

export function useCompanyNoSeries() {
    return useQuery({
        queryKey: companyAdminKeys.noSeries(),
        queryFn: () => companyAdminApi.listNoSeries(),
    });
}

export function useCompanyIOTReasons() {
    return useQuery({
        queryKey: companyAdminKeys.iotReasons(),
        queryFn: () => companyAdminApi.listIOTReasons(),
    });
}

export function useCompanyControls() {
    return useQuery({
        queryKey: companyAdminKeys.controls(),
        queryFn: () => companyAdminApi.getControls(),
    });
}

export function useCompanySettings() {
    return useQuery({
        queryKey: companyAdminKeys.settings(),
        queryFn: () => companyAdminApi.getSettings(),
    });
}

export function useCompanyUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}) {
    return useQuery({
        queryKey: companyAdminKeys.users(params as Record<string, unknown>),
        queryFn: () => companyAdminApi.listUsers(params),
    });
}

export function useCompanyUser(id: string) {
    return useQuery({
        queryKey: companyAdminKeys.user(id),
        queryFn: () => companyAdminApi.getUser(id),
        enabled: !!id,
    });
}

export function useCompanyAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: companyAdminKeys.auditLogs(params as Record<string, unknown>),
        queryFn: () => companyAdminApi.listAuditLogs(params),
    });
}

export function useCompanyActivity(limit = 10) {
    return useQuery({
        queryKey: companyAdminKeys.activity(limit),
        queryFn: () => companyAdminApi.getCompanyActivity(limit),
        refetchInterval: 30000,
        refetchIntervalInBackground: false,
    });
}

export function useRbacRoles() {
    return useQuery({
        queryKey: companyAdminKeys.roles(),
        queryFn: () => companyAdminApi.listRoles(),
    });
}
