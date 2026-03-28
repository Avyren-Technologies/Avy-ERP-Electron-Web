import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from '@/lib/api/onboarding';

export const onboardingKeys = {
    all: ['onboarding'] as const,
    templates: (params?: Record<string, unknown>) => [...onboardingKeys.all, 'templates', params] as const,
    template: (id: string) => [...onboardingKeys.all, 'template', id] as const,
    tasks: (params?: Record<string, unknown>) => [...onboardingKeys.all, 'tasks', params] as const,
    progress: (employeeId: string) => [...onboardingKeys.all, 'progress', employeeId] as const,
};

export function useOnboardingTemplates(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: onboardingKeys.templates(params),
        queryFn: () => onboardingApi.listTemplates(params),
    });
}

export function useOnboardingTemplate(id: string) {
    return useQuery({
        queryKey: onboardingKeys.template(id),
        queryFn: () => onboardingApi.getTemplate(id),
        enabled: !!id,
    });
}

export function useOnboardingTasks(params?: Record<string, unknown>) {
    return useQuery({
        queryKey: onboardingKeys.tasks(params),
        queryFn: () => onboardingApi.listTasks(params),
    });
}

export function useOnboardingProgress(employeeId: string) {
    return useQuery({
        queryKey: onboardingKeys.progress(employeeId),
        queryFn: () => onboardingApi.getProgress(employeeId),
        enabled: !!employeeId,
    });
}
