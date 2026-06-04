import { useQuery } from '@tanstack/react-query';
import { visitorsApi } from '@/lib/api/visitors';

export const visitorKeys = {
    all: ['visitors'] as const,
    visits: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'visits', params] as const
        : [...visitorKeys.all, 'visits'] as const,
    visit: (id: string) => [...visitorKeys.all, 'visit', id] as const,
    visitByCode: (code: string) => [...visitorKeys.all, 'visit-code', code] as const,
    types: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'types', params] as const
        : [...visitorKeys.all, 'types'] as const,
    type: (id: string) => [...visitorKeys.all, 'type', id] as const,
    gates: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gates', params] as const
        : [...visitorKeys.all, 'gates'] as const,
    gate: (id: string) => [...visitorKeys.all, 'gate', id] as const,
    inductions: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'inductions', params] as const
        : [...visitorKeys.all, 'inductions'] as const,
    config: () => [...visitorKeys.all, 'config'] as const,
    watchlist: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'watchlist', params] as const
        : [...visitorKeys.all, 'watchlist'] as const,
    deniedEntries: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'denied-entries', params] as const
        : [...visitorKeys.all, 'denied-entries'] as const,
    recurringPasses: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'recurring-passes', params] as const
        : [...visitorKeys.all, 'recurring-passes'] as const,
    groupVisits: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'group-visits', params] as const
        : [...visitorKeys.all, 'group-visits'] as const,
    vehiclePasses: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'vehicle-passes', params] as const
        : [...visitorKeys.all, 'vehicle-passes'] as const,
    materialPasses: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'material-passes', params] as const
        : [...visitorKeys.all, 'material-passes'] as const,
    dashboardToday: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'dashboard-today', params] as const
        : [...visitorKeys.all, 'dashboard-today'] as const,
    dashboardOnSite: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'dashboard-on-site', params] as const
        : [...visitorKeys.all, 'dashboard-on-site'] as const,
    dashboardStats: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'dashboard-stats', params] as const
        : [...visitorKeys.all, 'dashboard-stats'] as const,
    dailyLog: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'daily-log', params] as const
        : [...visitorKeys.all, 'daily-log'] as const,
    reportSummary: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'report-summary', params] as const
        : [...visitorKeys.all, 'report-summary'] as const,
    overstayReport: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'overstay-report', params] as const
        : [...visitorKeys.all, 'overstay-report'] as const,
    analytics: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'analytics', params] as const
        : [...visitorKeys.all, 'analytics'] as const,
    musterList: () => [...visitorKeys.all, 'muster-list'] as const,

    // Pass detail + event timeline
    vehiclePass: (id: string) => [...visitorKeys.all, 'vehicle-pass', id] as const,
    materialPass: (id: string) => [...visitorKeys.all, 'material-pass', id] as const,
    vehiclePassEvents: (id: string, params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'vehicle-pass-events', id, params] as const
        : [...visitorKeys.all, 'vehicle-pass-events', id] as const,
    materialPassEvents: (id: string, params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'material-pass-events', id, params] as const
        : [...visitorKeys.all, 'material-pass-events', id] as const,

    // Gate Ops dashboard
    gateOpsStats: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gate-ops-stats', params] as const
        : [...visitorKeys.all, 'gate-ops-stats'] as const,
    gateOpsExpectedMaterials: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gate-ops-expected-materials', params] as const
        : [...visitorKeys.all, 'gate-ops-expected-materials'] as const,
    gateOpsExpectedVisitors: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gate-ops-expected-visitors', params] as const
        : [...visitorKeys.all, 'gate-ops-expected-visitors'] as const,
    gateOpsExpectedVehicles: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gate-ops-expected-vehicles', params] as const
        : [...visitorKeys.all, 'gate-ops-expected-vehicles'] as const,
    gateOpsRecentActivity: (params?: Record<string, unknown>) => params
        ? [...visitorKeys.all, 'gate-ops-recent-activity', params] as const
        : [...visitorKeys.all, 'gate-ops-recent-activity'] as const,
};

// ── Visits ──

export function useVisits(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.visits(params),
        queryFn: () => visitorsApi.listVisits(params as any),
    });
}

export function useVisit(id: string) {
    return useQuery({
        queryKey: visitorKeys.visit(id),
        queryFn: () => visitorsApi.getVisit(id),
        enabled: !!id,
    });
}

export function useVisitByCode(code: string) {
    return useQuery({
        queryKey: visitorKeys.visitByCode(code),
        queryFn: () => visitorsApi.getVisitByCode(code),
        enabled: !!code,
    });
}

// ── Visitor Types ──

export function useVisitorTypes(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.types(params),
        queryFn: () => visitorsApi.listVisitorTypes(params as any),
    });
}

export function useVisitorType(id: string) {
    return useQuery({
        queryKey: visitorKeys.type(id),
        queryFn: () => visitorsApi.getVisitorType(id),
        enabled: !!id,
    });
}

// ── Gates ──

export function useGates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gates(params),
        queryFn: () => visitorsApi.listGates(params as any),
    });
}

