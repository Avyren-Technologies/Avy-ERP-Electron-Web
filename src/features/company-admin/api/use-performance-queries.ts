import { useQuery } from '@tanstack/react-query';
import { performanceApi } from '@/lib/api/performance';

export const performanceKeys = {
    all: ['performance'] as const,

    // Appraisal Cycles
    cycles: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'cycles', params] as const,
    cycle: (id: string) =>
        [...performanceKeys.all, 'cycle', id] as const,

    // Goals
    goals: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'goals', params] as const,
    goal: (id: string) =>
        [...performanceKeys.all, 'goal', id] as const,
    departmentGoals: (departmentId: string) =>
        [...performanceKeys.all, 'department-goals', departmentId] as const,

    // Appraisal Entries
    entries: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'entries', params] as const,
    entry: (id: string) =>
        [...performanceKeys.all, 'entry', id] as const,
    calibration: (cycleId: string) =>
        [...performanceKeys.all, 'calibration', cycleId] as const,

    // 360 Feedback
    feedback360List: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'feedback-360', params] as const,
    feedback360: (id: string) =>
        [...performanceKeys.all, 'feedback-360-detail', id] as const,
    feedback360Report: (employeeId: string, cycleId: string) =>
        [...performanceKeys.all, 'feedback-360-report', employeeId, cycleId] as const,

    // Skills
    skills: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'skills', params] as const,
    skill: (id: string) =>
        [...performanceKeys.all, 'skill', id] as const,

    // Skill Mappings
    skillMappings: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'skill-mappings', params] as const,
    skillGapAnalysis: (employeeId: string) =>
        [...performanceKeys.all, 'skill-gap-analysis', employeeId] as const,

    // Succession
    successionPlans: (params?: Record<string, unknown>) =>
        [...performanceKeys.all, 'succession-plans', params] as const,
    successionPlan: (id: string) =>
        [...performanceKeys.all, 'succession-plan', id] as const,
    nineBox: () =>
        [...performanceKeys.all, 'nine-box'] as const,
    benchStrength: () =>
        [...performanceKeys.all, 'bench-strength'] as const,

    // Dashboard
    dashboard: () =>
        [...performanceKeys.all, 'dashboard'] as const,
};

// ── Appraisal Cycles ──

export function useAppraisalCycles(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.cycles(params),
        queryFn: () => performanceApi.listAppraisalCycles(params as any),
    });
}

export function useAppraisalCycle(id: string) {
    return useQuery({
        queryKey: performanceKeys.cycle(id),
        queryFn: () => performanceApi.getAppraisalCycle(id),
        enabled: !!id,
    });
}

// ── Goals ──

export function useGoals(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.goals(params),
        queryFn: () => performanceApi.listGoals(params as any),
    });
}

export function useGoal(id: string) {
    return useQuery({
        queryKey: performanceKeys.goal(id),
        queryFn: () => performanceApi.getGoal(id),
        enabled: !!id,
    });
}

export function useDepartmentGoals(departmentId: string) {
    return useQuery({
        queryKey: performanceKeys.departmentGoals(departmentId),
        queryFn: () => performanceApi.getDepartmentGoals(departmentId),
        enabled: !!departmentId,
    });
}

// ── Appraisal Entries ──

export function useAppraisalEntries(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.entries(params),
        queryFn: () => performanceApi.listAppraisalEntries(params as any),
    });
}

export function useAppraisalEntry(id: string) {
    return useQuery({
        queryKey: performanceKeys.entry(id),
        queryFn: () => performanceApi.getAppraisalEntry(id),
        enabled: !!id,
    });
}

export function useCalibrationData(cycleId: string) {
    return useQuery({
        queryKey: performanceKeys.calibration(cycleId),
        queryFn: () => performanceApi.getCalibrationData(cycleId),
        enabled: !!cycleId,
    });
}

// ── 360 Feedback ──

export function useFeedback360List(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.feedback360List(params),
        queryFn: () => performanceApi.listFeedback360(params as any),
    });
}

export function useFeedback360(id: string) {
    return useQuery({
        queryKey: performanceKeys.feedback360(id),
        queryFn: () => performanceApi.getFeedback360(id),
        enabled: !!id,
    });
}

export function useFeedback360Report(employeeId: string, cycleId: string) {
    return useQuery({
        queryKey: performanceKeys.feedback360Report(employeeId, cycleId),
        queryFn: () => performanceApi.getFeedback360Report(employeeId, cycleId),
        enabled: !!employeeId && !!cycleId,
    });
}

// ── Skills ──

export function useSkills(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.skills(params),
        queryFn: () => performanceApi.listSkills(params as any),
    });
}

export function useSkill(id: string) {
    return useQuery({
        queryKey: performanceKeys.skill(id),
        queryFn: () => performanceApi.getSkill(id),
        enabled: !!id,
    });
}

export function useSkillMappings(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.skillMappings(params),
        queryFn: () => performanceApi.listSkillMappings(params as any),
    });
}

export function useSkillGapAnalysis(employeeId: string) {
    return useQuery({
        queryKey: performanceKeys.skillGapAnalysis(employeeId),
        queryFn: () => performanceApi.getSkillGapAnalysis(employeeId),
        enabled: !!employeeId,
    });
}

// ── Succession ──

export function useSuccessionPlans(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: performanceKeys.successionPlans(params),
        queryFn: () => performanceApi.listSuccessionPlans(params as any),
    });
}

export function useSuccessionPlan(id: string) {
    return useQuery({
        queryKey: performanceKeys.successionPlan(id),
        queryFn: () => performanceApi.getSuccessionPlan(id),
        enabled: !!id,
    });
}

export function useNineBoxData() {
    return useQuery({
        queryKey: performanceKeys.nineBox(),
        queryFn: () => performanceApi.getNineBoxData(),
    });
}

export function useBenchStrength() {
    return useQuery({
        queryKey: performanceKeys.benchStrength(),
        queryFn: () => performanceApi.getBenchStrength(),
    });
}

// ── Dashboard ──

export function usePerformanceDashboard() {
    return useQuery({
        queryKey: performanceKeys.dashboard(),
        queryFn: () => performanceApi.getPerformanceDashboard(),
    });
}
