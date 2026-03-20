import { client } from './client';
import type { ApiResponse } from './auth';

// ── Appraisal Cycles ──

async function listAppraisalCycles(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/appraisal-cycles', { params });
    return response.data;
}

async function createAppraisalCycle(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/appraisal-cycles', data);
    return response.data;
}

async function getAppraisalCycle(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/appraisal-cycles/${id}`);
    return response.data;
}

async function updateAppraisalCycle(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-cycles/${id}`, data);
    return response.data;
}

async function deleteAppraisalCycle(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/appraisal-cycles/${id}`);
    return response.data;
}

async function activateAppraisalCycle(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-cycles/${id}/activate`);
    return response.data;
}

async function publishAppraisalCycle(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-cycles/${id}/publish`);
    return response.data;
}

async function closeAppraisalCycle(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-cycles/${id}/close`);
    return response.data;
}

// ── Goals (KRA/OKR) ──

async function listGoals(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/goals', { params });
    return response.data;
}

async function createGoal(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/goals', data);
    return response.data;
}

async function getGoal(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/goals/${id}`);
    return response.data;
}

async function updateGoal(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/goals/${id}`, data);
    return response.data;
}

async function deleteGoal(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/goals/${id}`);
    return response.data;
}

async function getDepartmentGoals(departmentId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/goals/cascade/${departmentId}`);
    return response.data;
}

// ── Appraisal Entries ──

async function listAppraisalEntries(params?: {
    page?: number;
    limit?: number;
    cycleId?: string;
    employeeId?: string;
    status?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/appraisal-entries', { params });
    return response.data;
}

async function getAppraisalEntry(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/appraisal-entries/${id}`);
    return response.data;
}

async function updateAppraisalEntry(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-entries/${id}`, data);
    return response.data;
}

async function submitSelfReview(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-entries/${id}/self-review`, data);
    return response.data;
}

async function submitManagerReview(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-entries/${id}/manager-review`, data);
    return response.data;
}

async function publishAppraisalEntry(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/appraisal-entries/${id}/publish`);
    return response.data;
}

async function getCalibrationData(cycleId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/appraisal-entries/calibration/${cycleId}`);
    return response.data;
}

// ── 360 Feedback ──

async function listFeedback360(params?: {
    page?: number;
    limit?: number;
    cycleId?: string;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/feedback-360', { params });
    return response.data;
}

async function createFeedback360(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/feedback-360', data);
    return response.data;
}

async function getFeedback360(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/feedback-360/${id}`);
    return response.data;
}

async function updateFeedback360(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/feedback-360/${id}`, data);
    return response.data;
}

async function getFeedback360Report(employeeId: string, cycleId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/feedback-360/report/${employeeId}/${cycleId}`);
    return response.data;
}

// ── Skills ──

async function listSkills(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/skills', { params });
    return response.data;
}

async function createSkill(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/skills', data);
    return response.data;
}

async function getSkill(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/skills/${id}`);
    return response.data;
}

async function updateSkill(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/skills/${id}`, data);
    return response.data;
}

async function deleteSkill(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/skills/${id}`);
    return response.data;
}

// ── Skill Mappings ──

async function listSkillMappings(params?: {
    page?: number;
    limit?: number;
    employeeId?: string;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/skill-mappings', { params });
    return response.data;
}

async function createSkillMapping(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/skill-mappings', data);
    return response.data;
}

async function updateSkillMapping(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/skill-mappings/${id}`, data);
    return response.data;
}

async function deleteSkillMapping(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/skill-mappings/${id}`);
    return response.data;
}

async function getSkillGapAnalysis(employeeId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/skill-mappings/gap-analysis/${employeeId}`);
    return response.data;
}

// ── Succession Planning ──

async function listSuccessionPlans(params?: {
    page?: number;
    limit?: number;
}): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/succession-plans', { params });
    return response.data;
}

async function createSuccessionPlan(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/succession-plans', data);
    return response.data;
}

async function getSuccessionPlan(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/succession-plans/${id}`);
    return response.data;
}

async function updateSuccessionPlan(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/succession-plans/${id}`, data);
    return response.data;
}

async function deleteSuccessionPlan(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/succession-plans/${id}`);
    return response.data;
}

async function getNineBoxData(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/succession-plans/nine-box');
    return response.data;
}

async function getBenchStrength(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/succession-plans/bench-strength');
    return response.data;
}

// ── Performance Dashboard ──

async function getPerformanceDashboard(): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/performance/dashboard');
    return response.data;
}

export const performanceApi = {
    // Appraisal Cycles
    listAppraisalCycles,
    createAppraisalCycle,
    getAppraisalCycle,
    updateAppraisalCycle,
    deleteAppraisalCycle,
    activateAppraisalCycle,
    publishAppraisalCycle,
    closeAppraisalCycle,
    // Goals
    listGoals,
    createGoal,
    getGoal,
    updateGoal,
    deleteGoal,
    getDepartmentGoals,
    // Appraisal Entries
    listAppraisalEntries,
    getAppraisalEntry,
    updateAppraisalEntry,
    submitSelfReview,
    submitManagerReview,
    publishAppraisalEntry,
    getCalibrationData,
    // 360 Feedback
    listFeedback360,
    createFeedback360,
    getFeedback360,
    updateFeedback360,
    getFeedback360Report,
    // Skills
    listSkills,
    createSkill,
    getSkill,
    updateSkill,
    deleteSkill,
    // Skill Mappings
    listSkillMappings,
    createSkillMapping,
    updateSkillMapping,
    deleteSkillMapping,
    getSkillGapAnalysis,
    // Succession
    listSuccessionPlans,
    createSuccessionPlan,
    getSuccessionPlan,
    updateSuccessionPlan,
    deleteSuccessionPlan,
    getNineBoxData,
    getBenchStrength,
    // Dashboard
    getPerformanceDashboard,
};
