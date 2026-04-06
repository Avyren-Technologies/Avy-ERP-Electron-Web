import { useQuery } from '@tanstack/react-query';
import { recruitmentApi } from '@/lib/api/recruitment';

export const recruitmentKeys = {
    all: ['recruitment'] as const,

    // Requisitions
    requisitions: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'requisitions', params] as const,
    requisition: (id: string) =>
        [...recruitmentKeys.all, 'requisition', id] as const,

    // Candidates
    candidates: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'candidates', params] as const,
    candidate: (id: string) =>
        [...recruitmentKeys.all, 'candidate', id] as const,

    // Interviews
    interviews: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'interviews', params] as const,
    interview: (id: string) =>
        [...recruitmentKeys.all, 'interview', id] as const,

    // Recruitment Dashboard
    recruitmentDashboard: () =>
        [...recruitmentKeys.all, 'recruitment-dashboard'] as const,

    // Training Catalogue
    trainingCatalogue: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'training-catalogue', params] as const,
    trainingCatalogueItem: (id: string) =>
        [...recruitmentKeys.all, 'training-catalogue-item', id] as const,

    // Training Nominations
    trainingNominations: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'training-nominations', params] as const,

    // Training Dashboard
    trainingDashboard: () =>
        [...recruitmentKeys.all, 'training-dashboard'] as const,

    // Asset Categories
    assetCategories: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'asset-categories', params] as const,
    assetCategory: (id: string) =>
        [...recruitmentKeys.all, 'asset-category', id] as const,

    // Assets
    assets: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'assets', params] as const,
    asset: (id: string) =>
        [...recruitmentKeys.all, 'asset', id] as const,

    // Asset Assignments
    assetAssignments: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'asset-assignments', params] as const,

    // Expense Categories
    expenseCategories: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'expense-categories', params] as const,
    expenseCategory: (id: string) =>
        [...recruitmentKeys.all, 'expense-category', id] as const,

    // Expense Claims
    expenseClaims: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'expense-claims', params] as const,
    expenseClaim: (id: string) =>
        [...recruitmentKeys.all, 'expense-claim', id] as const,

    // Letter Templates
    letterTemplates: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'letter-templates', params] as const,
    letterTemplate: (id: string) =>
        [...recruitmentKeys.all, 'letter-template', id] as const,

    // Letters
    letters: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'letters', params] as const,
    letter: (id: string) =>
        [...recruitmentKeys.all, 'letter', id] as const,

    // E-Sign
    eSignStatus: (letterId: string) =>
        [...recruitmentKeys.all, 'esign-status', letterId] as const,
    pendingESign: () =>
        [...recruitmentKeys.all, 'pending-esign'] as const,

    // Grievance Categories
    grievanceCategories: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'grievance-categories', params] as const,
    grievanceCategory: (id: string) =>
        [...recruitmentKeys.all, 'grievance-category', id] as const,

    // Grievance Cases
    grievanceCases: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'grievance-cases', params] as const,
    grievanceCase: (id: string) =>
        [...recruitmentKeys.all, 'grievance-case', id] as const,

    // Disciplinary Actions
    disciplinaryActions: (params?: Record<string, unknown>) =>
        [...recruitmentKeys.all, 'disciplinary-actions', params] as const,
    disciplinaryAction: (id: string) =>
        [...recruitmentKeys.all, 'disciplinary-action', id] as const,

    // Offers
    offers: (params?: Record<string, unknown>) =>
        params
            ? [...recruitmentKeys.all, 'offers', params] as const
            : [...recruitmentKeys.all, 'offers'] as const,
    offer: (id: string) =>
        [...recruitmentKeys.all, 'offer', id] as const,

    // Candidate Profile
    candidateEducation: (candidateId: string) =>
        [...recruitmentKeys.all, 'candidate-education', candidateId] as const,
    candidateExperience: (candidateId: string) =>
        [...recruitmentKeys.all, 'candidate-experience', candidateId] as const,
    candidateDocuments: (candidateId: string) =>
        [...recruitmentKeys.all, 'candidate-documents', candidateId] as const,

    // Interview Evaluations
    interviewEvaluations: (interviewId: string) =>
        [...recruitmentKeys.all, 'interview-evaluations', interviewId] as const,
};

// ── Requisitions ──

export function useRequisitions(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.requisitions(params),
        queryFn: () => recruitmentApi.listRequisitions(params as any),
    });
}

export function useRequisition(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.requisition(id),
        queryFn: () => recruitmentApi.getRequisition(id),
        enabled: !!id,
    });
}

// ── Candidates ──

export function useCandidates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.candidates(params),
        queryFn: () => recruitmentApi.listCandidates(params as any),
    });
}

export function useCandidate(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.candidate(id),
        queryFn: () => recruitmentApi.getCandidate(id),
        enabled: !!id,
    });
}

// ── Interviews ──

export function useInterviews(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.interviews(params),
        queryFn: () => recruitmentApi.listInterviews(params as any),
    });
}

export function useInterview(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.interview(id),
        queryFn: () => recruitmentApi.getInterview(id),
        enabled: !!id,
    });
}

// ── Recruitment Dashboard ──

export function useRecruitmentDashboard() {
    return useQuery({
        queryKey: recruitmentKeys.recruitmentDashboard(),
        queryFn: () => recruitmentApi.getRecruitmentDashboard(),
    });
}

// ── Training Catalogue ──

export function useTrainingCatalogue(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.trainingCatalogue(params),
        queryFn: () => recruitmentApi.listTrainingCatalogue(params as any),
    });
}

