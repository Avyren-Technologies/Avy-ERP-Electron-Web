import { client } from './client';
import type { ApiResponse } from './auth';

// ── Types ──

export interface Department {
    id: string;
    name: string;
    code?: string;
    /** Default cost centre code from master (links to Cost Centre.code) */
    costCentreCode?: string | null;
    parentId?: string;
    parent?: Department;
    children?: Department[];
    headId?: string;
    headName?: string;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDepartmentPayload {
    name: string;
    code?: string;
    parentId?: string;
    headId?: string;
}

export interface Designation {
    id: string;
    name: string;
    code?: string;
    departmentId?: string | null;
    gradeId?: string | null;
    probationDays?: number | null;
    level?: string;
    description?: string;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDesignationPayload {
    name: string;
    code?: string;
    level?: string;
    description?: string;
}

export interface Grade {
    id: string;
    name: string;
    code?: string;
    probationMonths?: number | null;
    noticeDays?: number | null;
    rank?: number;
    minSalary?: number;
    maxSalary?: number;
    description?: string;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateGradePayload {
    name: string;
    code?: string;
    rank?: number;
    minSalary?: number;
    maxSalary?: number;
    description?: string;
}

export interface EmployeeType {
    id: string;
    name: string;
    code?: string;
    description?: string;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEmployeeTypePayload {
    name: string;
    code?: string;
    description?: string;
}

export interface CostCentre {
    id: string;
    name: string;
    code?: string;
    departmentId?: string | null;
    description?: string;
    budget?: number;
    isActive?: boolean;
    employeeCount?: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateCostCentrePayload {
    name: string;
    code?: string;
    description?: string;
    budget?: number;
}

export type EmployeeStatus = 'ACTIVE' | 'PROBATION' | 'CONFIRMED' | 'ON_NOTICE' | 'SUSPENDED' | 'EXITED';
export type Gender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';
export type MaritalStatus = 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED';

export interface Employee {
    id: string;
    employeeId: string;
    firstName: string;
    lastName: string;
    fullName?: string;
    email: string;
    phone?: string;
    gender?: Gender;
    dateOfBirth?: string;
    maritalStatus?: MaritalStatus;
    status: EmployeeStatus;
    departmentId?: string;
    departmentName?: string;
    designationId?: string;
    designationName?: string;
    /** Tenant RBAC role display name (from User → TenantUser → Role); list API only. */
    rbacRoleName?: string | null;
    gradeId?: string;
    gradeName?: string;
    employeeTypeId?: string;
    employeeTypeName?: string;
    costCentreId?: string;
    costCentreName?: string;
    locationId?: string;
    locationName?: string;
    reportingManagerId?: string;
    reportingManagerName?: string;
    joiningDate?: string;
    confirmationDate?: string;
    exitDate?: string;
    workType?: string;
    paymentMode?: string;
    bankName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    pan?: string;
    aadhaar?: string;
    uan?: string;
    esiNumber?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateEmployeePayload {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    gender?: Gender;
    dateOfBirth?: string;
    maritalStatus?: MaritalStatus;
    departmentId?: string;
    designationId?: string;
    gradeId?: string;
    employeeTypeId?: string;
    costCentreId?: string;
    locationId?: string;
    reportingManagerId?: string;
    joiningDate?: string;
    workType?: string;
}

export interface EmployeeNominee {
    id: string;
    name: string;
    relationship: string;
    dateOfBirth?: string;
    percentage?: number;
    phone?: string;
    address?: string;
    createdAt?: string;
}

export interface CreateNomineePayload {
    name: string;
    relationship: string;
    dateOfBirth?: string;
    percentage?: number;
    phone?: string;
    address?: string;
}

export interface EmployeeEducation {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    createdAt?: string;
}

export interface CreateEducationPayload {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
}

export interface PreviousEmployment {
    id: string;
    companyName: string;
    designation?: string;
    startDate?: string;
    endDate?: string;
    reasonForLeaving?: string;
    lastSalary?: number;
    createdAt?: string;
}

export interface CreatePreviousEmploymentPayload {
    companyName: string;
    designation?: string;
    startDate?: string;
    endDate?: string;
    reasonForLeaving?: string;
    lastSalary?: number;
}

export interface EmployeeDocument {
    id: string;
    name: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: string;
    createdAt?: string;
}

export interface CreateDocumentPayload {
    name: string;
    type?: string;
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
}

export type TimelineEventType = 'CREATED' | 'STATUS_CHANGE' | 'PROMOTION' | 'TRANSFER' | 'NOTE' | 'OTHER';

export interface TimelineEntry {
    id: string;
    eventType: TimelineEventType;
    title: string;
    description?: string;
    metadata?: Record<string, unknown>;
    createdAt: string;
    createdBy?: string;
}

// ── Departments ──

async function listDepartments(): Promise<ApiResponse<Department[]>> {
    const response = await client.get('/hr/departments', { params: { limit: 500, page: 1 } });
    return response.data;
}

async function createDepartment(data: CreateDepartmentPayload): Promise<ApiResponse<Department>> {
    const response = await client.post('/hr/departments', data);
    return response.data;
}

async function getDepartment(id: string): Promise<ApiResponse<Department>> {
    const response = await client.get(`/hr/departments/${id}`);
    return response.data;
}

async function updateDepartment(id: string, data: Partial<CreateDepartmentPayload>): Promise<ApiResponse<Department>> {
    const response = await client.patch(`/hr/departments/${id}`, data);
    return response.data;
}

async function deleteDepartment(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/departments/${id}`);
    return response.data;
}

// ── Designations ──

async function listDesignations(): Promise<ApiResponse<Designation[]>> {
    const response = await client.get('/hr/designations', { params: { limit: 500, page: 1 } });
    return response.data;
}

async function createDesignation(data: CreateDesignationPayload): Promise<ApiResponse<Designation>> {
    const response = await client.post('/hr/designations', data);
    return response.data;
}

async function getDesignation(id: string): Promise<ApiResponse<Designation>> {
    const response = await client.get(`/hr/designations/${id}`);
    return response.data;
}

async function updateDesignation(id: string, data: Partial<CreateDesignationPayload>): Promise<ApiResponse<Designation>> {
    const response = await client.patch(`/hr/designations/${id}`, data);
    return response.data;
}

async function deleteDesignation(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/designations/${id}`);
    return response.data;
}

// ── Grades ──

async function listGrades(): Promise<ApiResponse<Grade[]>> {
    const response = await client.get('/hr/grades', { params: { limit: 500, page: 1 } });
    return response.data;
}

async function createGrade(data: CreateGradePayload): Promise<ApiResponse<Grade>> {
    const response = await client.post('/hr/grades', data);
    return response.data;
}

async function getGrade(id: string): Promise<ApiResponse<Grade>> {
    const response = await client.get(`/hr/grades/${id}`);
    return response.data;
}

async function updateGrade(id: string, data: Partial<CreateGradePayload>): Promise<ApiResponse<Grade>> {
    const response = await client.patch(`/hr/grades/${id}`, data);
    return response.data;
}

async function deleteGrade(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/grades/${id}`);
    return response.data;
}

// ── Employee Types ──

async function listEmployeeTypes(): Promise<ApiResponse<EmployeeType[]>> {
    const response = await client.get('/hr/employee-types');
    return response.data;
}

async function createEmployeeType(data: CreateEmployeeTypePayload): Promise<ApiResponse<EmployeeType>> {
    const response = await client.post('/hr/employee-types', data);
    return response.data;
}

async function getEmployeeType(id: string): Promise<ApiResponse<EmployeeType>> {
    const response = await client.get(`/hr/employee-types/${id}`);
    return response.data;
}

async function updateEmployeeType(id: string, data: Partial<CreateEmployeeTypePayload>): Promise<ApiResponse<EmployeeType>> {
    const response = await client.patch(`/hr/employee-types/${id}`, data);
    return response.data;
}

async function deleteEmployeeType(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employee-types/${id}`);
    return response.data;
}

// ── Cost Centres ──

async function listCostCentres(): Promise<ApiResponse<CostCentre[]>> {
    const response = await client.get('/hr/cost-centres', { params: { limit: 500, page: 1 } });
    return response.data;
}

async function createCostCentre(data: CreateCostCentrePayload): Promise<ApiResponse<CostCentre>> {
    const response = await client.post('/hr/cost-centres', data);
    return response.data;
}

async function getCostCentre(id: string): Promise<ApiResponse<CostCentre>> {
    const response = await client.get(`/hr/cost-centres/${id}`);
    return response.data;
}

async function updateCostCentre(id: string, data: Partial<CreateCostCentrePayload>): Promise<ApiResponse<CostCentre>> {
    const response = await client.patch(`/hr/cost-centres/${id}`, data);
    return response.data;
}

async function deleteCostCentre(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/cost-centres/${id}`);
    return response.data;
}

// ── Employees ──

async function listEmployees(params?: {
    page?: number;
    limit?: number;
    search?: string;
    department?: string;
    designation?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: string;
}): Promise<ApiResponse<Employee[]>> {
    const response = await client.get('/hr/employees', { params });
    return response.data;
}

async function createEmployee(data: CreateEmployeePayload): Promise<ApiResponse<Employee>> {
    const response = await client.post('/hr/employees', data);
    return response.data;
}

async function getEmployee(id: string): Promise<ApiResponse<Employee>> {
    const response = await client.get(`/hr/employees/${id}`);
    return response.data;
}

async function updateEmployee(id: string, data: Partial<CreateEmployeePayload>): Promise<ApiResponse<Employee>> {
    const response = await client.patch(`/hr/employees/${id}`, data);
    return response.data;
}

async function deleteEmployee(id: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employees/${id}`);
    return response.data;
}

async function updateEmployeeStatus(id: string, data: { status: EmployeeStatus; lastWorkingDate?: string; exitReason?: string }): Promise<ApiResponse<Employee>> {
    const response = await client.patch(`/hr/employees/${id}/status`, data);
    return response.data;
}

// ── Employee Sub-Resources ──

// Nominees
async function listNominees(employeeId: string): Promise<ApiResponse<EmployeeNominee[]>> {
    const response = await client.get(`/hr/employees/${employeeId}/nominees`);
    return response.data;
}

async function createNominee(employeeId: string, data: CreateNomineePayload): Promise<ApiResponse<EmployeeNominee>> {
    const response = await client.post(`/hr/employees/${employeeId}/nominees`, data);
    return response.data;
}

async function updateNominee(employeeId: string, nomineeId: string, data: Partial<CreateNomineePayload>): Promise<ApiResponse<EmployeeNominee>> {
    const response = await client.patch(`/hr/employees/${employeeId}/nominees/${nomineeId}`, data);
    return response.data;
}

async function deleteNominee(employeeId: string, nomineeId: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employees/${employeeId}/nominees/${nomineeId}`);
    return response.data;
}

// Education
async function listEducation(employeeId: string): Promise<ApiResponse<EmployeeEducation[]>> {
    const response = await client.get(`/hr/employees/${employeeId}/education`);
    return response.data;
}

async function createEducation(employeeId: string, data: CreateEducationPayload): Promise<ApiResponse<EmployeeEducation>> {
    const response = await client.post(`/hr/employees/${employeeId}/education`, data);
    return response.data;
}

async function updateEducation(employeeId: string, educationId: string, data: Partial<CreateEducationPayload>): Promise<ApiResponse<EmployeeEducation>> {
    const response = await client.patch(`/hr/employees/${employeeId}/education/${educationId}`, data);
    return response.data;
}

async function deleteEducation(employeeId: string, educationId: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employees/${employeeId}/education/${educationId}`);
    return response.data;
}

// Previous Employment
async function listPreviousEmployment(employeeId: string): Promise<ApiResponse<PreviousEmployment[]>> {
    const response = await client.get(`/hr/employees/${employeeId}/previous-employment`);
    return response.data;
}

async function createPreviousEmployment(employeeId: string, data: CreatePreviousEmploymentPayload): Promise<ApiResponse<PreviousEmployment>> {
    const response = await client.post(`/hr/employees/${employeeId}/previous-employment`, data);
    return response.data;
}

async function updatePreviousEmployment(employeeId: string, prevEmpId: string, data: Partial<CreatePreviousEmploymentPayload>): Promise<ApiResponse<PreviousEmployment>> {
    const response = await client.patch(`/hr/employees/${employeeId}/previous-employment/${prevEmpId}`, data);
    return response.data;
}

async function deletePreviousEmployment(employeeId: string, prevEmpId: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employees/${employeeId}/previous-employment/${prevEmpId}`);
    return response.data;
}

// Documents
async function listDocuments(employeeId: string): Promise<ApiResponse<EmployeeDocument[]>> {
    const response = await client.get(`/hr/employees/${employeeId}/documents`);
    return response.data;
}

async function createDocument(employeeId: string, data: CreateDocumentPayload): Promise<ApiResponse<EmployeeDocument>> {
    const response = await client.post(`/hr/employees/${employeeId}/documents`, data);
    return response.data;
}

async function updateDocument(employeeId: string, documentId: string, data: Partial<CreateDocumentPayload>): Promise<ApiResponse<EmployeeDocument>> {
    const response = await client.patch(`/hr/employees/${employeeId}/documents/${documentId}`, data);
    return response.data;
}

async function deleteDocument(employeeId: string, documentId: string): Promise<ApiResponse<void>> {
    const response = await client.delete(`/hr/employees/${employeeId}/documents/${documentId}`);
    return response.data;
}

// Timeline
async function listTimeline(employeeId: string): Promise<ApiResponse<TimelineEntry[]>> {
    const response = await client.get(`/hr/employees/${employeeId}/timeline`);
    return response.data;
}

// ── Probation ──

async function listProbationDue(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/employees/probation-due');
    return response.data;
}

async function submitProbationReview(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/employees/${id}/probation-review`, data);
    return response.data;
}

// ── Org Chart ──

async function getOrgChart(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/employees/org-chart');
    return response.data;
}

// ── Bulk Import ──
/** Web client default axios timeout is 10s; bulk validate/import can take much longer. */
const BULK_HR_REQUEST_TIMEOUT_MS = 600_000; // 10 minutes

async function downloadBulkTemplate(): Promise<Blob> {
    const response = await client.get('/hr/employees/bulk/template', {
        responseType: 'blob',
        timeout: BULK_HR_REQUEST_TIMEOUT_MS,
    });
    return response.data;
}

async function bulkValidate(file: File, defaultPassword: string) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('defaultPassword', defaultPassword);
    const response = await client.post('/hr/employees/bulk/validate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: BULK_HR_REQUEST_TIMEOUT_MS,
    });
    return response.data;
}

