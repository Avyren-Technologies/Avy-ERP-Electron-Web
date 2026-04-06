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

async function completeInterview(id: string, data: { feedbackRating: number; feedbackNotes?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/interviews/${id}/complete`, data);
    return response.data;
}

async function cancelInterview(id: string): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/interviews/${id}/cancel`);
    return response.data;
}

async function deleteCandidate(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/candidates/${id}`);
    return response.data;
}

async function advanceCandidateStage(id: string, data: { stage: string; reason?: string; notes?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/candidates/${id}/stage`, data);
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

// ── Training Sessions ──

async function listTrainingSessions(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-sessions', { params });
    return response.data;
}

async function createTrainingSession(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/training-sessions', data);
    return response.data;
}

async function getTrainingSession(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-sessions/${id}`);
    return response.data;
}

async function updateTrainingSession(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-sessions/${id}`, data);
    return response.data;
}

async function updateTrainingSessionStatus(id: string, data: { status: string; cancelledReason?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-sessions/${id}/status`, data);
    return response.data;
}

async function deleteTrainingSession(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/training-sessions/${id}`);
    return response.data;
}

// ── Training Attendance ──

async function listSessionAttendance(sessionId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-sessions/${sessionId}/attendance`);
    return response.data;
}

async function registerSessionAttendees(sessionId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/training-sessions/${sessionId}/attendance`, data);
    return response.data;
}

async function markAttendance(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-attendance/${id}`, data);
    return response.data;
}

async function bulkMarkAttendance(sessionId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-sessions/${sessionId}/attendance/bulk`, data);
    return response.data;
}

// ── Training Evaluations ──

async function submitTrainingEvaluation(nominationId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/training-nominations/${nominationId}/evaluation`, data);
    return response.data;
}

async function getTrainingEvaluation(nominationId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-nominations/${nominationId}/evaluation`);
    return response.data;
}

async function listSessionEvaluations(sessionId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-sessions/${sessionId}/evaluations`);
    return response.data;
}

async function getTrainingEvaluationSummary(trainingId: string): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-evaluations/summary', { params: { trainingId } });
    return response.data;
}

async function submitEssFeedback(nominationId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/ess/training/${nominationId}/feedback`, data);
    return response.data;
}

// ── Expiring Certificates ──

async function getExpiringCertificates(days: number = 30): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-certificates/expiring', { params: { days } });
    return response.data;
}

// ── Trainers ──

async function listTrainers(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/trainers', { params });
    return response.data;
}

async function createTrainer(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/trainers', data);
    return response.data;
}

async function getTrainer(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/trainers/${id}`);
    return response.data;
}

async function updateTrainer(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/trainers/${id}`, data);
    return response.data;
}

async function deleteTrainer(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/trainers/${id}`);
    return response.data;
}

// ── Training Programs ──

async function listTrainingPrograms(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-programs', { params });
    return response.data;
}

async function createTrainingProgram(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/training-programs', data);
    return response.data;
}

async function getTrainingProgram(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-programs/${id}`);
    return response.data;
}

async function updateTrainingProgram(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-programs/${id}`, data);
    return response.data;
}

async function deleteTrainingProgram(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/training-programs/${id}`);
    return response.data;
}

async function addProgramCourse(programId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/training-programs/${programId}/courses`, data);
    return response.data;
}

async function removeProgramCourse(programId: string, courseId: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/training-programs/${programId}/courses/${courseId}`);
    return response.data;
}

async function enrollInProgram(programId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/training-programs/${programId}/enroll`, data);
    return response.data;
}

async function listProgramEnrollments(programId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-programs/${programId}/enrollments`);
    return response.data;
}

// ── Training Budgets ──

async function listTrainingBudgets(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-budgets', { params });
    return response.data;
}

async function createTrainingBudget(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/training-budgets', data);
    return response.data;
}

async function updateTrainingBudget(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-budgets/${id}`, data);
    return response.data;
}

async function getBudgetUtilization(fiscalYear: string): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/training-budgets/utilization', { params: { fiscalYear } });
    return response.data;
}

// ── Training Materials ──

async function listTrainingMaterials(trainingId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/training-catalogues/${trainingId}/materials`);
    return response.data;
}

async function createTrainingMaterial(trainingId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/training-catalogues/${trainingId}/materials`, data);
    return response.data;
}

async function updateTrainingMaterial(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/training-materials/${id}`, data);
    return response.data;
}

async function deleteTrainingMaterial(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/training-materials/${id}`);
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

async function approveExpenseClaim(id: string, data?: { approvedAmount?: number; itemApprovals?: any[] }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-claims/${id}/approve-reject`, { action: 'approve', ...data });
    return response.data;
}

async function rejectExpenseClaim(id: string, data?: { rejectionReason?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-claims/${id}/approve-reject`, { action: 'reject', ...data });
    return response.data;
}

// ── Expense Categories ──

async function listExpenseCategories(params?: { includeInactive?: boolean }): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/expense-categories', { params });
    return response.data;
}

async function getExpenseCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/expense-categories/${id}`);
    return response.data;
}

