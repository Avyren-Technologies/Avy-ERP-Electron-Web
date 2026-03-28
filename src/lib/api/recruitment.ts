import { client } from './client';
import type { ApiResponse } from './auth';

// ── Requisitions ──

async function listRequisitions(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/requisitions', { params });
    return response.data;
}

async function createRequisition(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/requisitions', data);
    return response.data;
}

async function getRequisition(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/requisitions/${id}`);
    return response.data;
}

async function updateRequisition(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/requisitions/${id}`, data);
    return response.data;
}

async function deleteRequisition(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/requisitions/${id}`);
    return response.data;
}

// ── Candidates ──

async function listCandidates(params?: {
    page?: number;
    limit?: number;
    requisitionId?: string;
    stage?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/candidates', { params });
    return response.data;
}

async function createCandidate(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/candidates', data);
    return response.data;
}

async function getCandidate(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/candidates/${id}`);
    return response.data;
}

async function updateCandidate(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/candidates/${id}`, data);
    return response.data;
}

// ── Interviews ──

async function listInterviews(params?: {
    page?: number;
    limit?: number;
    candidateId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/interviews', { params });
    return response.data;
}

async function createInterview(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/interviews', data);
    return response.data;
}

async function getInterview(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/interviews/${id}`);
    return response.data;
}

async function updateInterview(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/interviews/${id}`, data);
    return response.data;
}

// ── Recruitment Dashboard ──

async function getRecruitmentDashboard(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/recruitment-dashboard');
    return response.data;
}

// ── Training Catalogue ──

async function listTrainingCatalogue(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-catalogues', { params });
    return response.data;
}

async function createTrainingCatalogue(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/training-catalogues', data);
    return response.data;
}

async function getTrainingCatalogue(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-catalogues/${id}`);
    return response.data;
}

async function updateTrainingCatalogue(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-catalogues/${id}`, data);
    return response.data;
}

async function deleteTrainingCatalogue(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/training-catalogues/${id}`);
    return response.data;
}

// ── Training Nominations ──

async function listTrainingNominations(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-nominations', { params });
    return response.data;
}

async function createTrainingNomination(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/training-nominations', data);
    return response.data;
}

async function updateTrainingNomination(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-nominations/${id}`, data);
    return response.data;
}

// ── Training Dashboard ──

async function getTrainingDashboard(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-dashboard');
    return response.data;
}

// ── Asset Categories ──

async function listAssetCategories(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/asset-categories', { params });
    return response.data;
}

async function createAssetCategory(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/asset-categories', data);
    return response.data;
}

async function getAssetCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/asset-categories/${id}`);
    return response.data;
}

async function updateAssetCategory(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/asset-categories/${id}`, data);
    return response.data;
}

async function deleteAssetCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/asset-categories/${id}`);
    return response.data;
}

// ── Assets ──

async function listAssets(params?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/assets', { params });
    return response.data;
}

async function createAsset(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/assets', data);
    return response.data;
}

async function getAsset(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/assets/${id}`);
    return response.data;
}

async function updateAsset(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/assets/${id}`, data);
    return response.data;
}

// ── Asset Assignments ──

async function listAssetAssignments(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/asset-assignments', { params });
    return response.data;
}

async function createAssetAssignment(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/asset-assignments', data);
    return response.data;
}

async function updateAssetAssignment(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/asset-assignments/${id}/return`, data);
    return response.data;
}

// ── Expense Claims ──

async function listExpenseClaims(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/expense-claims', { params });
    return response.data;
}

async function createExpenseClaim(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/expense-claims', data);
    return response.data;
}

async function getExpenseClaim(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/expense-claims/${id}`);
    return response.data;
}

async function updateExpenseClaim(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-claims/${id}`, data);
    return response.data;
}

async function approveExpenseClaim(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-claims/${id}/approve-reject`, { action: 'approve' });
    return response.data;
}

async function rejectExpenseClaim(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-claims/${id}/approve-reject`, { action: 'reject' });
    return response.data;
}

// ── Letter Templates ──

async function listLetterTemplates(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/letter-templates', { params });
    return response.data;
}

async function createLetterTemplate(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/letter-templates', data);
    return response.data;
}

async function getLetterTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/letter-templates/${id}`);
    return response.data;
}

