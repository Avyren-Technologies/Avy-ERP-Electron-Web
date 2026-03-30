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
    moduleCatalogue: () => [...companyAdminKeys.all, 'module-catalogue'] as const,
    subscription: () => [...companyAdminKeys.all, 'subscription'] as const,
    costBreakdown: () => [...companyAdminKeys.all, 'cost-breakdown'] as const,
    myInvoices: (params?: Record<string, unknown>) => [...companyAdminKeys.all, 'my-invoices', params] as const,
    myInvoiceDetail: (id: string) => [...companyAdminKeys.all, 'my-invoice', id] as const,
    myPayments: (params?: Record<string, unknown>) => [...companyAdminKeys.all, 'my-payments', params] as const,
    permissionCatalogue: () => [...companyAdminKeys.all, 'permission-catalogue'] as const,
    referenceRoles: () => [...companyAdminKeys.all, 'reference-roles'] as const,
    shiftBreaks: (shiftId: string) => [...companyAdminKeys.all, 'shift-breaks', shiftId] as const,
    supportTickets: (params?: Record<string, unknown>) => params ? [...companyAdminKeys.all, 'support-tickets', params] as const : [...companyAdminKeys.all, 'support-tickets'] as const,
    supportTicket: (id: string) => [...companyAdminKeys.all, 'support-ticket', id] as const,
    navigationManifest: () => [...companyAdminKeys.all, 'navigation-manifest'] as const,
    myGoals: () => [...companyAdminKeys.all, 'my-goals'] as const,
    myGrievances: () => [...companyAdminKeys.all, 'my-grievances'] as const,
    myTraining: () => [...companyAdminKeys.all, 'my-training'] as const,
    myAssets: () => [...companyAdminKeys.all, 'my-assets'] as const,
    myForm16: () => [...companyAdminKeys.all, 'my-form16'] as const,
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

export function useModuleCatalogue() {
    return useQuery({
        queryKey: companyAdminKeys.moduleCatalogue(),
        queryFn: () => companyAdminApi.getModuleCatalogue(),
    });
}

export function useMySubscription() {
    return useQuery({
        queryKey: companyAdminKeys.subscription(),
        queryFn: () => companyAdminApi.getMySubscription(),
    });
}

export function useMyCostBreakdown() {
    return useQuery({
        queryKey: companyAdminKeys.costBreakdown(),
        queryFn: () => companyAdminApi.getMyCostBreakdown(),
    });
}

export function useMyInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
}) {
    return useQuery({
        queryKey: companyAdminKeys.myInvoices(params as Record<string, unknown>),
        queryFn: () => companyAdminApi.getMyInvoices(params),
    });
}

export function useMyInvoiceDetail(id: string) {
    return useQuery({
        queryKey: companyAdminKeys.myInvoiceDetail(id),
        queryFn: () => companyAdminApi.getMyInvoiceDetail(id),
        enabled: !!id,
    });
}

export function useMyPayments(params?: {
    page?: number;
    limit?: number;
}) {
    return useQuery({
        queryKey: companyAdminKeys.myPayments(params as Record<string, unknown>),
        queryFn: () => companyAdminApi.getMyPayments(params),
    });
}

export function usePermissionCatalogue() {
    return useQuery({
        queryKey: companyAdminKeys.permissionCatalogue(),
        queryFn: () => companyAdminApi.getPermissionCatalogue(),
        staleTime: 5 * 60 * 1000, // 5 minutes — catalogue rarely changes
    });
}

export function useReferenceRoles() {
    return useQuery({
        queryKey: companyAdminKeys.referenceRoles(),
        queryFn: () => companyAdminApi.getReferenceRoles(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useShiftBreaks(shiftId: string) {
    return useQuery({
        queryKey: companyAdminKeys.shiftBreaks(shiftId),
        queryFn: () => companyAdminApi.getShiftBreaks(shiftId),
        enabled: !!shiftId,
    });
}

// ── Support Tickets ──

export function useSupportTickets(params?: { status?: string; category?: string; search?: string; page?: number }) {
    return useQuery({
        queryKey: companyAdminKeys.supportTickets(params as Record<string, unknown>),
        queryFn: () => companyAdminApi.listSupportTickets(params),
    });
}

/** Navigation manifest — cached 5 minutes, drives sidebar rendering */
export function useNavigationManifest() {
    return useQuery({
        queryKey: companyAdminKeys.navigationManifest(),
        queryFn: () => companyAdminApi.getNavigationManifest(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useSupportTicket(id: string) {
    return useQuery({
        queryKey: companyAdminKeys.supportTicket(id),
        queryFn: () => companyAdminApi.getSupportTicket(id),
        enabled: !!id,
        refetchInterval: 10000,
    });
}

// ── ESS Self-Service ──

export function useMyGoals() {
    return useQuery({ queryKey: companyAdminKeys.myGoals(), queryFn: () => companyAdminApi.getMyGoals() });
}

export function useMyGrievances() {
    return useQuery({ queryKey: companyAdminKeys.myGrievances(), queryFn: () => companyAdminApi.getMyGrievances() });
}

export function useMyTraining() {
    return useQuery({ queryKey: companyAdminKeys.myTraining(), queryFn: () => companyAdminApi.getMyTraining() });
}

export function useMyAssets() {
    return useQuery({ queryKey: companyAdminKeys.myAssets(), queryFn: () => companyAdminApi.getMyAssets() });
}

export function useMyForm16() {
    return useQuery({ queryKey: companyAdminKeys.myForm16(), queryFn: () => companyAdminApi.getMyForm16() });
}