async function createExpenseCategory(data: any): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/expense-categories', data);
    return response.data;
}

async function updateExpenseCategory(id: string, data: any): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/expense-categories/${id}`, data);
    return response.data;
}

async function deleteExpenseCategory(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/expense-categories/${id}`);
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

// ── Offers ──

async function listOffers(params?: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.get('/hr/offers', { params });
    return response.data;
}

async function createOffer(data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post('/hr/offers', data);
    return response.data;
}

async function getOffer(id: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/offers/${id}`);
    return response.data;
}

async function updateOffer(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/offers/${id}`, data);
    return response.data;
}

async function updateOfferStatus(id: string, data: { status: string; rejectionReason?: string }): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/offers/${id}/status`, data);
    return response.data;
}

async function deleteOffer(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/offers/${id}`);
    return response.data;
}

// ── Candidate Profile ──

async function listCandidateEducation(candidateId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/candidates/${candidateId}/education`);
    return response.data;
}

async function createCandidateEducation(candidateId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/candidates/${candidateId}/education`, data);
    return response.data;
}

async function updateCandidateEducation(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/candidate-education/${id}`, data);
    return response.data;
}

async function deleteCandidateEducation(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/candidate-education/${id}`);
    return response.data;
}

async function listCandidateExperience(candidateId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/candidates/${candidateId}/experience`);
    return response.data;
}

async function createCandidateExperience(candidateId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/candidates/${candidateId}/experience`, data);
    return response.data;
}

async function updateCandidateExperience(id: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.patch(`/hr/candidate-experience/${id}`, data);
    return response.data;
}

async function deleteCandidateExperience(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/candidate-experience/${id}`);
    return response.data;
}

async function listCandidateDocuments(candidateId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/candidates/${candidateId}/documents`);
    return response.data;
}

async function createCandidateDocument(candidateId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/candidates/${candidateId}/documents`, data);
    return response.data;
}

async function deleteCandidateDocument(id: string): Promise<ApiResponse<any>> {
    const response = await client.delete(`/hr/candidate-documents/${id}`);
    return response.data;
}

// ── Interview Evaluations ──

async function submitInterviewEvaluations(interviewId: string, data: Record<string, unknown>): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/interviews/${interviewId}/evaluations`, data);
    return response.data;
}

async function listInterviewEvaluations(interviewId: string): Promise<ApiResponse<any>> {
    const response = await client.get(`/hr/interviews/${interviewId}/evaluations`);
    return response.data;
}

// ── Candidate Conversion ──

async function convertCandidateToEmployee(candidateId: string): Promise<ApiResponse<any>> {
    const response = await client.post(`/hr/candidates/${candidateId}/convert-to-employee`);
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
    deleteCandidate,
    advanceCandidateStage,
    // Interviews
    listInterviews,
    createInterview,
    getInterview,
    updateInterview,
    completeInterview,
    cancelInterview,
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
    // Training Sessions
    listTrainingSessions,
    createTrainingSession,
    getTrainingSession,
    updateTrainingSession,
    updateTrainingSessionStatus,
    deleteTrainingSession,
    // Training Attendance
    listSessionAttendance,
    registerSessionAttendees,
    markAttendance,
    bulkMarkAttendance,
    // Training Evaluations
    submitTrainingEvaluation,
    getTrainingEvaluation,
    listSessionEvaluations,
    getTrainingEvaluationSummary,
    submitEssFeedback,
    // Expiring Certificates
    getExpiringCertificates,
    // Trainers
    listTrainers,
    createTrainer,
    getTrainer,
    updateTrainer,
    deleteTrainer,
    // Training Programs
    listTrainingPrograms,
    createTrainingProgram,
    getTrainingProgram,
    updateTrainingProgram,
    deleteTrainingProgram,
    addProgramCourse,
    removeProgramCourse,
    enrollInProgram,
    listProgramEnrollments,
    // Training Budgets
    listTrainingBudgets,
    createTrainingBudget,
    updateTrainingBudget,
    getBudgetUtilization,
    // Training Materials
    listTrainingMaterials,
    createTrainingMaterial,
    updateTrainingMaterial,
    deleteTrainingMaterial,
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
    // Expense Categories
    listExpenseCategories,
    getExpenseCategory,
    createExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
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
    // Offers
    listOffers,
    createOffer,
    getOffer,
    updateOffer,
    updateOfferStatus,
    deleteOffer,
    // Candidate Profile
    listCandidateEducation,
    createCandidateEducation,
    updateCandidateEducation,
    deleteCandidateEducation,
    listCandidateExperience,
    createCandidateExperience,
    updateCandidateExperience,
    deleteCandidateExperience,
    listCandidateDocuments,
    createCandidateDocument,
    deleteCandidateDocument,
    // Interview Evaluations
    submitInterviewEvaluations,
    listInterviewEvaluations,
    // Candidate Conversion
    convertCandidateToEmployee,
};
