import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { invoiceApi } from '@/lib/api/invoice';

export const invoiceKeys = {
    all: ['invoices'] as const,
    lists: () => [...invoiceKeys.all, 'list'] as const,
    list: (params: any) => [...invoiceKeys.lists(), params] as const,
    details: () => [...invoiceKeys.all, 'detail'] as const,
    detail: (id: string) => [...invoiceKeys.details(), id] as const,
};

export function useInvoiceList(params?: {
    page?: number;
    limit?: number;
    status?: string;
    invoiceType?: string;
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}) {
    return useQuery({
        queryKey: invoiceKeys.list(params),
        queryFn: () => invoiceApi.listInvoices(params),
    });
}

export function useInvoiceDetail(invoiceId: string) {
    return useQuery({
        queryKey: invoiceKeys.detail(invoiceId),
        queryFn: () => invoiceApi.getInvoiceDetail(invoiceId),
        enabled: !!invoiceId,
    });
}

export function useGenerateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (payload: {
            companyId: string;
            locationId?: string;
            invoiceType: string;
            billingPeriodStart?: string;
            billingPeriodEnd?: string;
        }) => invoiceApi.generateInvoice(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.all });
        },
    });
}

export function useMarkAsPaid() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({
            invoiceId,
            payload,
        }: {
            invoiceId: string;
            payload: {
                paymentMethod: string;
                paymentReference?: string;
                paymentDate: string;
                notes?: string;
            };
        }) => invoiceApi.markAsPaid(invoiceId, payload),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(variables.invoiceId) });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
}

export function useVoidInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (invoiceId: string) => invoiceApi.voidInvoice(invoiceId),
        onSuccess: (_, invoiceId) => {
            queryClient.invalidateQueries({ queryKey: invoiceKeys.detail(invoiceId) });
            queryClient.invalidateQueries({ queryKey: invoiceKeys.lists() });
        },
    });
}

export function useSendInvoiceEmail() {
    return useMutation({
        mutationFn: (invoiceId: string) => invoiceApi.sendEmail(invoiceId),
    });
}
