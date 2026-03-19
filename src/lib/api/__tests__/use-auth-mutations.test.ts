/**
 * Tests for src/lib/api/use-auth-mutations.ts
 *
 * Each hook wraps useMutation from @tanstack/react-query and calls an authApi
 * function. We verify:
 *   1. The correct authApi function is called with the right arguments.
 *   2. onSuccess / onError side-effects (store updates, navigation) fire.
 *
 * Approach:
 *   - Use vi.hoisted() to declare mock functions BEFORE vi.mock() hoisting occurs.
 *   - Mock react-router-dom's useNavigate.
 *   - Mock useAuthStore so we can assert signIn/signOut calls.
 *   - Wrap renderHook in a QueryClientProvider so useMutation works.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import type { AuthTokens, AuthUser, ApiResponse, LoginResponse } from '@/lib/api/auth';

// ── Hoisted mock definitions ──────────────────────────────────────────────────
//
// vi.mock() factories are hoisted to the top of the file before any imports.
// Variables referenced inside those factories must also be hoisted with
// vi.hoisted() so they are initialised before the factory runs.

const { mockNavigate, mockSignIn, mockSignOut, mockAuthApi } = vi.hoisted(() => ({
    mockNavigate: vi.fn(),
    mockSignIn: vi.fn(),
    mockSignOut: vi.fn(),
    mockAuthApi: {
        login: vi.fn(),
        logout: vi.fn(),
        forgotPassword: vi.fn(),
        verifyResetCode: vi.fn(),
        resetPassword: vi.fn(),
    },
}));

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@/store/useAuthStore', () => ({
    useAuthStore: (selector: (s: any) => any) => {
        const state = { signIn: mockSignIn, signOut: mockSignOut };
        return selector(state);
    },
    mapBackendRole: (role: string) => {
        if (role === 'SUPER_ADMIN') return 'super-admin';
        if (role === 'COMPANY_ADMIN') return 'company-admin';
        return 'user';
    },
}));

vi.mock('@/lib/api/auth', () => ({
    authApi: mockAuthApi,
    decodeJwtPayload: vi.fn(() => ({ permissions: [] })),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser: AuthUser = {
    id: 'u1',
    email: 'admin@avy.com',
    firstName: 'Avy',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
};

const mockTokens: AuthTokens = {
    accessToken: 'at',
    refreshToken: 'rt',
    expiresIn: 3600,
};

const loginSuccess: ApiResponse<LoginResponse> = {
    success: true,
    data: { user: mockUser, tokens: mockTokens },
};

// ── Wrapper ───────────────────────────────────────────────────────────────────

/** Each test gets a fresh QueryClient to avoid mutation state leaking. */
function makeWrapper() {
    const queryClient = new QueryClient({
        defaultOptions: { mutations: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
}

// ── Import hooks after mocks are declared ─────────────────────────────────────

import {
    useLoginMutation,
    useLogoutMutation,
    useForgotPasswordMutation,
    useVerifyResetCodeMutation,
    useResetPasswordMutation,
} from '@/lib/api/use-auth-mutations';

// ── useLoginMutation ──────────────────────────────────────────────────────────

describe('useLoginMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls authApi.login with email and password', async () => {
        mockAuthApi.login.mockResolvedValue(loginSuccess);
        const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'admin@avy.com', password: 's3cr3t' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockAuthApi.login).toHaveBeenCalledTimes(1);
        expect(mockAuthApi.login).toHaveBeenCalledWith('admin@avy.com', 's3cr3t');
    });

    it('calls store signIn with tokens, user, and mapped role on success', async () => {
        mockAuthApi.login.mockResolvedValue(loginSuccess);
        const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'admin@avy.com', password: 's3cr3t' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockSignIn).toHaveBeenCalledTimes(1);
        expect(mockSignIn).toHaveBeenCalledWith(mockTokens, { ...mockUser, permissions: [] }, 'super-admin');
    });

    it('navigates to /app/dashboard on success', async () => {
        mockAuthApi.login.mockResolvedValue(loginSuccess);
        const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'admin@avy.com', password: 's3cr3t' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockNavigate).toHaveBeenCalledWith('/app/dashboard');
    });

    it('does NOT call signIn when response.success is false', async () => {
        mockAuthApi.login.mockResolvedValue({ success: false, error: 'INVALID_CREDENTIALS' });
        const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'x@y.com', password: 'bad' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockSignIn).not.toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('enters error state when authApi.login rejects', async () => {
        mockAuthApi.login.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useLoginMutation(), { wrapper: makeWrapper() });

        await act(async () => {
            result.current.mutate({ email: 'x@y.com', password: 'pass' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockSignIn).not.toHaveBeenCalled();
    });
});

// ── useLogoutMutation ─────────────────────────────────────────────────────────

describe('useLogoutMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls authApi.logout', async () => {
        mockAuthApi.logout.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useLogoutMutation(), { wrapper: makeWrapper() });

        await act(async () => { result.current.mutate(); });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockAuthApi.logout).toHaveBeenCalledTimes(1);
    });

    it('calls store signOut and navigates to /login on success', async () => {
        mockAuthApi.logout.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useLogoutMutation(), { wrapper: makeWrapper() });

        await act(async () => { result.current.mutate(); });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('still calls store signOut and navigates when authApi.logout rejects', async () => {
        mockAuthApi.logout.mockRejectedValue(new Error('Network error'));
        const { result } = renderHook(() => useLogoutMutation(), { wrapper: makeWrapper() });

        await act(async () => { result.current.mutate(); });

        await waitFor(() => expect(result.current.isError).toBe(true));

        // onError fires local signOut + redirect even when API fails
        expect(mockSignOut).toHaveBeenCalledTimes(1);
        expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
});

// ── useForgotPasswordMutation ─────────────────────────────────────────────────

describe('useForgotPasswordMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls authApi.forgotPassword with the email', async () => {
        mockAuthApi.forgotPassword.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useForgotPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockAuthApi.forgotPassword).toHaveBeenCalledTimes(1);
        expect(mockAuthApi.forgotPassword).toHaveBeenCalledWith('user@example.com');
    });

    it('exposes data returned by authApi.forgotPassword', async () => {
        const responseData = { success: true, message: 'Code sent' };
        mockAuthApi.forgotPassword.mockResolvedValue(responseData);
        const { result } = renderHook(() => useForgotPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => { result.current.mutate({ email: 'user@example.com' }); });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toEqual(responseData);
    });

    it('enters error state on rejection', async () => {
        mockAuthApi.forgotPassword.mockRejectedValue(new Error('Timeout'));
        const { result } = renderHook(() => useForgotPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => { result.current.mutate({ email: 'user@example.com' }); });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useVerifyResetCodeMutation ────────────────────────────────────────────────

describe('useVerifyResetCodeMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls authApi.verifyResetCode with email and code', async () => {
        mockAuthApi.verifyResetCode.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useVerifyResetCodeMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com', code: '123456' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockAuthApi.verifyResetCode).toHaveBeenCalledTimes(1);
        expect(mockAuthApi.verifyResetCode).toHaveBeenCalledWith('user@example.com', '123456');
    });

    it('exposes returned data', async () => {
        const responseData = { success: true, message: 'Code verified' };
        mockAuthApi.verifyResetCode.mockResolvedValue(responseData);
        const { result } = renderHook(() => useVerifyResetCodeMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com', code: '123456' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(responseData);
    });

    it('enters error state when verifyResetCode rejects', async () => {
        mockAuthApi.verifyResetCode.mockRejectedValue(new Error('Bad code'));
        const { result } = renderHook(() => useVerifyResetCodeMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com', code: 'bad' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});

// ── useResetPasswordMutation ──────────────────────────────────────────────────

describe('useResetPasswordMutation', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls authApi.resetPassword with email, code, and newPassword', async () => {
        mockAuthApi.resetPassword.mockResolvedValue({ success: true });
        const { result } = renderHook(() => useResetPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({
                email: 'user@example.com',
                code: '123456',
                newPassword: 'NewP@ss1',
            });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockAuthApi.resetPassword).toHaveBeenCalledTimes(1);
        expect(mockAuthApi.resetPassword).toHaveBeenCalledWith(
            'user@example.com',
            '123456',
            'NewP@ss1',
        );
    });

    it('exposes returned data', async () => {
        const responseData = { success: true, message: 'Password reset' };
        mockAuthApi.resetPassword.mockResolvedValue(responseData);
        const { result } = renderHook(() => useResetPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com', code: '123456', newPassword: 'X' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(responseData);
    });

    it('enters error state when resetPassword rejects', async () => {
        mockAuthApi.resetPassword.mockRejectedValue(new Error('Expired code'));
        const { result } = renderHook(() => useResetPasswordMutation(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ email: 'user@example.com', code: '000', newPassword: 'X' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
    });
});
