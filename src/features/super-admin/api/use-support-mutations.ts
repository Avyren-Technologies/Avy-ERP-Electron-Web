import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi } from '@/lib/api/support';
import { platformSupportKeys } from './use-support-queries';
import { companyAdminKeys } from '@/features/company-admin/api/use-company-admin-queries';

export function useReplySupportTicket() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }: { id: string; body: string }) =>
            supportApi.replyToTicket(id, { body }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: platformSupportKeys.ticket(vars.id) });
            qc.invalidateQueries({ queryKey: companyAdminKeys.supportTicket(vars.id) });
        },
    });
}

export function useUpdateTicketStatus() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            supportApi.updateTicketStatus(id, { status }),
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: platformSupportKeys.tickets() });
            qc.invalidateQueries({ queryKey: platformSupportKeys.ticket(vars.id) });
            qc.invalidateQueries({ queryKey: platformSupportKeys.stats() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.supportTickets() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.supportTicket(vars.id) });
        },
    });
}

export function useApproveModuleChange() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => supportApi.approveModuleChange(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: platformSupportKeys.tickets() });
            qc.invalidateQueries({ queryKey: platformSupportKeys.stats() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.supportTickets() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.locations() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.profile() });
        },
    });
}

export function useRejectModuleChange() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }: { id: string; reason: string }) =>
            supportApi.rejectModuleChange(id, { reason }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: platformSupportKeys.tickets() });
            qc.invalidateQueries({ queryKey: platformSupportKeys.stats() });
            qc.invalidateQueries({ queryKey: companyAdminKeys.supportTickets() });
        },
    });
}
