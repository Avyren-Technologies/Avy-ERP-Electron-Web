import { useQuery } from '@tanstack/react-query';
import { partApi, machineApi } from '@/lib/api/masters';

export const mastersKeys = {
  all: ['masters'] as const,
  // Parts
  parts: (params?: Record<string, unknown>) => [...mastersKeys.all, 'parts', params] as const,
  part: (id: string) => [...mastersKeys.all, 'part', id] as const,
  partCategories: () => [...mastersKeys.all, 'part-categories'] as const,
  productModels: () => [...mastersKeys.all, 'product-models'] as const,
  uoms: () => [...mastersKeys.all, 'uoms'] as const,
  componentTypes: () => [...mastersKeys.all, 'component-types'] as const,
  // Machines
  machines: (params?: Record<string, unknown>) => [...mastersKeys.all, 'machines', params] as const,
  machine: (id: string) => [...mastersKeys.all, 'machine', id] as const,
  machineCategories: () => [...mastersKeys.all, 'machine-categories'] as const,
  machineTypes: () => [...mastersKeys.all, 'machine-types'] as const,
  machineZones: (params?: Record<string, unknown>) =>
    [...mastersKeys.all, 'machine-zones', params] as const,
};

// Part hooks
export function useParts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: mastersKeys.parts(params),
    queryFn: () => partApi.listParts(params),
  });
}

export function usePart(id: string) {
  return useQuery({
    queryKey: mastersKeys.part(id),
    queryFn: () => partApi.getPart(id),
    enabled: !!id,
  });
}

export function usePartCategories() {
  return useQuery({
    queryKey: mastersKeys.partCategories(),
    queryFn: () => partApi.listCategories(),
  });
}

export function useProductModels() {
  return useQuery({
    queryKey: mastersKeys.productModels(),
    queryFn: () => partApi.listProductModels(),
  });
}

export function useUoms() {
  return useQuery({
    queryKey: mastersKeys.uoms(),
    queryFn: () => partApi.listUoms(),
  });
}

export function useComponentTypes() {
  return useQuery({
    queryKey: mastersKeys.componentTypes(),
    queryFn: () => partApi.listComponentTypes(),
  });
}

// Machine hooks
export function useMachines(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: mastersKeys.machines(params),
    queryFn: () => machineApi.listMachines(params),
  });
}

export function useMachine(id: string) {
  return useQuery({
    queryKey: mastersKeys.machine(id),
    queryFn: () => machineApi.getMachine(id),
    enabled: !!id,
  });
}

export function useMachineCategories() {
  return useQuery({
    queryKey: mastersKeys.machineCategories(),
    queryFn: () => machineApi.listCategories(),
  });
}

export function useMachineTypes() {
  return useQuery({
    queryKey: mastersKeys.machineTypes(),
    queryFn: () => machineApi.listTypes(),
  });
}

export function useMachineZones(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: mastersKeys.machineZones(params),
    queryFn: () => machineApi.listZones(params),
  });
}
