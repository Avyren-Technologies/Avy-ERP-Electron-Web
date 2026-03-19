import { client } from './client';
import type { ApiResponse } from './auth';

// --- Types ---

export type PaymentMethod =
  | 'BANK_TRANSFER'
  | 'CHEQUE'
  | 'CASH'
  | 'RAZORPAY'
  | 'UPI'
  | 'OTHER';

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  invoiceNumber?: string;
  tenantName?: string;
  amount: number;
  method: PaymentMethod;
  transactionReference?: string;
  paidAt: string;
  notes?: string;
  createdAt: string;
}

export interface RecordPaymentPayload {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  transactionReference?: string;
  paidAt: string;
  notes?: string;
}

// --- API Functions ---

async function listPayments(params?: {
  page?: number;
  limit?: number;
  companyId?: string;
  invoiceId?: string;
  dateFrom?: string;
  dateTo?: string;
  method?: string;
}): Promise<ApiResponse<any>> {
  const response = await client.get('/platform/billing/payments', { params });
  return response.data;
}

async function getPaymentById(id: string): Promise<ApiResponse<PaymentRecord>> {
  const response = await client.get(`/platform/billing/payments/${id}`);
  return response.data;
}

async function recordPayment(data: RecordPaymentPayload): Promise<ApiResponse<PaymentRecord>> {
  const response = await client.post('/platform/billing/payments/record', data);
  return response.data;
}

export const paymentApi = {
  listPayments,
  getPaymentById,
  recordPayment,
};
