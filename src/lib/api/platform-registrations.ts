import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/lib/toast';

export interface RegistrationRequest {
  id: string;
  companyName: string;
  adminName: string;
  email: string;
  phone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export const registrationKeys = {
  all: ['platform-registrations'] as const,
  list: (params?: Record<string, any>) =>
    params ? [...registrationKeys.all, 'list', params] : [...registrationKeys.all, 'list'],
  detail: (id: string) => [...registrationKeys.all, 'detail', id],
};

async function fetchRegistrations(params?: { status?: string; page?: number; limit?: number }) {
  const response = await client.get('/platform/registrations', { params });
  return response.data;
}

async function fetchRegistration(id: string) {
  const response = await client.get(`/platform/registrations/${id}`);
  return response.data;
}

async function updateRegistration(id: string, data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string }) {
  const response = await client.patch(`/platform/registrations/${id}`, data);
  return response.data;
}

export function useRegistrations(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: registrationKeys.list(params),
    queryFn: () => fetchRegistrations(params),
  });
}

export function useRegistration(id: string) {
  return useQuery({
    queryKey: registrationKeys.detail(id),
    queryFn: () => fetchRegistration(id),
    enabled: !!id,
  });
}

export function useUpdateRegistrationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: 'APPROVED' | 'REJECTED'; rejectionReason?: string } }) =>
      updateRegistration(id, data),
    onSuccess: (result) => {
      showSuccess(result?.message || 'Registration updated');
      queryClient.invalidateQueries({ queryKey: registrationKeys.all });
    },
    onError: (err) => showApiError(err),
  });
}
