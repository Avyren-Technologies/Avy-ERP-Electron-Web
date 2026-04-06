import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi, decodeJwtPayload } from '@/lib/api/auth';
import type { LoginResponse } from '@/lib/api/auth';
import { useAuthStore, mapBackendRole } from '@/store/useAuthStore';
import { getLoginPath } from '@/lib/tenant';
import { unregisterWebPush } from '@/lib/notifications';

export function useLoginMutation() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);

    return useMutation({
        mutationFn: ({ email, password }: { email: string; password: string }) =>
            authApi.login(email, password),
        onSuccess: (response) => {
            if (response.success && response.data) {
                // Check if MFA challenge is returned
                if ('mfaRequired' in response.data && (response.data as any).mfaRequired) {
                    const mfaData = response.data as any;
                    sessionStorage.setItem('mfa_token', mfaData.mfaToken);

                    if (mfaData.mfaSetupRequired) {
                        // Company enforces MFA but user hasn't set it up — redirect to setup
                        navigate('/mfa-setup');
                    } else {
                        // User has MFA set up — redirect to verification
                        navigate('/mfa-verify');
                    }
                    return;
                }

                // Normal login — extract tokens and sign in
                const { user, tokens } = response.data as LoginResponse;
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
        mutationFn: async () => {
            await unregisterWebPush();
            return authApi.logout();
        },
        onSuccess: () => {
            signOut();
            navigate(getLoginPath());
        },
        onError: () => {
            // Even if the API call fails, sign out locally
            signOut();
            navigate(getLoginPath());
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
