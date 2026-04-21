import { client } from './client';
import type { ApiResponse } from './auth';

// ── Dashboard Types ──

export interface DashboardAnnouncement {
    id: string;
    title: string;
    body: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdAt: string;
}

export interface DashboardGeofenceInfo {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radius: number;
    isDefault?: boolean;
}

export interface DashboardShiftInfo {
    shiftName: string;
    startTime: string;
    endTime: string;
    status: 'NOT_CHECKED_IN' | 'CHECKED_IN' | 'CHECKED_OUT' | 'NOT_LINKED';
    attendanceRecordId: string | null;
    punchIn: string | null;
    punchOut: string | null;
    elapsedSeconds: number;
    workedHours: number | string | null;
    locationName: string | null;
    geofences?: DashboardGeofenceInfo[];
    assignedGeofence?: DashboardGeofenceInfo | null;
    canStartNewShift?: boolean;
    completedShifts?: number;
}

export interface DashboardLeaveBalanceItem {
    leaveTypeName: string;
    allocated: number;
    used: number;
    remaining: number;
    color?: string;
}

export interface DashboardAttendanceDay {
    date: string;
    status: string;
    punchIn: string | null;
    punchOut: string | null;
    workedHours: number | string | null;
}

export interface DashboardTeamSummary {
    present: number;
    absent: number;
    onLeave: number;
    notCheckedIn: number;
    total: number;
}

export interface DashboardPendingApproval {
    id: string;
    type: string;
    employeeName: string;
    description: string;
    createdAt: string;
}

export interface DashboardHoliday {
    id: string;
    name: string;
    date: string;
    type: string;
}

export interface DashboardGoalsSummary {
    activeCount: number;
    avgCompletion: number;
}

export interface DashboardStats {
    leaveBalanceTotal: number;
    attendancePercentage: number;
    presentDays: number;
    workingDays: number;
    pendingApprovalsCount: number;
    goals: DashboardGoalsSummary;
}

export interface DashboardShiftCalendarDay {
    date: string;
    dayName: string;
    shiftName: string | null;
    shiftType: string | null;
    startTime: string | null;
    endTime: string | null;
    isHoliday: boolean;
    holidayName?: string;
    isWeekOff: boolean;
    isToday: boolean;
}

export interface DashboardWeeklyChartDay {
    date: string;
    dayName: string;
    hoursWorked: number;
    status: string;
    isHoliday: boolean;
    isWeekOff: boolean;
}

export interface DashboardLeaveDonutItem {
    category: string;
    totalEntitled: number;
    used: number;
    remaining: number;
    color: string;
}

export interface DashboardMonthlyTrendItem {
    month: string;
    year: number;
    workingDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendancePercentage: number;
}

export interface DashboardData {
    announcements: DashboardAnnouncement[];
    shift: DashboardShiftInfo | null;
    stats: DashboardStats;
    leaveBalances: DashboardLeaveBalanceItem[];
    recentAttendance: DashboardAttendanceDay[];
    teamSummary: DashboardTeamSummary | null;
    pendingApprovals: DashboardPendingApproval[];
    upcomingHolidays: DashboardHoliday[];
    shiftCalendar: DashboardShiftCalendarDay[] | null;
    weeklyChart: DashboardWeeklyChartDay[] | null;
    leaveDonut: DashboardLeaveDonutItem[] | null;
    monthlyTrend: DashboardMonthlyTrendItem[] | null;
    attendanceMode: string;
    companyShifts: Array<{ id: string; name: string; startTime: string; endTime: string; shiftType?: string }>;
}

// ── Types ──

