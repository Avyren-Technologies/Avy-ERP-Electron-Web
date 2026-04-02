import { useMutation } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { showSuccess, showApiError } from '@/lib/toast';

interface RegisterCompanyInput {
    companyName: string;
    adminName: string;
    email: string;
    phone: string;
}

async function registerCompany(data: RegisterCompanyInput) {
    const response = await client.post('/auth/register-company', data);
    return response.data;
}

export function useRegisterCompanyMutation() {
    return useMutation({
        mutationFn: registerCompany,
        onSuccess: (data) => {
            showSuccess(data?.message || 'Registration submitted successfully');
        },
        onError: (err) => {
            showApiError(err);
        },
    });
}