export function useTrainingCatalogueItem(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.trainingCatalogueItem(id),
        queryFn: () => recruitmentApi.getTrainingCatalogue(id),
        enabled: !!id,
    });
}

// ── Training Nominations ──

export function useTrainingNominations(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.trainingNominations(params),
        queryFn: () => recruitmentApi.listTrainingNominations(params as any),
    });
}

// ── Training Dashboard ──

export function useTrainingDashboard() {
    return useQuery({
        queryKey: recruitmentKeys.trainingDashboard(),
        queryFn: () => recruitmentApi.getTrainingDashboard(),
    });
}

// ── Asset Categories ──

export function useAssetCategories(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.assetCategories(params),
        queryFn: () => recruitmentApi.listAssetCategories(params as any),
    });
}

export function useAssetCategory(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.assetCategory(id),
        queryFn: () => recruitmentApi.getAssetCategory(id),
        enabled: !!id,
    });
}

// ── Assets ──

export function useAssets(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.assets(params),
        queryFn: () => recruitmentApi.listAssets(params as any),
    });
}

export function useAsset(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.asset(id),
        queryFn: () => recruitmentApi.getAsset(id),
        enabled: !!id,
    });
}

// ── Asset Assignments ──

export function useAssetAssignments(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.assetAssignments(params),
        queryFn: () => recruitmentApi.listAssetAssignments(params as any),
    });
}

// ── Expense Categories ──

export function useExpenseCategories(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.expenseCategories(params),
        queryFn: () => recruitmentApi.listExpenseCategories(params as any),
    });
}

export function useExpenseCategory(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.expenseCategory(id),
        queryFn: () => recruitmentApi.getExpenseCategory(id),
        enabled: !!id,
    });
}

// ── Expense Claims ──

export function useExpenseClaims(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.expenseClaims(params),
        queryFn: () => recruitmentApi.listExpenseClaims(params as any),
    });
}

export function useExpenseClaim(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.expenseClaim(id),
        queryFn: () => recruitmentApi.getExpenseClaim(id),
        enabled: !!id,
    });
}

// ── Letter Templates ──

export function useLetterTemplates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.letterTemplates(params),
        queryFn: () => recruitmentApi.listLetterTemplates(params as any),
    });
}

export function useLetterTemplate(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.letterTemplate(id),
        queryFn: () => recruitmentApi.getLetterTemplate(id),
        enabled: !!id,
    });
}

// ── Letters ──

export function useLetters(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.letters(params),
        queryFn: () => recruitmentApi.listLetters(params as any),
    });
}

export function useLetter(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.letter(id),
        queryFn: () => recruitmentApi.getLetter(id),
        enabled: !!id,
    });
}

// ── Grievance Categories ──

export function useGrievanceCategories(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.grievanceCategories(params),
        queryFn: () => recruitmentApi.listGrievanceCategories(params as any),
    });
}

export function useGrievanceCategory(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.grievanceCategory(id),
        queryFn: () => recruitmentApi.getGrievanceCategory(id),
        enabled: !!id,
    });
}

// ── Grievance Cases ──

export function useGrievanceCases(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.grievanceCases(params),
        queryFn: () => recruitmentApi.listGrievanceCases(params as any),
    });
}

export function useGrievanceCase(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.grievanceCase(id),
        queryFn: () => recruitmentApi.getGrievanceCase(id),
        enabled: !!id,
    });
}

// ── Disciplinary Actions ──

export function useDisciplinaryActions(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.disciplinaryActions(params),
        queryFn: () => recruitmentApi.listDisciplinaryActions(params as any),
    });
}

export function useDisciplinaryAction(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.disciplinaryAction(id),
        queryFn: () => recruitmentApi.getDisciplinaryAction(id),
        enabled: !!id,
    });
}

// ── E-Sign ──

export function useESignStatus(letterId: string) {
    return useQuery({
        queryKey: recruitmentKeys.eSignStatus(letterId),
        queryFn: () => recruitmentApi.getESignStatus(letterId),
        enabled: !!letterId,
    });
}

export function usePendingESign() {
    return useQuery({
        queryKey: recruitmentKeys.pendingESign(),
        queryFn: () => recruitmentApi.listPendingESign(),
    });
}

// ── Offers ──

export function useOffers(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: recruitmentKeys.offers(params),
        queryFn: () => recruitmentApi.listOffers(params),
    });
}

export function useOffer(id: string) {
    return useQuery({
        queryKey: recruitmentKeys.offer(id),
        queryFn: () => recruitmentApi.getOffer(id),
        enabled: !!id,
    });
}

// ── Candidate Profile ──

export function useCandidateEducation(candidateId: string) {
    return useQuery({
        queryKey: recruitmentKeys.candidateEducation(candidateId),
        queryFn: () => recruitmentApi.listCandidateEducation(candidateId),
        enabled: !!candidateId,
    });
}

export function useCandidateExperience(candidateId: string) {
    return useQuery({
        queryKey: recruitmentKeys.candidateExperience(candidateId),
        queryFn: () => recruitmentApi.listCandidateExperience(candidateId),
        enabled: !!candidateId,
    });
}

export function useCandidateDocuments(candidateId: string) {
    return useQuery({
        queryKey: recruitmentKeys.candidateDocuments(candidateId),
        queryFn: () => recruitmentApi.listCandidateDocuments(candidateId),
        enabled: !!candidateId,
    });
}

// ── Interview Evaluations ──

export function useInterviewEvaluations(interviewId: string) {
    return useQuery({
        queryKey: recruitmentKeys.interviewEvaluations(interviewId),
        queryFn: () => recruitmentApi.listInterviewEvaluations(interviewId),
        enabled: !!interviewId,
    });
}
