import { useMutation, useQueryClient } from '@tanstack/react-query';
import { performanceApi } from '@/lib/api/performance';
import { performanceKeys } from './use-performance-queries';

// ── Appraisal Cycle Mutations ──

export function useCreateAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createAppraisalCycle(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateAppraisalCycle(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useDeleteAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.deleteAppraisalCycle(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useActivateAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.activateAppraisalCycle(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function usePublishAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.publishAppraisalCycle(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useCloseAppraisalCycle() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.closeAppraisalCycle(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── Goal Mutations ──

export function useCreateGoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createGoal(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateGoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateGoal(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useDeleteGoal() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.deleteGoal(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── Appraisal Entry Mutations ──

export function useUpdateAppraisalEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateAppraisalEntry(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useSubmitSelfReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.submitSelfReview(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useSubmitManagerReview() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.submitManagerReview(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function usePublishAppraisalEntry() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.publishAppraisalEntry(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── 360 Feedback Mutations ──

export function useCreateFeedback360() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createFeedback360(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateFeedback360() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateFeedback360(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── Skill Mutations ──

export function useCreateSkill() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createSkill(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateSkill() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateSkill(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useDeleteSkill() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.deleteSkill(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── Skill Mapping Mutations ──

export function useCreateSkillMapping() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createSkillMapping(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateSkillMapping() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateSkillMapping(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useDeleteSkillMapping() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.deleteSkillMapping(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

// ── Succession Plan Mutations ──

export function useCreateSuccessionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: any) => performanceApi.createSuccessionPlan(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useUpdateSuccessionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: any }) => performanceApi.updateSuccessionPlan(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}

export function useDeleteSuccessionPlan() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => performanceApi.deleteSuccessionPlan(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: performanceKeys.all }); },
    });
}
