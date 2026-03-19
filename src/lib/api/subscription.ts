import { client } from './client';
import type { ApiResponse } from './auth';

// --- Types ---

export type BillingType = 'MONTHLY' | 'ANNUAL' | 'ONE_TIME_AMC';
export type SubscriptionStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED' | 'EXPIRED';
export type AmcStatus = 'ACTIVE' | 'OVERDUE' | 'LAPSED' | 'NOT_APPLICABLE';

export interface LocationCostBreakdown {
    locationId: string;
    locationName: string;
    facilityType: string;
    billingType: BillingType;
    userTier: string;
    modulesCount: number;
    moduleIds: string[];
    endpointType: 'default' | 'custom';
    monthlyCost?: number;
    annualCost?: number;
    oneTimeCost?: number;
    amcCost?: number;
    amcStatus?: AmcStatus;
    amcDueDate?: string;
    nextRenewalDate?: string;
    trialEndDate?: string;
    customUserLimit?: number;
    customTierPrice?: number;
}

export interface SubscriptionDetail {
    companyId: string;
    tenantName: string;
    status: SubscriptionStatus;
    defaultBillingType: BillingType;
    startDate: string;
    locations: LocationCostBreakdown[];
}

export interface CostPreviewResponse {
    currentCost: number;
    newCost: number;
    difference: number;
    billingType: BillingType;
}

export interface ChangeBillingTypePayload {
    billingType: BillingType;
    locationId?: string;
    oneTimeOverride?: number;
    amcOverride?: number;
}

export interface ChangeTierPayload {
    locationId?: string;
    newTier: string;
    customUserLimit?: number;
    customTierPrice?: number;
}

export interface ExtendTrialPayload {
    newEndDate: string;
    locationId?: string;
}

// --- API Functions ---

async function getDetail(companyId: string): Promise<ApiResponse<SubscriptionDetail>> {
    const response = await client.get(`/platform/billing/subscriptions/${companyId}`);
    return response.data;
}

async function getCostPreview(
    companyId: string,
    params: { billingType?: BillingType; locationId?: string },
): Promise<ApiResponse<CostPreviewResponse>> {
    const response = await client.get(`/platform/billing/subscriptions/${companyId}/cost-preview`, { params });
    return response.data;
}

async function changeBillingType(companyId: string, data: ChangeBillingTypePayload): Promise<ApiResponse<any>> {
    const response = await client.patch(`/platform/billing/subscriptions/${companyId}/billing-type`, data);
    return response.data;
}

async function changeTier(companyId: string, data: ChangeTierPayload): Promise<ApiResponse<any>> {
    const response = await client.patch(`/platform/billing/subscriptions/${companyId}/tier`, data);
    return response.data;
}

async function extendTrial(companyId: string, data: ExtendTrialPayload): Promise<ApiResponse<any>> {
    const response = await client.patch(`/platform/billing/subscriptions/${companyId}/trial`, data);
    return response.data;
}

async function cancel(companyId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/platform/billing/subscriptions/${companyId}/cancel`);
    return response.data;
}

async function reactivate(companyId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/platform/billing/subscriptions/${companyId}/reactivate`);
    return response.data;
}

export const subscriptionApi = {
    getDetail,
    getCostPreview,
    changeBillingType,
    changeTier,
    extendTrial,
    cancel,
    reactivate,
};
