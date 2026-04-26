import { useMutation, useQueryClient } from '@tanstack/react-query';
import { visitorsApi } from '@/lib/api/visitors';
import { visitorKeys } from './use-visitor-queries';

// ── Visits ──

export function useCreateVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createVisit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardStats() });
        },
    });
}

export function useUpdateVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
        },
    });
}

export function useDeleteVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deleteVisit(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardStats() });
        },
    });
}

export function useCheckInVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.checkInVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardStats() });
        },
    });
}

export function useCheckOutVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.checkOutVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardStats() });
        },
    });
}

export function useApproveVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.approveVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
        },
    });
}

export function useRejectVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.rejectVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
        },
    });
}

export function useExtendVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.extendVisit(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.visits() });
        },
    });
}

export function useCompleteInduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.completeInduction(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.visit(variables.id) });
        },
    });
}

// ── Visitor Types ──

export function useCreateVisitorType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createVisitorType(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.types() });
        },
    });
}

export function useUpdateVisitorType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateVisitorType(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.type(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.types() });
        },
    });
}

export function useDeactivateVisitorType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deactivateVisitorType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.types() });
        },
    });
}

export function useActivateVisitorType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.activateVisitorType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.types() });
        },
    });
}

export function useDeleteVisitorType() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deleteVisitorType(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.types() });
        },
    });
}

// ── Gates ──

export function useCreateGate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createGate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.gates() });
        },
    });
}

export function useUpdateGate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateGate(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.gate(variables.id) });
            queryClient.invalidateQueries({ queryKey: visitorKeys.gates() });
        },
    });
}

export function useDeleteGate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deleteGate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.gates() });
        },
    });
}

// ── Safety Inductions ──

export function useCreateSafetyInduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createSafetyInduction(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.inductions() });
        },
    });
}

export function useUpdateSafetyInduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateSafetyInduction(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.inductions() });
        },
    });
}

export function useDeleteSafetyInduction() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deleteSafetyInduction(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.inductions() });
        },
    });
}

// ── VMS Config ──

export function useUpdateVmsConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.updateVmsConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.config() });
        },
    });
}

// ── Watchlist ──

export function useCreateWatchlistEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createWatchlistEntry(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.watchlist() });
        },
    });
}

export function useUpdateWatchlistEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateWatchlistEntry(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.watchlist() });
        },
    });
}

export function useDeleteWatchlistEntry() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => visitorsApi.deleteWatchlistEntry(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.watchlist() });
        },
    });
}

export function useCheckWatchlist() {
    return useMutation({
        mutationFn: (data: any) => visitorsApi.checkWatchlist(data),
    });
}

// ── Recurring Passes ──

export function useCreateRecurringPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createRecurringPass(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.recurringPasses() });
        },
    });
}

export function useUpdateRecurringPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateRecurringPass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.recurringPasses() });
        },
    });
}

export function useRevokeRecurringPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { reason: string } }) => visitorsApi.revokeRecurringPass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.recurringPasses() });
        },
    });
}

export function useCheckInRecurringPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.checkInRecurringPass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.recurringPasses() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
        },
    });
}

// ── Group Visits ──

export function useCreateGroupVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createGroupVisit(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.groupVisits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
        },
    });
}

export function useUpdateGroupVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            visitorsApi.updateGroupVisit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.groupVisits() });
        },
    });
}

export function useBatchCheckInGroupVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.batchCheckInGroupVisit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.groupVisits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
        },
    });
}

export function useBatchCheckOutGroupVisit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.batchCheckOutGroupVisit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.groupVisits() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardToday() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
        },
    });
}

// ── Vehicle Passes ──

export function useCreateVehiclePass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createVehiclePass(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.vehiclePasses() });
        },
    });
}

export function useRecordVehicleExit() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            visitorsApi.recordVehicleExit(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.vehiclePasses() });
        },
    });
}

// ── Material Passes ──

export function useCreateMaterialPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.createMaterialPass(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.materialPasses() });
        },
    });
}

export function useReturnMaterialPass() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { quantityReturned: string; returnStatus: string } }) =>
            visitorsApi.returnMaterialPass(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.materialPasses() });
        },
    });
}

// ── Emergency ──

export function useTriggerEmergency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.triggerEmergency(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.musterList() });
        },
    });
}

export function useMarkSafe() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => visitorsApi.markSafe(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.musterList() });
        },
    });
}

export function useResolveEmergency() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data?: any) => visitorsApi.resolveEmergency(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: visitorKeys.musterList() });
            queryClient.invalidateQueries({ queryKey: visitorKeys.dashboardOnSite() });
        },
    });
}