export type LocationAccuracy = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ESSConfig {
    id?: string;
    // Payroll & Tax
    viewPayslips: boolean;
    downloadPayslips: boolean;
    downloadForm16: boolean;
    viewSalaryStructure: boolean;
    itDeclaration: boolean;
    // Leave
    leaveApplication: boolean;
    leaveBalanceView: boolean;
    leaveCancellation: boolean;
    // Attendance
    attendanceView: boolean;
    attendanceRegularization: boolean;
    viewShiftSchedule: boolean;
    shiftSwapRequest: boolean;
    wfhRequest: boolean;
    // Profile & Documents
    profileUpdate: boolean;
    documentUpload: boolean;
    employeeDirectory: boolean;
    viewOrgChart: boolean;
    // Financial
    reimbursementClaims: boolean;
    loanApplication: boolean;
    assetView: boolean;
    // Performance & Development
    performanceGoals: boolean;
    appraisalAccess: boolean;
    feedback360: boolean;
    trainingEnrollment: boolean;
    // Support & Communication
    helpDesk: boolean;
    grievanceSubmission: boolean;
    holidayCalendar: boolean;
    policyDocuments: boolean;
    announcementBoard: boolean;
    // Manager Self-Service (MSS)
    mssViewTeam: boolean;
    mssApproveLeave: boolean;
    mssApproveAttendance: boolean;
    mssViewTeamAttendance: boolean;
    // Mobile Behavior
    mobileOfflinePunch: boolean;
    mobileSyncRetryMinutes: number;
    mobileLocationAccuracy: LocationAccuracy;
}

// ── ESS Config ──

async function getEssConfig(): Promise<ApiResponse<ESSConfig>> {
    const response = await client.get('/hr/ess-config');
    return response.data;
}

async function updateEssConfig(data: Partial<ESSConfig>): Promise<ApiResponse<ESSConfig>> {
    const response = await client.patch('/hr/ess-config', data);
    return response.data;
}

// ── Approval Workflow Config ──

