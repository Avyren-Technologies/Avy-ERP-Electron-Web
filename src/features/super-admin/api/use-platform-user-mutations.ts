import { useMutation, useQueryClient } from '@tanstack/react-query';
import { platformUsersApi } from '@/lib/api/platform-users';
import type { CreatePlatformUserPayload, UpdatePlatformUserPayload } from '@/lib/api/platform-users';
import { platformUserKeys } from './use-platform-user-queries';

export function useCreatePlatformUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePlatformUserPayload) => platformUsersApi.createUser(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: platformUserKeys.lists() });
      qc.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

export function useUpdatePlatformUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlatformUserPayload }) =>
      platformUsersApi.updateUser(id, data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: platformUserKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: platformUserKeys.lists() });
    },
  });
}

export function useResetPlatformUserPassword() {
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      platformUsersApi.resetPassword(id, password),
  });
}

export function useUpdatePlatformUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      platformUsersApi.updateStatus(id, isActive),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: platformUserKeys.detail(variables.id) });
      qc.invalidateQueries({ queryKey: platformUserKeys.lists() });
      qc.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}

export function useDeletePlatformUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => platformUsersApi.deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: platformUserKeys.lists() });
      qc.invalidateQueries({ queryKey: platformUserKeys.stats() });
    },
  });
}
