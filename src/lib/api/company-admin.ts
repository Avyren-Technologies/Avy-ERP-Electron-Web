import { client } from './client';
import type { ApiResponse } from './auth';

// ── Types ──

export interface CompanyProfile {
    id: string;
    name: string;
    displayName?: string;
    legalName?: string;
    companyCode?: string;
    industry?: string;
    businessType?: string;
    wizardStatus?: string;
    gstin?: string;
    pan?: string;
    cin?: string;
    tan?: string;
    address?: {
        line1?: string;
        line2?: string;
        city?: string;
        state?: string;
        pincode?: string;
        country?: string;
    };
    fiscalYearStart?: string;
    fiscalYearEnd?: string;
    dateFormat?: string;
    timeZone?: string;
    currency?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CompanyLocation {
    id: string;
    name: string;
    code?: string;
    facilityType?: string;
    customFacilityType?: string;
    status?: string;
    isHQ?: boolean;
    gstin?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    contactName?: string;
    contactDesignation?: string;
    contactEmail?: string;
    contactPhone?: string;
    geoEnabled?: boolean;
    latitude?: number;
    longitude?: number;
    geoRadius?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CompanyShift {
    id: string;
    name: string;
    code?: string;
    fromTime: string;
    toTime: string;
    noShuffle?: boolean;
    downtimeSlots?: Array<{ type: string; duration: string }>;
    status?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateShiftPayload {
    name: string;
    fromTime: string;
    toTime: string;
    noShuffle?: boolean;
    downtimeSlots?: Array<{ type: string; duration: string }>;
}

export interface CompanyContact {
    id: string;
    name: string;
    designation?: string;
    email?: string;
    countryCode?: string;
    phone?: string;
    type?: string;
    isPrimary?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateContactPayload {
    name: string;
    designation?: string;
    email?: string;
    countryCode?: string;
    phone?: string;
    type?: string;
    isPrimary?: boolean;
}

export interface NoSeriesConfig {
    id: string;
    code: string;
    linkedScreen: string;
    description?: string;
    prefix: string;
    suffix?: string;
    numberCount?: number;
    startNumber?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateNoSeriesPayload {
    code: string;
    linkedScreen: string;
    description?: string;
    prefix: string;
    suffix?: string;
    numberCount?: number;
    startNumber?: number;
}

export interface IOTReason {
    id: string;
    reasonType: string;
    reason: string;
    description?: string;
    department?: string;
    planned: boolean;
    duration?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateIOTReasonPayload {
    reasonType: string;
    reason: string;
    description?: string;
    department?: string;
    planned: boolean;
    duration?: string;
}

export interface SystemControls {
    [key: string]: boolean | string | number;
}

export interface CompanySettings {
    locale?: string;
    dateFormat?: string;
    timeZone?: string;
    currency?: string;
    complianceMode?: string;
    portalEnabled?: boolean;
    integrations?: Record<string, unknown>;
    [key: string]: unknown;
}

export interface CompanyUser {
    id: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    email: string;
    role?: string;
    department?: string;
    location?: string;
    isActive?: boolean;
    lastLogin?: string;
    lastLoginAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateUserPayload {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
}

export interface UpdateUserPayload {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: string;
}

export interface AuditLogEntry {
    id: string;
    action: string;
    entityType?: string;
    entityId?: string;
    userId?: string;
    userName?: string;
    details?: Record<string, unknown>;
    ipAddress?: string;
    createdAt: string;
}

export interface ActivityItem {
    id?: string;
    action?: string;
    text?: string;
    description?: string;
    entityType?: string;
    timestamp?: string;
    time?: string;
}

export interface CompanyAdminStats {
    totalUsers?: number;
    totalEmployees?: number;
    activeUsers?: number;
    totalLocations?: number;
    activeLocations?: number;
    activeModules?: number;
    companyStatus?: string;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

// ── Profile ──

async function getProfile(): Promise<ApiResponse<CompanyProfile>> {
    const response = await client.get('/company/profile');
    return response.data;
}

async function updateProfileSection(
    sectionKey: string,
    data: Record<string, unknown>,
): Promise<ApiResponse<CompanyProfile>> {
    const response = await client.patch(
        `/company/profile/sections/${sectionKey}`,
        data,
    );
    return response.data;
}

// ── Locations ──

async function listLocations(): Promise<ApiResponse<CompanyLocation[]>> {
    const response = await client.get('/company/locations');
    return response.data;
}

async function getLocation(id: string): Promise<ApiResponse<CompanyLocation>> {
    const response = await client.get(`/company/locations/${id}`);
    return response.data;
}

async function updateLocation(id: string, data: Partial<CompanyLocation>): Promise<ApiResponse<CompanyLocation>> {
    const response = await client.patch(`/company/locations/${id}`, data);
    return response.data;
}

async function deleteLocation(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/company/locations/${id}`);
    return response.data;
}

// ── Shifts ──

async function listShifts(): Promise<ApiResponse<CompanyShift[]>> {
    const response = await client.get('/company/shifts');
    return response.data;
}

async function createShift(data: CreateShiftPayload): Promise<ApiResponse<CompanyShift>> {
    const response = await client.post('/company/shifts', data);
    return response.data;
}

async function updateShift(id: string, data: Partial<CreateShiftPayload>): Promise<ApiResponse<CompanyShift>> {
    const response = await client.patch(`/company/shifts/${id}`, data);
    return response.data;
}

async function deleteShift(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/company/shifts/${id}`);
    return response.data;
}

// ── Contacts ──

async function listContacts(): Promise<ApiResponse<CompanyContact[]>> {
    const response = await client.get('/company/contacts');
    return response.data;
}

async function createContact(data: CreateContactPayload): Promise<ApiResponse<CompanyContact>> {
    const response = await client.post('/company/contacts', data);
    return response.data;
}

async function updateContact(id: string, data: Partial<CreateContactPayload>): Promise<ApiResponse<CompanyContact>> {
    const response = await client.patch(`/company/contacts/${id}`, data);
    return response.data;
}

async function deleteContact(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/company/contacts/${id}`);
    return response.data;
}

// ── No Series ──

async function listNoSeries(): Promise<ApiResponse<NoSeriesConfig[]>> {
    const response = await client.get('/company/no-series');
    return response.data;
}

async function createNoSeries(data: CreateNoSeriesPayload): Promise<ApiResponse<NoSeriesConfig>> {
    const response = await client.post('/company/no-series', data);
    return response.data;
}

async function updateNoSeries(id: string, data: Partial<CreateNoSeriesPayload>): Promise<ApiResponse<NoSeriesConfig>> {
    const response = await client.patch(`/company/no-series/${id}`, data);
    return response.data;
}

async function deleteNoSeries(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/company/no-series/${id}`);
    return response.data;
}

// ── IOT Reasons ──

async function listIOTReasons(): Promise<ApiResponse<IOTReason[]>> {
    const response = await client.get('/company/iot-reasons');
    return response.data;
}

async function createIOTReason(data: CreateIOTReasonPayload): Promise<ApiResponse<IOTReason>> {
    const response = await client.post('/company/iot-reasons', data);
    return response.data;
}

async function updateIOTReason(id: string, data: Partial<CreateIOTReasonPayload>): Promise<ApiResponse<IOTReason>> {
    const response = await client.patch(`/company/iot-reasons/${id}`, data);
    return response.data;
}

async function deleteIOTReason(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/company/iot-reasons/${id}`);
    return response.data;
}

// ── Controls ──

async function getControls(): Promise<ApiResponse<SystemControls>> {
    const response = await client.get('/company/controls');
    return response.data;
}

async function updateControls(data: SystemControls): Promise<ApiResponse<SystemControls>> {
    const response = await client.patch('/company/controls', data);
    return response.data;
}

// ── Settings ──

async function getSettings(): Promise<ApiResponse<CompanySettings>> {
    const response = await client.get('/company/settings');
    return response.data;
}

async function updateSettings(data: Partial<CompanySettings>): Promise<ApiResponse<CompanySettings>> {
    const response = await client.patch('/company/settings', data);
    return response.data;
}

// ── Users ──

async function listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
}): Promise<ApiResponse<CompanyUser[]>> {
    const response = await client.get('/company/users', { params });
    return response.data;
}

async function createUser(data: CreateUserPayload): Promise<ApiResponse<CompanyUser>> {
    const response = await client.post('/company/users', data);
    return response.data;
}

async function getUser(id: string): Promise<ApiResponse<CompanyUser>> {
    const response = await client.get(`/company/users/${id}`);
    return response.data;
}

async function updateUser(id: string, data: UpdateUserPayload): Promise<ApiResponse<CompanyUser>> {
    const response = await client.patch(`/company/users/${id}`, data);
    return response.data;
}

async function updateUserStatus(id: string, status: string): Promise<ApiResponse<CompanyUser>> {
    const isActive = status === 'active';
    const response = await client.patch(`/company/users/${id}/status`, { isActive });
    return response.data;
}

// ── Audit Logs ──

async function listAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
}): Promise<ApiResponse<AuditLogEntry[]>> {
    const response = await client.get('/company/audit-logs', { params });
    return response.data;
}

async function getAuditFilterOptions(): Promise<ApiResponse<{ actionTypes: string[]; entityTypes: string[] }>> {
    const response = await client.get('/company/audit-logs/filters');
    return response.data;
}

// ── Activity ──

async function getCompanyActivity(limit?: number): Promise<ApiResponse<ActivityItem[]>> {
    const response = await client.get('/dashboard/company-activity', { params: { limit } });
    return response.data;
}

// ── RBAC Roles ──

export interface RolePermission {
    module: string;
    view: boolean;
    create: boolean;
    edit: boolean;
    delete: boolean;
    approve: boolean;
}

// ── Permission Catalogue ──

export interface PermissionModuleEntry {
    module: string;
    label: string;
    actions: string[];
}

export interface PermissionCatalogue {
    permissions: string[];
    modules: PermissionModuleEntry[];
}

// ── Feature Toggle Catalogue ──

export interface FeatureToggleCatalogueItem {
    key: string;
    label: string;
    description?: string;
    module?: string;
    defaultEnabled?: boolean;
}

// ── Reference Roles ──

export interface ReferenceRole {
    name: string;
    description?: string;
    permissions: string[];
}

export interface RbacRole {
    id: string;
    name: string;
    description?: string;
    isSystem: boolean;
    userCount?: number;
    permissions: string[] | RolePermission[];
    createdAt?: string;
}

export interface CreateRolePayload {
    name: string;
    description?: string;
    permissions: string[];
}

async function listRoles(): Promise<ApiResponse<RbacRole[]>> {
    const response = await client.get('/rbac/roles');
    return response.data;
}

async function createRole(data: CreateRolePayload): Promise<ApiResponse<RbacRole>> {
    const response = await client.post('/rbac/roles', data);
    return response.data;
}

async function updateRole(id: string, data: CreateRolePayload): Promise<ApiResponse<RbacRole>> {
    const response = await client.patch(`/rbac/roles/${id}`, data);
    return response.data;
}

async function deleteRole(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/rbac/roles/${id}`);
    return response.data;
}

// ── Module Catalogue ──

export interface CatalogueModule {
    id: string;
    name: string;
    description?: string;
    category?: string;
    icon?: string;
    price?: string;
    pricingModel?: string;
    isRequired?: boolean;
    isActive?: boolean;
    dependencies?: string[];
    features?: string[];
}

async function getModuleCatalogue(): Promise<ApiResponse<CatalogueModule[]>> {
    const response = await client.get('/modules/catalogue');
    return response.data;
}

// ── Billing ──

export interface MySubscription {
    id: string;
    planId?: string;
    userTier?: string;
    billingType?: string;
    modules?: Record<string, boolean>;
    status?: string;
    startDate?: string;
    endDate?: string | null;
    trialEndsAt?: string | null;
    tierLabel?: string;
    tierBasePrice?: number;
    tierPerUserPrice?: number;
}

export interface CostBreakdownModule {
    moduleId: string;
    moduleName: string;
    cataloguePrice: number;
    customPrice: number | null;
    effectivePrice: number;
}

export interface CostBreakdownLocation {
    locationId: string;
    locationName: string;
    facilityType?: string;
    monthly: number;
    annual: number;
    [key: string]: unknown;
}

export interface CostBreakdown {
    tier: {
        key: string;
        label: string;
        basePrice: number;
        perUserPrice: number;
    };
    modules: CostBreakdownModule[];
    locations: CostBreakdownLocation[];
    totals: {
        monthly: number;
        annual: number;
        locationCount: number;
        moduleCount: number;
    };
}

export interface MyInvoice {
    id: string;
    invoiceNumber?: string;
    invoiceType?: string;
    date?: string;
    createdAt?: string;
    dueDate?: string;
    amount: number;
    subtotal?: number;
    totalTax?: number;
    totalAmount?: number;
    status: string;
    paidAt?: string | null;
    billingPeriodStart?: string;
    billingPeriodEnd?: string;
    lineItems?: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        amount: number;
        gst?: number;
    }>;
    pdfUrl?: string;
    payments?: MyPayment[];
}

export interface MyPayment {
    id: string;
    paidAt?: string;
    createdAt?: string;
    invoiceId?: string;
    amount: number;
    method?: string;
    reference?: string;
    status?: string;
    gateway?: string;
    invoice?: {
        id: string;
        invoiceNumber?: string;
        amount?: number;
        totalAmount?: number;
        status?: string;
    };
}

async function getMySubscription(): Promise<ApiResponse<MySubscription>> {
    const response = await client.get('/company/billing/subscription');
    return response.data;
}

async function getMyInvoices(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<{ invoices: MyInvoice[]; total: number; page: number; limit: number }>> {
    const response = await client.get('/company/billing/invoices', { params });
    return response.data;
}

async function getMyInvoiceDetail(id: string): Promise<ApiResponse<MyInvoice>> {
    const response = await client.get(`/company/billing/invoices/${id}`);
    return response.data;
}

async function getMyPayments(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<{ payments: MyPayment[]; total: number; page: number; limit: number }>> {
    const response = await client.get('/company/billing/payments', { params });
    return response.data;
}

async function getMyCostBreakdown(): Promise<ApiResponse<CostBreakdown>> {
    const response = await client.get('/company/billing/cost-breakdown');
    return response.data;
}

// ── Permission Catalogue ──

async function getPermissionCatalogue(): Promise<ApiResponse<PermissionCatalogue>> {
    const response = await client.get('/rbac/permissions');
    return response.data;
}

// ── Reference Roles ──

async function getReferenceRoles(): Promise<ApiResponse<ReferenceRole[]>> {
    const response = await client.get('/rbac/reference-roles');
    return response.data;
}

// ── Role Assignment ──

async function assignRole(userId: string, roleId: string): Promise<ApiResponse<void>> {
    const response = await client.post('/rbac/roles/assign', { userId, roleId });
    return response.data;
}

// ── Feature Toggle Catalogue ──

async function getFeatureToggleCatalogue(): Promise<ApiResponse<FeatureToggleCatalogueItem[]>> {
    const response = await client.get('/feature-toggles/catalogue');
    return response.data;
}

export const companyAdminApi = {
    getProfile,
    updateProfileSection,
    listLocations,
    getLocation,
    updateLocation,
    deleteLocation,
    listShifts,
    createShift,
    updateShift,
    deleteShift,
    listContacts,
    createContact,
    updateContact,
    deleteContact,
    listNoSeries,
    createNoSeries,
    updateNoSeries,
    deleteNoSeries,
    listIOTReasons,
    createIOTReason,
    updateIOTReason,
    deleteIOTReason,
    getControls,
    updateControls,
    getSettings,
    updateSettings,
    listUsers,
    createUser,
    getUser,
    updateUser,
    updateUserStatus,
    listAuditLogs,
    getAuditFilterOptions,
    getCompanyActivity,
    listRoles,
    createRole,
    updateRole,
    deleteRole,
    getModuleCatalogue,
    getMySubscription,
    getMyInvoices,
    getMyInvoiceDetail,
    getMyPayments,
    getMyCostBreakdown,
    getPermissionCatalogue,
    getReferenceRoles,
    assignRole,
    getFeatureToggleCatalogue,

    // ── Support Tickets ──
    createSupportTicket: (data: { subject: string; category?: string; priority?: string; message: string; metadata?: Record<string, unknown> }) =>
        client.post('/company/support/tickets', data).then(r => r.data),
    listSupportTickets: (params?: { status?: string; category?: string; search?: string; page?: number; limit?: number }) =>
        client.get('/company/support/tickets', { params }).then(r => r.data),
    getSupportTicket: (id: string) =>
        client.get(`/company/support/tickets/${id}`).then(r => r.data),
    sendSupportMessage: (id: string, data: { body: string }) =>
        client.post(`/company/support/tickets/${id}/messages`, data).then(r => r.data),
    closeSupportTicket: (id: string) =>
        client.patch(`/company/support/tickets/${id}/close`).then(r => r.data),

    // ── Module CRUD ──
    addLocationModules: (locationId: string, data: { moduleIds: string[] }) =>
        client.post(`/company/locations/${locationId}/modules`, data).then(r => r.data),
    removeLocationModule: (locationId: string, moduleId: string) =>
        client.delete(`/company/locations/${locationId}/modules/${moduleId}`).then(r => r.data),
};