async function getApprovalWorkflowConfig(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/approval-workflow-config');
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

// ── ESS Dashboard ──

async function getDashboard(): Promise<ApiResponse<DashboardData>> {
    const response = await client.get('/hr/ess/dashboard');
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

// ── Overtime Types ──

export type OvertimeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'COMP_OFF_ACCRUED';
export type OTMultiplierSource = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'NIGHT_SHIFT';
export type OvertimeRequestSource = 'AUTO' | 'MANUAL';

export interface OvertimeRequestListItem {
    id: string;
    date: string;
    source: OvertimeRequestSource;
    requestedHours: number;
    appliedMultiplier: number;
    multiplierSource: OTMultiplierSource;
    calculatedAmount: number | null;
    status: OvertimeRequestStatus;
    reason: string | null;
    attachments: string[] | null;
    compOffGranted: boolean;
    approvalNotes: string | null;
    approvedAt: string | null;
    createdAt: string;
}

export interface OvertimeRequestDetail extends OvertimeRequestListItem {
    attendanceRecord: {
        date: string;
        punchIn: string | null;
        punchOut: string | null;
        workedHours: number | null;
        status: string;
        shiftName: string | null;
    } | null;
    approvedByName: string | null;
    requestedByName: string | null;
}

export interface OvertimeSummary {
    totalOtHours: number;
    pendingCount: number;
    approvedAmount: number;
    totalRequests: number;
    compOff: {
        balance: number;
        expiresAt: string | null;
        leaveTypeId: string | null;
    } | null;
}

export interface ClaimOvertimePayload {
    date: string;
    hours: number;
    reason: string;
    attachments?: string[];
}

export interface OvertimeListParams {
    status?: OvertimeRequestStatus;
    source?: OvertimeRequestSource;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
}

// ── Overtime API ──

export const essOvertimeApi = {
    getMyOvertimeRequests: async (params?: OvertimeListParams) => {
        const r = await client.get('/hr/ess/my-overtime-requests', { params });
        return r.data;
    },
    getMyOvertimeDetail: async (id: string) => {
        const r = await client.get(`/hr/ess/my-overtime-requests/${id}`);
        return r.data;
    },
    getMyOvertimeSummary: async (params?: { month?: number; year?: number }) => {
        const r = await client.get('/hr/ess/my-overtime-summary', { params });
        return r.data;
    },
    claimOvertime: async (data: ClaimOvertimePayload) => {
        const r = await client.post('/hr/ess/claim-overtime', data);
        return r.data;
    },
};

export const essApi = {
    // Dashboard
    getDashboard,
    // ESS Config
    getEssConfig,
    updateEssConfig,
    // Approval Workflow Config
    getApprovalWorkflowConfig,
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
    // ESS Self-Service — additional
    updateMyProfile: async (data: any) => { const r = await client.patch('/hr/ess/my-profile', data); return r.data; },
    getMyPayslipDetail: async (payslipId: string) => { const r = await client.get(`/hr/ess/my-payslips/${payslipId}/detail`); return r.data; },
    downloadPayslipPdf: async (payslipId: string) => { const r = await client.get(`/hr/ess/my-payslips/${payslipId}/pdf`, { responseType: 'blob' }); return r.data; },
    cancelLeave: async (id: string) => { const r = await client.patch(`/hr/leave-requests/${id}/cancel`); return r.data; },
    // Shift Swap
    getMyShiftSwaps: async () => { const r = await client.get('/hr/ess/my-shift-swaps'); return r.data; },
    createShiftSwap: async (data: any) => { const r = await client.post('/hr/ess/shift-swap', data); return r.data; },
    cancelShiftSwap: async (id: string) => { const r = await client.patch(`/hr/ess/shift-swap/${id}/cancel`); return r.data; },
    // WFH
    getMyWfhRequests: async () => { const r = await client.get('/hr/ess/my-wfh-requests'); return r.data; },
    createWfhRequest: async (data: any) => { const r = await client.post('/hr/ess/wfh-request', data); return r.data; },
    cancelWfhRequest: async (id: string) => { const r = await client.patch(`/hr/ess/wfh-request/${id}/cancel`); return r.data; },
    // Documents
    getMyDocuments: async () => { const r = await client.get('/hr/ess/my-documents'); return r.data; },
    uploadMyDocument: async (data: any) => { const r = await client.post('/hr/ess/my-documents', data); return r.data; },
    deleteMyDocument: async (id: string) => { const r = await client.delete(`/hr/ess/my-documents/${id}`); return r.data; },
    // Policy Documents
    getPolicyDocuments: async () => { const r = await client.get('/hr/ess/policy-documents'); return r.data; },
    createPolicyDocument: async (data: any) => { const r = await client.post('/hr/policy-documents', data); return r.data; },
    deletePolicyDocument: async (id: string) => { const r = await client.delete(`/hr/policy-documents/${id}`); return r.data; },
    // Holidays, Expense Claims, Loans (ESS)
    getMyHolidays: async (year?: number) => { const r = await client.get('/hr/ess/my-holidays', { params: year ? { year } : {} }); return r.data; },
    getMyExpenseClaims: async () => { const r = await client.get('/hr/ess/my-expense-claims'); return r.data; },
    getMyExpenseClaim: async (id: string) => { const r = await client.get(`/hr/ess/my-expense-claims/${id}`); return r.data; },
    getMyExpenseSummary: async () => { const r = await client.get('/hr/ess/my-expense-claims/summary'); return r.data; },
    getExpenseCategories: async () => { const r = await client.get('/hr/ess/expense-categories'); return r.data; },
    createMyExpenseClaim: async (data: any) => { const r = await client.post('/hr/ess/my-expense-claims', data); return r.data; },
    updateMyExpenseClaim: async (id: string, data: any) => { const r = await client.patch(`/hr/ess/my-expense-claims/${id}`, data); return r.data; },
    submitMyExpenseClaim: async (id: string) => { const r = await client.patch(`/hr/ess/my-expense-claims/${id}/submit`); return r.data; },
    cancelMyExpenseClaim: async (id: string) => { const r = await client.patch(`/hr/ess/my-expense-claims/${id}/cancel`); return r.data; },
    getMyLoans: async () => { const r = await client.get('/hr/ess/my-loans'); return r.data; },
    getAvailableLoanPolicies: async () => { const r = await client.get('/hr/ess/loan-policies'); return r.data; },
    applyForLoan: async (data: any) => { const r = await client.post('/hr/ess/apply-loan', data); return r.data; },
    // My Appraisal (ESS)
    getMyAppraisals: async () => { const r = await client.get('/hr/appraisal-entries'); return r.data; },
    getMyAppraisalEntry: async (id: string) => { const r = await client.get(`/hr/appraisal-entries/${id}`); return r.data; },
    submitSelfReview: async (id: string, data: any) => { const r = await client.patch(`/hr/appraisal-entries/${id}/self-review`, data); return r.data; },
    // MSS Manager Self-Service
    getTeamMembers,
    getPendingMssApprovals,
    getTeamAttendance,
    getTeamLeaveCalendar,
};
