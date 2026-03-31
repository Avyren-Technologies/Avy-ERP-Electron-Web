import { useQuery } from '@tanstack/react-query';
import { essApi } from '@/lib/api/ess';

export const essKeys = {
    all: ['ess'] as const,

    // Dashboard
    dashboard: () =>
        [...essKeys.all, 'dashboard'] as const,

    // ESS Config
    essConfig: () =>
        [...essKeys.all, 'config'] as const,

    // Approval Workflows
    workflows: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'workflows', params] as const,
    workflow: (id: string) =>
        [...essKeys.all, 'workflow', id] as const,

    // Approval Requests
    requests: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'requests', params] as const,
    request: (id: string) =>
        [...essKeys.all, 'request', id] as const,
    pendingApprovals: () =>
        [...essKeys.all, 'pending-approvals'] as const,

    // Notification Templates
    notificationTemplates: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'notification-templates', params] as const,

    // Notification Rules
    notificationRules: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'notification-rules', params] as const,

    // IT Declarations
    itDeclarations: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'it-declarations', params] as const,
    itDeclaration: (id: string) =>
        [...essKeys.all, 'it-declaration', id] as const,

    // ESS Self-Service
    myProfile: () =>
        [...essKeys.all, 'my-profile'] as const,
    myPayslips: () =>
        [...essKeys.all, 'my-payslips'] as const,
    myLeaveBalance: () =>
        [...essKeys.all, 'my-leave-balance'] as const,
    myAttendance: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'my-attendance', params] as const,
    myDeclarations: () =>
        [...essKeys.all, 'my-declarations'] as const,

    // Shift Swap, WFH, Documents, Policies
    myShiftSwaps: () => [...essKeys.all, 'my-shift-swaps'] as const,
    myWfhRequests: () => [...essKeys.all, 'my-wfh-requests'] as const,
    myDocuments: () => [...essKeys.all, 'my-documents'] as const,
    policyDocuments: () => [...essKeys.all, 'policy-documents'] as const,

    // MSS Manager Self-Service
    teamMembers: (params?: Record<string, unknown>) =>
        [...essKeys.all, 'team-members', params] as const,
    pendingMssApprovals: () =>
        [...essKeys.all, 'pending-mss-approvals'] as const,
    teamAttendance: () =>
        [...essKeys.all, 'team-attendance'] as const,
    teamLeaveCalendar: () =>
        [...essKeys.all, 'team-leave-calendar'] as const,
};

// ── Dashboard ──

export function useDashboard() {
    return useQuery({
        queryKey: essKeys.dashboard(),
        queryFn: () => essApi.getDashboard(),
        refetchInterval: 30_000,
    });
}

// ── ESS Config ──

export function useEssConfig() {
    return useQuery({
        queryKey: essKeys.essConfig(),
        queryFn: () => essApi.getEssConfig(),
    });
}

// ── Approval Workflows ──

export function useApprovalWorkflows(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.workflows(params),
        queryFn: () => essApi.listApprovalWorkflows(params as any),
    });
}

export function useApprovalWorkflow(id: string) {
    return useQuery({
        queryKey: essKeys.workflow(id),
        queryFn: () => essApi.getApprovalWorkflow(id),
        enabled: !!id,
    });
}

// ── Approval Requests ──

export function useApprovalRequests(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.requests(params),
        queryFn: () => essApi.listApprovalRequests(params as any),
    });
}

export function useApprovalRequest(id: string) {
    return useQuery({
        queryKey: essKeys.request(id),
        queryFn: () => essApi.getApprovalRequest(id),
        enabled: !!id,
    });
}

export function usePendingApprovals() {
    return useQuery({
        queryKey: essKeys.pendingApprovals(),
        queryFn: () => essApi.getPendingApprovals(),
    });
}

// ── Notification Templates ──

export function useNotificationTemplates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.notificationTemplates(params),
        queryFn: () => essApi.listNotificationTemplates(params as any),
    });
}

// ── Notification Rules ──

export function useNotificationRules(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.notificationRules(params),
        queryFn: () => essApi.listNotificationRules(params as any),
    });
}

// ── IT Declarations ──

export function useITDeclarations(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.itDeclarations(params),
        queryFn: () => essApi.listITDeclarations(params as any),
    });
}

export function useITDeclaration(id: string) {
    return useQuery({
        queryKey: essKeys.itDeclaration(id),
        queryFn: () => essApi.getITDeclaration(id),
        enabled: !!id,
    });
}

// ── ESS Self-Service ──

export function useMyProfile() {
    return useQuery({
        queryKey: essKeys.myProfile(),
        queryFn: () => essApi.getMyProfile(),
    });
}

export function useMyPayslips() {
    return useQuery({
        queryKey: essKeys.myPayslips(),
        queryFn: () => essApi.getMyPayslips(),
    });
}

export function useMyLeaveBalance() {
    return useQuery({
        queryKey: essKeys.myLeaveBalance(),
        queryFn: () => essApi.getMyLeaveBalance(),
    });
}

export function useMyAttendance(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.myAttendance(params),
        queryFn: () => essApi.getMyAttendance(params as any),
    });
}

export function useMyDeclarations() {
    return useQuery({
        queryKey: essKeys.myDeclarations(),
        queryFn: () => essApi.getMyDeclarations(),
    });
}

// ── MSS Manager Self-Service ──

export function useTeamMembers(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: essKeys.teamMembers(params),
        queryFn: () => essApi.getTeamMembers(params as any),
    });
}

export function usePendingMssApprovals() {
    return useQuery({
        queryKey: essKeys.pendingMssApprovals(),
        queryFn: () => essApi.getPendingMssApprovals(),
    });
}

export function useTeamAttendance() {
    return useQuery({
        queryKey: essKeys.teamAttendance(),
        queryFn: () => essApi.getTeamAttendance(),
    });
}

export function useTeamLeaveCalendar() {
    return useQuery({
        queryKey: essKeys.teamLeaveCalendar(),
        queryFn: () => essApi.getTeamLeaveCalendar(),
    });
}

// ── Shift Swap, WFH, Documents, Policies ──

export function useMyShiftSwaps() {
    return useQuery({
        queryKey: essKeys.myShiftSwaps(),
        queryFn: () => essApi.getMyShiftSwaps(),
    });
}

export function useMyWfhRequests() {
    return useQuery({
        queryKey: essKeys.myWfhRequests(),
        queryFn: () => essApi.getMyWfhRequests(),
    });
}

export function useMyDocuments() {
    return useQuery({
        queryKey: essKeys.myDocuments(),
        queryFn: () => essApi.getMyDocuments(),
    });
}

export function usePolicyDocuments() {
    return useQuery({
        queryKey: essKeys.policyDocuments(),
        queryFn: () => essApi.getPolicyDocuments(),
    });
}