async function bulkImport(rows: Record<string, unknown>[], defaultPassword: string) {
    const response = await client.post(
        '/hr/employees/bulk/import',
        { rows, defaultPassword },
        { timeout: BULK_HR_REQUEST_TIMEOUT_MS },
    );
    return response.data;
}

export const hrApi = {
    // Departments
    listDepartments,
    createDepartment,
    getDepartment,
    updateDepartment,
    deleteDepartment,
    // Designations
    listDesignations,
    createDesignation,
    getDesignation,
    updateDesignation,
    deleteDesignation,
    // Grades
    listGrades,
    createGrade,
    getGrade,
    updateGrade,
    deleteGrade,
    // Employee Types
    listEmployeeTypes,
    createEmployeeType,
    getEmployeeType,
    updateEmployeeType,
    deleteEmployeeType,
    // Cost Centres
    listCostCentres,
    createCostCentre,
    getCostCentre,
    updateCostCentre,
    deleteCostCentre,
    // Employees
    listEmployees,
    createEmployee,
    getEmployee,
    updateEmployee,
    deleteEmployee,
    updateEmployeeStatus,
    // Nominees
    listNominees,
    createNominee,
    updateNominee,
    deleteNominee,
    // Education
    listEducation,
    createEducation,
    updateEducation,
    deleteEducation,
    // Previous Employment
    listPreviousEmployment,
    createPreviousEmployment,
    updatePreviousEmployment,
    deletePreviousEmployment,
    // Documents
    listDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    // Timeline
    listTimeline,
    // Probation
    listProbationDue,
    submitProbationReview,
    // Org Chart
    getOrgChart,
    // Bulk Import
    downloadBulkTemplate,
    bulkValidate,
    bulkImport,
};
