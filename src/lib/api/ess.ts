import { client } from './client';
import type { ApiResponse } from './auth';

// ── ESS Config ──

async function getEssConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess-config');
    return response.data;
}

async function updateEssConfig(data: any): Promise<ApiResponse<any>> {
    const response = await client.patch('/hr/ess-config', data);
    return response.data;
}

// ── Approval Workflows ──

async function listApprovalWorkflows(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/approval-workflows', { params });
    return response.data;
}

async function createApprovalWorkflow(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/approval-workflows', data);
    return response.data;
}

async function getApprovalWorkflow(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/approval-workflows/${id}`);
    return response.data;
}

async function updateApprovalWorkflow(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/approval-workflows/${id}`, data);
    return response.data;
}

async function deleteApprovalWorkflow(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/approval-workflows/${id}`);
    return response.data;
}

// ── Approval Requests ──

async function listApprovalRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    entityType?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/approval-requests', { params });
    return response.data;
}

async function getApprovalRequest(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/approval-requests/${id}`);
    return response.data;
}

async function approveRequest(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/approval-requests/${id}/approve`, data);
    return response.data;
}

async function rejectRequest(id: string, data?: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/approval-requests/${id}/reject`, data);
    return response.data;
}

async function getPendingApprovals(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/approval-requests/pending');
    return response.data;
}

// ── Notification Templates ──

async function listNotificationTemplates(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/notification-templates', { params });
    return response.data;
}

async function createNotificationTemplate(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/notification-templates', data);
    return response.data;
}

async function updateNotificationTemplate(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/notification-templates/${id}`, data);
    return response.data;
}

async function deleteNotificationTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/notification-templates/${id}`);
    return response.data;
}

// ── Notification Rules ──

async function listNotificationRules(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/notification-rules', { params });
    return response.data;
}

async function createNotificationRule(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/notification-rules', data);
    return response.data;
}

async function updateNotificationRule(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/notification-rules/${id}`, data);
    return response.data;
}

async function deleteNotificationRule(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/notification-rules/${id}`);
    return response.data;
}

// ── IT Declarations ──

async function listITDeclarations(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    year?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/it-declarations', { params });
    return response.data;
}

async function createITDeclaration(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/it-declarations', data);
    return response.data;
}

async function getITDeclaration(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/it-declarations/${id}`);
    return response.data;
}

async function updateITDeclaration(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/it-declarations/${id}`, data);
    return response.data;
}

async function submitITDeclaration(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/it-declarations/${id}/submit`);
    return response.data;
}

async function verifyITDeclaration(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/it-declarations/${id}/verify`);
    return response.data;
}

async function lockITDeclaration(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/it-declarations/${id}/lock`);
    return response.data;
}

// ── ESS Employee Self-Service ──

async function getMyProfile(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess/my-profile');
    return response.data;
}

async function getMyPayslips(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess/my-payslips');
    return response.data;
}

async function getMyLeaveBalance(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess/my-leave-balance');
    return response.data;
}

async function getMyAttendance(params?: {
    page?: number;
    limit?: number;
    month?: number;
    year?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess/my-attendance', { params });
    return response.data;
}

async function getMyDeclarations(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/ess/my-declarations');
    return response.data;
}

async function applyLeave(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/ess/apply-leave', data);
    return response.data;
}

async function regularizeAttendance(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/ess/regularize-attendance', data);
    return response.data;
}

// ── MSS Manager Self-Service ──

async function getTeamMembers(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/mss/team-members', { params });
    return response.data;
}

async function getPendingMssApprovals(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/mss/pending-approvals');
    return response.data;
}

async function getTeamAttendance(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/mss/team-attendance');
    return response.data;
}

async function getTeamLeaveCalendar(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/mss/team-leave-calendar');
    return response.data;
}

export const essApi = {
    // ESS Config
    getEssConfig,
    updateEssConfig,
    // Approval Workflows
    listApprovalWorkflows,
    createApprovalWorkflow,
    getApprovalWorkflow,
    updateApprovalWorkflow,
    deleteApprovalWorkflow,
    // Approval Requests
    listApprovalRequests,
    getApprovalRequest,
    approveRequest,
    rejectRequest,
    getPendingApprovals,
    // Notification Templates
    listNotificationTemplates,
    createNotificationTemplate,
    updateNotificationTemplate,
    deleteNotificationTemplate,
    // Notification Rules
    listNotificationRules,
    createNotificationRule,
    updateNotificationRule,
    deleteNotificationRule,
    // IT Declarations
    listITDeclarations,
    createITDeclaration,
    getITDeclaration,
    updateITDeclaration,
    submitITDeclaration,
    verifyITDeclaration,
    lockITDeclaration,
    // ESS Self-Service
    getMyProfile,
    getMyPayslips,
    getMyLeaveBalance,
    getMyAttendance,
    getMyDeclarations,
    applyLeave,
    regularizeAttendance,
    // MSS Manager Self-Service
    getTeamMembers,
    getPendingMssApprovals,
    getTeamAttendance,
    getTeamLeaveCalendar,
};
