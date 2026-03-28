import { useMutation, useQueryClient } from '@tanstack/react-query';
import { onboardingApi } from '@/lib/api/onboarding';
import { onboardingKeys } from './use-onboarding-queries';

export function useCreateOnboardingTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => onboardingApi.createTemplate(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: onboardingKeys.templates() }); },
    });
}

export function useUpdateOnboardingTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => onboardingApi.updateTemplate(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: onboardingKeys.all }); },
    });
}

export function useDeleteOnboardingTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => onboardingApi.deleteTemplate(id),
        onSuccess: () => { qc.invalidateQueries({ queryKey: onboardingKeys.templates() }); },
    });
}

export function useGenerateOnboardingTasks() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: Record<string, unknown>) => onboardingApi.generateTasks(data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: onboardingKeys.tasks() }); },
    });
}

export function useUpdateOnboardingTask() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => onboardingApi.updateTask(id, data),
        onSuccess: () => { qc.invalidateQueries({ queryKey: onboardingKeys.all }); },
    });
}