export function useGate(id: string) {
    return useQuery({
        queryKey: visitorKeys.gate(id),
        queryFn: () => visitorsApi.getGate(id),
        enabled: !!id,
    });
}

// ── Safety Inductions ──

export function useSafetyInductions(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.inductions(params),
        queryFn: () => visitorsApi.listSafetyInductions(params as any),
    });
}

// ── VMS Config ──

export function useVmsConfig() {
    return useQuery({
        queryKey: visitorKeys.config(),
        queryFn: () => visitorsApi.getVmsConfig(),
    });
}

// ── Watchlist ──

export function useWatchlist(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.watchlist(params),
        queryFn: () => visitorsApi.listWatchlist(params as any),
    });
}

// ── Denied Entries ──

export function useDeniedEntries(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.deniedEntries(params),
        queryFn: () => visitorsApi.listDeniedEntries(params as any),
    });
}

export function useDeniedEntry(id: string) {
    return useQuery({
        queryKey: [...visitorKeys.all, 'denied-entry', id] as const,
        queryFn: () => visitorsApi.getDeniedEntry(id),
        enabled: !!id,
    });
}

// ── Recurring Passes ──

export function useRecurringPasses(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.recurringPasses(params),
        queryFn: () => visitorsApi.listRecurringPasses(params as any),
    });
}

// ── Group Visits ──

export function useGroupVisits(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.groupVisits(params),
        queryFn: () => visitorsApi.listGroupVisits(params as any),
    });
}

// ── Vehicle Passes ──

export function useVehiclePasses(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.vehiclePasses(params),
        queryFn: () => visitorsApi.listVehiclePasses(params as any),
    });
}

// ── Material Passes ──

export function useMaterialPasses(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.materialPasses(params),
        queryFn: () => visitorsApi.listMaterialPasses(params as any),
    });
}

// ── Dashboard ──

export function useDashboardToday(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.dashboardToday(params),
        queryFn: () => visitorsApi.getDashboardToday(params as any),
        refetchInterval: 30_000,
    });
}

export function useDashboardOnSite(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.dashboardOnSite(params),
        queryFn: () => visitorsApi.getDashboardOnSite(params as any),
        refetchInterval: 30_000,
    });
}

export function useDashboardStats(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.dashboardStats(params),
        queryFn: () => visitorsApi.getDashboardStats(params as any),
    });
}

// ── Reports ──

export function useDailyLog(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.dailyLog(params),
        queryFn: () => visitorsApi.getDailyLog(params as any),
        enabled: !!params,
    });
}

export function useReportSummary(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.reportSummary(params),
        queryFn: () => visitorsApi.getReportSummary(params as any),
        enabled: !!params,
    });
}

export function useOverstayReport(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.overstayReport(params),
        queryFn: () => visitorsApi.getOverstayReport(params as any),
        enabled: !!params,
    });
}

export function useVisitorAnalytics(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.analytics(params),
        queryFn: () => visitorsApi.getAnalytics(params as any),
        enabled: !!params,
    });
}

// ── Emergency ──

export function useMusterList() {
    return useQuery({
        queryKey: visitorKeys.musterList(),
        queryFn: () => visitorsApi.getMusterList(),
    });
}

// ── Pass detail + event timeline ──

export function useMaterialPass(id: string) {
    return useQuery({
        queryKey: visitorKeys.materialPass(id),
        queryFn: () => visitorsApi.getMaterialPass(id),
        enabled: !!id,
    });
}

export function useMaterialPassEvents(id: string, params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.materialPassEvents(id, params),
        queryFn: () => visitorsApi.getMaterialPassEvents(id, params as any),
        enabled: !!id,
    });
}

export function useVehiclePass(id: string) {
    return useQuery({
        queryKey: visitorKeys.vehiclePass(id),
        queryFn: () => visitorsApi.getVehiclePass(id),
        enabled: !!id,
    });
}

export function useVehiclePassEvents(id: string, params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.vehiclePassEvents(id, params),
        queryFn: () => visitorsApi.getVehiclePassEvents(id, params as any),
        enabled: !!id,
    });
}

// ── Gate Ops dashboard ──

export function useGateOpsStats(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gateOpsStats(params),
        queryFn: () => visitorsApi.getGateOpsStats(params as any),
        refetchInterval: 30_000,
    });
}

export function useGateOpsExpectedMaterials(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gateOpsExpectedMaterials(params),
        queryFn: () => visitorsApi.getGateOpsExpectedMaterials(params as any),
        refetchInterval: 60_000,
    });
}

export function useGateOpsExpectedVisitors(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gateOpsExpectedVisitors(params),
        queryFn: () => visitorsApi.getGateOpsExpectedVisitors(params as any),
        refetchInterval: 60_000,
    });
}

export function useGateOpsExpectedVehicles(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gateOpsExpectedVehicles(params),
        queryFn: () => visitorsApi.getGateOpsExpectedVehicles(params as any),
        refetchInterval: 60_000,
    });
}

export function useGateOpsRecentActivity(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: visitorKeys.gateOpsRecentActivity(params),
        queryFn: () => visitorsApi.getGateOpsRecentActivity(params as any),
        refetchInterval: 30_000,
    });
}
