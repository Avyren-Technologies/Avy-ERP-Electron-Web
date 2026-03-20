import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transferApi } from '@/lib/api/transfer';
import { transferKeys } from './use-transfer-queries';

// ── Transfers ──

export function useCreateTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => transferApi.createTransfer(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transferKeys.transfers() });
        },
    });
}

export function useApproveTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.approveTransfer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.transfer(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.transfers() });
        },
    });
}

export function useApplyTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.applyTransfer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.transfer(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.transfers() });
        },
    });
}

export function useRejectTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.rejectTransfer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.transfer(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.transfers() });
        },
    });
}

export function useCancelTransfer() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.cancelTransfer(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.transfer(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.transfers() });
        },
    });
}

// ── Promotions ──

export function useCreatePromotion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => transferApi.createPromotion(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transferKeys.promotions() });
        },
    });
}

export function useApprovePromotion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.approvePromotion(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.promotion(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.promotions() });
        },
    });
}

export function useApplyPromotion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.applyPromotion(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.promotion(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.promotions() });
        },
    });
}

export function useRejectPromotion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.rejectPromotion(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.promotion(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.promotions() });
        },
    });
}

export function useCancelPromotion() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data?: any }) =>
            transferApi.cancelPromotion(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: transferKeys.promotion(variables.id) });
            queryClient.invalidateQueries({ queryKey: transferKeys.promotions() });
        },
    });
}

// ── Delegates ──

export function useCreateDelegate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => transferApi.createDelegate(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transferKeys.delegates() });
        },
    });
}

export function useRevokeDelegate() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => transferApi.revokeDelegate(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: transferKeys.delegates() });
        },
    });
}
