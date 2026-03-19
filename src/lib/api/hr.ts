import { client } from './client';
import type { ApiResponse } from './auth';

// ── Departments ──

async function listDepartments(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/departments');
    return response.data;
}

async function createDepartment(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/departments', data);
    return response.data;
}

async function getDepartment(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/departments/${id}`);
    return response.data;
}

async function updateDepartment(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/departments/${id}`, data);
    return response.data;
}

async function deleteDepartment(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/departments/${id}`);
    return response.data;
}

// ── Designations ──

async function listDesignations(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/designations');
    return response.data;
}

async function createDesignation(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/designations', data);
    return response.data;
}

async function getDesignation(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/designations/${id}`);
    return response.data;
}

async function updateDesignation(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/designations/${id}`, data);
    return response.data;
}

async function deleteDesignation(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/designations/${id}`);
    return response.data;
}

// ── Grades ──

async function listGrades(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/grades');
    return response.data;
}

async function createGrade(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/grades', data);
    return response.data;
}

async function getGrade(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/grades/${id}`);
    return response.data;
}

async function updateGrade(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/grades/${id}`, data);
    return response.data;
}

async function deleteGrade(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/grades/${id}`);
    return response.data;
}

// ── Employee Types ──

async function listEmployeeTypes(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/employee-types');
    return response.data;
}

async function createEmployeeType(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/employee-types', data);
    return response.data;
}

async function getEmployeeType(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employee-types/${id}`);
    return response.data;
}

async function updateEmployeeType(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employee-types/${id}`, data);
    return response.data;
}

async function deleteEmployeeType(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employee-types/${id}`);
    return response.data;
}

// ── Cost Centres ──

async function listCostCentres(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/cost-centres');
    return response.data;
}

async function createCostCentre(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/cost-centres', data);
    return response.data;
}

async function getCostCentre(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/cost-centres/${id}`);
    return response.data;
}

async function updateCostCentre(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/cost-centres/${id}`, data);
    return response.data;
}

async function deleteCostCentre(id: string): Promise<ApiResponse<any>> {
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
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/employees', { params });
    return response.data;
}

async function createEmployee(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/employees', data);
    return response.data;
}

async function getEmployee(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${id}`);
    return response.data;
}

async function updateEmployee(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${id}`, data);
    return response.data;
}

async function deleteEmployee(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employees/${id}`);
    return response.data;
}

async function updateEmployeeStatus(id: string, status: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${id}/status`, { status });
    return response.data;
}

// ── Employee Sub-Resources ──

// Nominees
async function listNominees(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${employeeId}/nominees`);
    return response.data;
}

async function createNominee(employeeId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/employees/${employeeId}/nominees`, data);
    return response.data;
}

async function updateNominee(employeeId: string, nomineeId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${employeeId}/nominees/${nomineeId}`, data);
    return response.data;
}

async function deleteNominee(employeeId: string, nomineeId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employees/${employeeId}/nominees/${nomineeId}`);
    return response.data;
}

// Education
async function listEducation(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${employeeId}/education`);
    return response.data;
}

async function createEducation(employeeId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/employees/${employeeId}/education`, data);
    return response.data;
}

async function updateEducation(employeeId: string, educationId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${employeeId}/education/${educationId}`, data);
    return response.data;
}

async function deleteEducation(employeeId: string, educationId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employees/${employeeId}/education/${educationId}`);
    return response.data;
}

// Previous Employment
async function listPreviousEmployment(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${employeeId}/previous-employment`);
    return response.data;
}

async function createPreviousEmployment(employeeId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/employees/${employeeId}/previous-employment`, data);
    return response.data;
}

async function updatePreviousEmployment(employeeId: string, prevEmpId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${employeeId}/previous-employment/${prevEmpId}`, data);
    return response.data;
}

async function deletePreviousEmployment(employeeId: string, prevEmpId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employees/${employeeId}/previous-employment/${prevEmpId}`);
    return response.data;
}

// Documents
async function listDocuments(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${employeeId}/documents`);
    return response.data;
}

async function createDocument(employeeId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/employees/${employeeId}/documents`, data);
    return response.data;
}

async function updateDocument(employeeId: string, documentId: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/employees/${employeeId}/documents/${documentId}`, data);
    return response.data;
}

async function deleteDocument(employeeId: string, documentId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/employees/${employeeId}/documents/${documentId}`);
    return response.data;
}

// Timeline
async function listTimeline(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/employees/${employeeId}/timeline`);
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
};
