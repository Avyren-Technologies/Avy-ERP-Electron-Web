import { useQuery } from '@tanstack/react-query';
import { platformUsersApi } from '@/lib/api/platform-users';
import type { PlatformUserListParams } from '@/lib/api/platform-users';

export const platformUserKeys = {
  all: ['platform-users'] as const,
  lists: () => [...platformUserKeys.all, 'list'] as const,
  list: (params: PlatformUserListParams) => [...platformUserKeys.lists(), params] as const,
  details: () => [...platformUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...platformUserKeys.details(), id] as const,
  stats: () => [...platformUserKeys.all, 'stats'] as const,
  companies: () => [...platformUserKeys.all, 'companies'] as const,
};

export function usePlatformUsers(params: PlatformUserListParams = {}) {
  return useQuery({
    queryKey: platformUserKeys.list(params),
    queryFn: () => platformUsersApi.listUsers(params),
  });
}

export function usePlatformUser(id: string) {
  return useQuery({
    queryKey: platformUserKeys.detail(id),
    queryFn: () => platformUsersApi.getUserById(id),
    enabled: !!id,
  });
}

export function usePlatformUserStats() {
  return useQuery({
    queryKey: platformUserKeys.stats(),
    queryFn: () => platformUsersApi.getStats(),
    staleTime: 30_000,
  });
}

export function usePlatformCompanies() {
  return useQuery({
    queryKey: platformUserKeys.companies(),
    queryFn: () => platformUsersApi.listCompanies(),
    staleTime: 5 * 60_000,
  });
}