async function updateLetterTemplate(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/letter-templates/${id}`, data);
    return response.data;
}

async function deleteLetterTemplate(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/letter-templates/${id}`);
    return response.data;
}

// ── Letters ──

async function listLetters(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    type?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/hr-letters', { params });
    return response.data;
}

async function createLetter(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/hr-letters', data);
    return response.data;
}

async function getLetter(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/hr-letters/${id}`);
    return response.data;
}

async function generateLetterPdf(id: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/hr-letters/${id}/generate-pdf`);
    return response.data;
}

// ── Grievance Categories ──

async function listGrievanceCategories(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/grievance-categories', { params });
    return response.data;
}

async function createGrievanceCategory(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/grievance-categories', data);
    return response.data;
}

async function getGrievanceCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/grievance-categories/${id}`);
    return response.data;
}

async function updateGrievanceCategory(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/grievance-categories/${id}`, data);
    return response.data;
}

async function deleteGrievanceCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/grievance-categories/${id}`);
    return response.data;
}

// ── Grievance Cases ──

async function listGrievanceCases(params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/grievance-cases', { params });
    return response.data;
}

async function createGrievanceCase(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/grievance-cases', data);
    return response.data;
}

async function getGrievanceCase(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/grievance-cases/${id}`);
    return response.data;
}

async function updateGrievanceCase(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/grievance-cases/${id}`, data);
    return response.data;
}

// ── Disciplinary Actions ──

async function listDisciplinaryActions(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    type?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/disciplinary-actions', { params });
    return response.data;
}

async function createDisciplinaryAction(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/disciplinary-actions', data);
    return response.data;
}

async function getDisciplinaryAction(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/disciplinary-actions/${id}`);
    return response.data;
}

async function updateDisciplinaryAction(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/disciplinary-actions/${id}`, data);
    return response.data;
}

// ── E-Sign ──

async function dispatchESign(letterId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/hr-letters/${letterId}/dispatch-esign`);
    return response.data;
}

async function getESignStatus(letterId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/hr-letters/${letterId}/esign-status`);
    return response.data;
}

async function listPendingESign(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/hr-letters/pending-esign');
    return response.data;
}

export const recruitmentApi = {
    // Requisitions
    listRequisitions,
    createRequisition,
    getRequisition,
    updateRequisition,
    deleteRequisition,
    // Candidates
    listCandidates,
    createCandidate,
    getCandidate,
    updateCandidate,
    // Interviews
    listInterviews,
    createInterview,
    getInterview,
    updateInterview,
    // Recruitment Dashboard
    getRecruitmentDashboard,
    // Training Catalogue
    listTrainingCatalogue,
    createTrainingCatalogue,
    getTrainingCatalogue,
    updateTrainingCatalogue,
    deleteTrainingCatalogue,
    // Training Nominations
    listTrainingNominations,
    createTrainingNomination,
    updateTrainingNomination,
    // Training Dashboard
    getTrainingDashboard,
    // Asset Categories
    listAssetCategories,
    createAssetCategory,
    getAssetCategory,
    updateAssetCategory,
    deleteAssetCategory,
    // Assets
    listAssets,
    createAsset,
    getAsset,
    updateAsset,
    // Asset Assignments
    listAssetAssignments,
    createAssetAssignment,
    updateAssetAssignment,
    // Expense Claims
    listExpenseClaims,
    createExpenseClaim,
    getExpenseClaim,
    updateExpenseClaim,
    approveExpenseClaim,
    rejectExpenseClaim,
    // Letter Templates
    listLetterTemplates,
    createLetterTemplate,
    getLetterTemplate,
    updateLetterTemplate,
    deleteLetterTemplate,
    // Letters
    listLetters,
    createLetter,
    getLetter,
    generateLetterPdf,
    // E-Sign
    dispatchESign,
    getESignStatus,
    listPendingESign,
    // Grievance Categories
    listGrievanceCategories,
    createGrievanceCategory,
    getGrievanceCategory,
    updateGrievanceCategory,
    deleteGrievanceCategory,
    // Grievance Cases
    listGrievanceCases,
    createGrievanceCase,
    getGrievanceCase,
    updateGrievanceCase,
    // Disciplinary Actions
    listDisciplinaryActions,
    createDisciplinaryAction,
    getDisciplinaryAction,
    updateDisciplinaryAction,
};
