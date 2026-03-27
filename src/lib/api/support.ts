import { client } from './client';

export const supportApi = {
    listTickets: (params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) =>
        client.get('/platform/support/tickets', { params }).then(r => r.data),
    getTicket: (id: string) =>
        client.get(`/platform/support/tickets/${id}`).then(r => r.data),
    replyToTicket: (id: string, data: { body: string }) =>
        client.post(`/platform/support/tickets/${id}/messages`, data).then(r => r.data),
    updateTicketStatus: (id: string, data: { status: string }) =>
        client.patch(`/platform/support/tickets/${id}/status`, data).then(r => r.data),
    approveModuleChange: (id: string) =>
        client.post(`/platform/support/tickets/${id}/approve-module`).then(r => r.data),
    rejectModuleChange: (id: string, data: { reason: string }) =>
        client.post(`/platform/support/tickets/${id}/reject-module`, data).then(r => r.data),
    getStats: () =>
        client.get('/platform/support/stats').then(r => r.data),
};
