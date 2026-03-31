import { useMutation, useQueryClient } from '@tanstack/react-query';
import { essApi } from '@/lib/api/ess';
import { essKeys } from './use-ess-queries';
import { leaveKeys } from './use-leave-queries';

// ── ESS Config ──

export function useUpdateEssConfig() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.updateEssConfig(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.essConfig() });
        },
    });
}

// ── Approval Workflows ──

export function useCreateApprovalWorkflow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createApprovalWorkflow(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.workflows() });
        },
    });
}

export function useUpdateApprovalWorkflow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            essApi.updateApprovalWorkflow(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: essKeys.workflows() });
            queryClient.invalidateQueries({ queryKey: essKeys.workflow(id) });
        },
    });
}

export function useDeleteApprovalWorkflow() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.deleteApprovalWorkflow(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.workflows() });
        },
    });
}

// ── Approval Requests ──

export function useApproveRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            essApi.approveRequest(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: essKeys.requests() });
            queryClient.invalidateQueries({ queryKey: essKeys.request(id) });
            queryClient.invalidateQueries({ queryKey: essKeys.pendingApprovals() });
        },
    });
}

export function useRejectRequest() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            essApi.rejectRequest(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: essKeys.requests() });
            queryClient.invalidateQueries({ queryKey: essKeys.request(id) });
            queryClient.invalidateQueries({ queryKey: essKeys.pendingApprovals() });
        },
    });
}

// ── Notification Templates ──

export function useCreateNotificationTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createNotificationTemplate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationTemplates() });
        },
    });
}

export function useUpdateNotificationTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            essApi.updateNotificationTemplate(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationTemplates() });
        },
    });
}

export function useDeleteNotificationTemplate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.deleteNotificationTemplate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationTemplates() });
        },
    });
}

// ── Notification Rules ──

export function useCreateNotificationRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createNotificationRule(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationRules() });
        },
    });
}

export function useUpdateNotificationRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            essApi.updateNotificationRule(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationRules() });
        },
    });
}

export function useDeleteNotificationRule() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.deleteNotificationRule(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.notificationRules() });
        },
    });
}

// ── IT Declarations ──

export function useCreateITDeclaration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createITDeclaration(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclarations() });
        },
    });
}

export function useUpdateITDeclaration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) =>
            essApi.updateITDeclaration(id, data),
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclarations() });
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclaration(id) });
        },
    });
}

export function useSubmitITDeclaration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.submitITDeclaration(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclarations() });
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclaration(id) });
        },
    });
}

export function useVerifyITDeclaration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.verifyITDeclaration(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclarations() });
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclaration(id) });
        },
    });
}

export function useLockITDeclaration() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.lockITDeclaration(id),
        onSuccess: (_, id) => {
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclarations() });
            queryClient.invalidateQueries({ queryKey: essKeys.itDeclaration(id) });
        },
    });
}

// ── ESS Self-Service Mutations ──

export function useApplyLeave() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.applyLeave(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.myLeaveBalance() });
        },
    });
}

export function useRegularizeAttendance() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.regularizeAttendance(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: essKeys.myAttendance() });
        },
    });
}

export function useUpdateMyProfile() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.updateMyProfile(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myProfile() });
        },
    });
}

export function useCancelLeave() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.cancelLeave(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myLeaveBalance() });
            qc.invalidateQueries({ queryKey: leaveKeys.requests() });
            qc.invalidateQueries({ queryKey: leaveKeys.balances() });
            qc.invalidateQueries({ queryKey: leaveKeys.summary() });
        },
    });
}

export function useDownloadPayslipPdf() {
    return useMutation({
        mutationFn: (payslipId: string) => essApi.downloadPayslipPdf(payslipId),
    });
}

// ── Shift Swap ──

export function useCreateShiftSwap() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createShiftSwap(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myShiftSwaps() });
        },
    });
}

export function useCancelShiftSwap() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.cancelShiftSwap(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myShiftSwaps() });
        },
    });
}

// ── WFH ──

export function useCreateWfhRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createWfhRequest(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myWfhRequests() });
        },
    });
}

export function useCancelWfhRequest() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.cancelWfhRequest(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myWfhRequests() });
        },
    });
}

// ── Expense Claims ──

export function useCreateMyExpenseClaim() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.createMyExpenseClaim(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myExpenseClaims() });
        },
    });
}

export function useSubmitMyExpenseClaim() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => essApi.submitMyExpenseClaim(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myExpenseClaims() });
        },
    });
}

// ── Loan Application ──

export function useApplyForLoan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.applyForLoan(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myLoans() });
        },
    });
}

// ── Documents ──

export function useUploadMyDocument() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => essApi.uploadMyDocument(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: essKeys.myDocuments() });
        },
    });
}
