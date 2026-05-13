import { useMutation, useQueryClient } from '@tanstack/react-query';
import { partApi, machineApi } from '@/lib/api/masters';
import { mastersKeys } from '@/features/masters/api/use-masters-queries';

// ── Part CRUD ──

export function useCreatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partApi.createPart(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useUpdatePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partApi.updatePart(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.part(variables.id) });
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useDeletePart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partApi.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

// ── Part Category ──

export function useCreatePartCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.partCategories() });
    },
  });
}

export function useUpdatePartCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.partCategories() });
    },
  });
}

export function useDeletePartCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.partCategories() });
    },
  });
}

// ── Product Model ──

export function useCreateProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partApi.createProductModel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.productModels() });
    },
  });
}

export function useUpdateProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partApi.updateProductModel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.productModels() });
    },
  });
}

export function useDeleteProductModel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partApi.deleteProductModel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.productModels() });
    },
  });
}

// ── Unit of Measure ──

export function useCreateUom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => partApi.createUom(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.uoms() });
    },
  });
}

export function useUpdateUom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      partApi.updateUom(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.uoms() });
    },
  });
}

export function useDeleteUom() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => partApi.deleteUom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.uoms() });
    },
  });
}

// ── Machine CRUD ──

export function useCreateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => machineApi.createMachine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useUpdateMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      machineApi.updateMachine(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machine(variables.id) });
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useDeleteMachine() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => machineApi.deleteMachine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

// ── Machine Category ──

export function useCreateMachineCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => machineApi.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineCategories() });
    },
  });
}

export function useUpdateMachineCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      machineApi.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineCategories() });
    },
  });
}

export function useDeleteMachineCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => machineApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineCategories() });
    },
  });
}

// ── Machine Type ──

export function useCreateMachineType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => machineApi.createType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineTypes() });
    },
  });
}

export function useUpdateMachineType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      machineApi.updateType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineTypes() });
    },
  });
}

export function useDeleteMachineType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => machineApi.deleteType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.machineTypes() });
    },
  });
}

// ── Machine Zone ──

export function useCreateMachineZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => machineApi.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useUpdateMachineZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      machineApi.updateZone(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}

export function useDeleteMachineZone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => machineApi.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mastersKeys.all });
    },
  });
}
