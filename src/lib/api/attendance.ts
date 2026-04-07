import { client } from './client';
import type { ApiResponse } from './auth';

// ── Types ──

export type PunchMode = 'FIRST_LAST' | 'EVERY_PAIR' | 'SHIFT_BASED';
export type DeductionType = 'NONE' | 'HALF_DAY_AFTER_LIMIT' | 'PERCENTAGE';
export type RoundingStrategy = 'NONE' | 'NEAREST_15' | 'NEAREST_30' | 'FLOOR_15' | 'CEIL_15';
export type PunchRounding = 'NONE' | 'NEAREST_5' | 'NEAREST_15';
export type RoundingDirection = 'NEAREST' | 'UP' | 'DOWN';
export type OTCalculationBasis = 'AFTER_SHIFT' | 'TOTAL_HOURS';
export type OvertimeRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID' | 'COMP_OFF_ACCRUED';
export type OTMultiplierSource = 'WEEKDAY' | 'WEEKEND' | 'HOLIDAY' | 'NIGHT_SHIFT';

export interface AttendanceRule {
    id?: string;
    // Time & Boundary
    dayBoundaryTime: string;
    // Grace & Tolerance
    gracePeriodMinutes: number;
    earlyExitToleranceMinutes: number;
    maxLateCheckInMinutes: number;
    // Day Thresholds
    halfDayThresholdHours: number;
    fullDayThresholdHours: number;
    // Late Tracking
    lateArrivalsAllowedPerMonth: number;
    // Deduction Rules
    lopAutoDeduct: boolean;
    lateDeductionType: DeductionType;
    lateDeductionValue: number | null;
    earlyExitDeductionType: DeductionType;
    earlyExitDeductionValue: number | null;
    // Punch Interpretation
    punchMode: PunchMode;
    // Auto-Processing
    autoMarkAbsentIfNoPunch: boolean;
    autoHalfDayEnabled: boolean;
    autoAbsentAfterDays: number;
    regularizationWindowDays: number;
    // Rounding
    workingHoursRounding: RoundingStrategy;
    punchTimeRounding: PunchRounding;
    punchTimeRoundingDirection: RoundingDirection;
    // Exception Handling
    ignoreLateOnLeaveDay: boolean;
    ignoreLateOnHoliday: boolean;
    ignoreLateOnWeekOff: boolean;
    // Capture
    selfieRequired: boolean;
    gpsRequired: boolean;
    missingPunchAlert: boolean;
}

export interface OvertimeRule {
    id?: string;
    // Eligibility
    eligibleTypeIds: string[] | null;
    // Calculation
    calculationBasis: OTCalculationBasis;
    thresholdMinutes: number;
    minimumOtMinutes: number;
    includeBreaksInOT: boolean;
    // Rate Multipliers
    weekdayMultiplier: number;
    weekendMultiplier: number | null;
    holidayMultiplier: number | null;
    nightShiftMultiplier: number | null;
    // Caps
    dailyCapHours: number | null;
    weeklyCapHours: number | null;
    monthlyCapHours: number | null;
    enforceCaps: boolean;
    maxContinuousOtHours: number | null;
    // Approval & Payroll
    approvalRequired: boolean;
    autoIncludePayroll: boolean;
    // Comp-Off
    compOffEnabled: boolean;
    compOffExpiryDays: number | null;
    // Rounding
    roundingStrategy: RoundingStrategy;
}

export interface OvertimeRequest {
    id: string;
    attendanceRecordId: string;
    companyId: string;
    employeeId: string;
    date: string;
    requestedHours: number;
    appliedMultiplier: number;
    multiplierSource: OTMultiplierSource;
    calculatedAmount: number | null;
    status: OvertimeRequestStatus;
    requestedBy: string;
    approvedBy: string | null;
    approvalNotes: string | null;
    approvedAt: string | null;
    compOffGranted: boolean;
    createdAt: string;
    updatedAt: string;
}

// ── Attendance Records ──

async function listRecords(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    dateFrom?: string;
    dateTo?: string;
    status?: string;
    departmentId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance', { params });
    return response.data;
}

async function getRecord(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/attendance/${id}`);
    return response.data;
}

async function createRecord(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/attendance', data);
    return response.data;
}

async function updateRecord(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/attendance/${id}`, data);
    return response.data;
}

// ── Attendance Summary / Dashboard ──

async function getSummary(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance/summary');
    return response.data;
}

// ── Attendance Rules ──

async function getRules(): Promise<ApiResponse<AttendanceRule>> {
    const response = await client.get('/hr/attendance/rules');
    return response.data;
}

async function updateRules(data: Partial<AttendanceRule>): Promise<ApiResponse<AttendanceRule>> {
    const response = await client.patch('/hr/attendance/rules', data);
    return response.data;
}

// ── Attendance Overrides ──

async function listOverrides(params?: {
    page?: number;
    limit?: number;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/attendance/overrides', { params });
    return response.data;
}

async function createOverride(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/attendance/overrides', data);
    return response.data;
}

async function updateOverride(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/attendance/overrides/${id}`, data);
    return response.data;
}

// ── Holiday Calendar ──

async function listHolidays(params?: {
    page?: number;
    limit?: number;
    year?: number;
    type?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/holidays', { params });
    return response.data;
}

async function createHoliday(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/holidays', data);
    return response.data;
}

async function updateHoliday(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/holidays/${id}`, data);
    return response.data;
}

async function deleteHoliday(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/holidays/${id}`);
    return response.data;
}

async function cloneHolidays(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/holidays/clone', data);
    return response.data;
}

// ── Rosters ──

async function listRosters(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/rosters', { params });
    return response.data;
}

async function createRoster(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/rosters', data);
    return response.data;
}

async function updateRoster(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/rosters/${id}`, data);
    return response.data;
}

async function deleteRoster(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/rosters/${id}`);
    return response.data;
}

// ── Overtime Rules ──

async function getOvertimeRules(): Promise<ApiResponse<OvertimeRule>> {
    const response = await client.get('/hr/overtime-rules');
    return response.data;
}

async function updateOvertimeRules(data: Partial<OvertimeRule>): Promise<ApiResponse<OvertimeRule>> {
    const response = await client.patch('/hr/overtime-rules', data);
    return response.data;
}

// ── Overtime Requests ──

async function getOvertimeRequests(params?: {
    page?: number;
    limit?: number;
    status?: string;
    employeeId?: string;
}): Promise<ApiResponse<OvertimeRequest[]>> {
    const response = await client.get('/hr/overtime-requests', { params });
    return response.data;
}

async function approveOvertimeRequest(id: string, data?: { approvalNotes?: string }): Promise<ApiResponse<OvertimeRequest>> {
    const response = await client.patch(`/hr/overtime-requests/${id}/approve`, data);
    return response.data;
}

async function rejectOvertimeRequest(id: string, data?: { approvalNotes?: string }): Promise<ApiResponse<OvertimeRequest>> {
    const response = await client.patch(`/hr/overtime-requests/${id}/reject`, data);
    return response.data;
}

export const attendanceApi = {
    // Records
    listRecords,
    getRecord,
    createRecord,
    updateRecord,
    // Summary
    getSummary,
    // Rules
    getRules,
    updateRules,
    // Overrides
    listOverrides,
    createOverride,
    updateOverride,
    // Holidays
    listHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday,
    cloneHolidays,
    // Rosters
    listRosters,
    createRoster,
    updateRoster,
    deleteRoster,
    // Overtime
    getOvertimeRules,
    updateOvertimeRules,
    // Overtime Requests
    getOvertimeRequests,
    approveOvertimeRequest,
    rejectOvertimeRequest,
};
