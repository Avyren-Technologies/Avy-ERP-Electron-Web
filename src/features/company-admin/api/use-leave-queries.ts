import { useQuery } from '@tanstack/react-query';
import { leaveApi } from '@/lib/api/leave';

export const leaveKeys = {
    all: ['leave'] as const,
    leaveTypes: (params?: Record<string, unknown>) => [...leaveKeys.all, 'leave-types', params] as const,
    leaveType: (id: string) => [...leaveKeys.all, 'leave-type', id] as const,
    policies: (params?: Record<string, unknown>) => [...leaveKeys.all, 'policies', params] as const,
    balances: (params?: Record<string, unknown>) => [...leaveKeys.all, 'balances', params] as const,
    requests: (params?: Record<string, unknown>) => [...leaveKeys.all, 'requests', params] as const,
    request: (id: string) => [...leaveKeys.all, 'request', id] as const,
    summary: () => [...leaveKeys.all, 'summary'] as const,
};

// ── Leave Types ──

export function useLeaveTypes(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: leaveKeys.leaveTypes(params),
        queryFn: () => leaveApi.listLeaveTypes(params as any),
    });
}

export function useLeaveType(id: string) {
    return useQuery({
        queryKey: leaveKeys.leaveType(id),
        queryFn: () => leaveApi.getLeaveType(id),
        enabled: !!id,
    });
}

// ── Leave Policies ──

export function useLeavePolicies(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: leaveKeys.policies(params),
        queryFn: () => leaveApi.listPolicies(params as any),
    });
}

// ── Leave Balances ──

export function useLeaveBalances(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: leaveKeys.balances(params),
        queryFn: () => leaveApi.listBalances(params as any),
    });
}

// ── Leave Requests ──

export function useLeaveRequests(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: leaveKeys.requests(params),
        queryFn: () => leaveApi.listRequests(params as any),
    });
}

export function useLeaveRequest(id: string) {
    return useQuery({
        queryKey: leaveKeys.request(id),
        queryFn: () => leaveApi.getRequest(id),
        enabled: !!id,
    });
}

// ── Summary ──

export function useLeaveSummary() {
    return useQuery({
        queryKey: leaveKeys.summary(),
        queryFn: () => leaveApi.getSummary(),
    });
}
