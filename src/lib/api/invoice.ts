import { client } from './client';
import type { ApiResponse } from './auth';

// ── API Functions ──

async function listInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
    invoiceType?: string;
    companyId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/platform/billing/invoices', { params });
    return response.data;
}

async function getInvoiceDetail(invoiceId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/platform/billing/invoices/${invoiceId}`);
    return response.data;
}

async function generateInvoice(payload: {
    companyId: string;
    locationId?: string;
    invoiceType: string;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.post('/platform/billing/invoices/generate', payload);
    return response.data;
}

async function markAsPaid(invoiceId: string, payload: {
    paymentMethod: string;
    paymentReference?: string;
    paymentDate: string;
    notes?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.patch(`/platform/billing/invoices/${invoiceId}/mark-paid`, payload);
    return response.data;
}

async function voidInvoice(invoiceId: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/platform/billing/invoices/${invoiceId}/void`);
    return response.data;
}

async function sendEmail(invoiceId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/platform/billing/invoices/${invoiceId}/send-email`);
    return response.data;
}

async function downloadPdf(invoiceId: string): Promise<Blob> {
    const response = await client.get(`/platform/billing/invoices/${invoiceId}/pdf`, {
        responseType: 'blob',
    });
    return response.data;
}

export const invoiceApi = {
    listInvoices,
    getInvoiceDetail,
    generateInvoice,
    markAsPaid,
    voidInvoice,
    sendEmail,
    downloadPdf,
};
