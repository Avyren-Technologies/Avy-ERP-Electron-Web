import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, decodeJwtPayload } from '@/lib/api/auth';
import { useAuthStore, mapBackendRole } from '@/store/useAuthStore';

export function useLoginMutation() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);

    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authApi.login(email, password),
        onSuccess: (response) => {
            if (response.success && response.data) {
                const { user, tokens } = response.data;
                // Decode JWT to extract permissions (embedded in token payload by backend)
                const payload = decodeJwtPayload(tokens.accessToken);
                const permissions: string[] = Array.isArray(payload?.permissions)
                    ? (payload.permissions as string[])
                    : [];
                const role = mapBackendRole(user.role);
                signIn(tokens, { ...user, permissions }, role);
                navigate('/app/dashboard');
            }
        },
    });
}

export function useLogoutMutation() {
    const navigate = useNavigate();
    const signOut = useAuthStore((s) => s.signOut);

    return useMutation({
        mutationFn: () => authApi.logout(),
        onSuccess: () => {
            signOut();
            navigate('/login');
        },
        onError: () => {
            // Even if the API call fails, sign out locally
            signOut();
            navigate('/login');
        },
    });
}

export function useForgotPasswordMutation() {
    return useMutation({
        mutationFn: ({ email }: { email: string }) => authApi.forgotPassword(email),
    });
}

export function useVerifyResetCodeMutation() {
    return useMutation({
        mutationFn: ({ email, code }: { email: string; code: string }) =>
            authApi.verifyResetCode(email, code),
    });
}

export function useResetPasswordMutation() {
    return useMutation({
        mutationFn: ({ email, code, newPassword }: { email: string; code: string; newPassword: string }) =>
            authApi.resetPassword(email, code, newPassword),
    });
}
