import { useMutation, useQueryClient } from '@tanstack/react-query';
import { pipApi } from '@/lib/api/pip';
import type { SaveExtraHoursEntriesPayload } from '@/lib/api/pip';
import { pipKeys } from '@/features/production/pip/api/use-pip-queries';

// ── Config ──

export function useUpdatePipConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.updateConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.config() });
    },
  });
}

// ── Slab Configs ──

export function useCreatePipSlabConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.createSlabConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useBulkCreatePipSlabConfigs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.bulkCreateSlabConfigs(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useUpdatePipSlabConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      pipApi.updateSlabConfig(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.slabConfig(variables.id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useDeletePipSlabConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.deleteSlabConfig(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

// ── Daily Entries ──

export function useSavePipDailyEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.saveDailyEntries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useDeletePipDailyEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionRef: string) => pipApi.deleteDailyEntries(sessionRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

// ── Extra Hours Entries ──

export function useSaveExtraHoursEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SaveExtraHoursEntriesPayload) => pipApi.saveExtraHoursEntries(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useDeleteExtraHoursEntries() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sessionRef: string) => pipApi.deleteExtraHoursEntries(sessionRef),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

// ── Calculator ──

export function useSimulatePipIncentive() {
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.simulateIncentive(data),
  });
}

// ── Monthly Reports ──

export function useGeneratePipMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.generateMonthlyReport(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useSubmitPipMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.submitMonthlyReport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.monthlyReport(id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useApprovePipMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.approveMonthlyReport(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.monthlyReport(id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useRejectPipMonthlyReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      pipApi.rejectMonthlyReport(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.monthlyReport(variables.id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

// ── Payroll ──

export function useMergePipToPayroll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      pipApi.mergeToPayroll(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.monthlyReport(variables.id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

export function useReversePipPayrollMerge() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.reversePayrollMerge(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: pipKeys.monthlyReport(id) });
      queryClient.invalidateQueries({ queryKey: pipKeys.all });
    },
  });
}

// ── Process Categories ──

export function useCreateProcessCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.createProcessCategory(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.processCategories() }); },
  });
}

export function useUpdateProcessCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => pipApi.updateProcessCategory(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.processCategories() }); },
  });
}

export function useDeleteProcessCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.deleteProcessCategory(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.processCategories() }); },
  });
}

// ── Downtime Reasons ──

export function useCreateDowntimeReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.createDowntimeReason(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.downtimeReasons() }); },
  });
}

export function useUpdateDowntimeReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => pipApi.updateDowntimeReason(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.downtimeReasons() }); },
  });
}

export function useDeleteDowntimeReason() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.deleteDowntimeReason(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.downtimeReasons() }); },
  });
}

// ── Operations ──

export function useCreateOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => pipApi.createOperation(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.operations() }); },
  });
}

export function useUpdateOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => pipApi.updateOperation(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.operations() }); },
  });
}

export function useDeleteOperation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => pipApi.deleteOperation(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: pipKeys.operations() }); },
  });
}
