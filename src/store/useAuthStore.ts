import { create } from 'zustand';
import type { AuthTokens, AuthUser } from '@/lib/api/auth';

type UserRole = 'super-admin' | 'company-admin' | 'user';

interface AuthState {
    status: 'idle' | 'signOut' | 'signIn';
    token: string | null;
    user: AuthUser | null;
    userRole: UserRole | null;
    signIn: (tokens: AuthTokens, user: AuthUser, role?: UserRole) => void;
    signOut: () => void;
    updateTokens: (tokens: AuthTokens) => void;
}

/** Map backend role strings to our internal role type */
export function mapBackendRole(backendRole: string): UserRole {
    switch (backendRole) {
        case 'SUPER_ADMIN':
            return 'super-admin';
        case 'COMPANY_ADMIN':
            return 'company-admin';
        default:
            return 'user';
    }
}

export const useAuthStore = create<AuthState>((set) => ({
    status: 'idle',
    token: null,
    user: null,
    userRole: null,

    signIn: (tokens, user, role) => {
        const mappedRole = role ?? mapBackendRole(user.role);
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('user_role', mappedRole);
        set({ status: 'signIn', token: tokens.accessToken, user, userRole: mappedRole });
    },

    signOut: () => {
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_role');
        set({ status: 'signOut', token: null, user: null, userRole: null });
    },

    updateTokens: (tokens) => {
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        set({ token: tokens.accessToken });
    },
}));

// ── Static helpers for interceptor use (no React hooks) ──

export function getAccessToken(): string | null {
    try {
        const raw = localStorage.getItem('auth_tokens');
        if (!raw) return null;
        return JSON.parse(raw).accessToken ?? null;
    } catch {
        return null;
    }
}

export function getRefreshToken(): string | null {
    try {
        const raw = localStorage.getItem('auth_tokens');
        if (!raw) return null;
        return JSON.parse(raw).refreshToken ?? null;
    } catch {
        return null;
    }
}

// ── Hydration helper to be called on app mount ──

export const hydrateAuth = () => {
    try {
        const tokensRaw = localStorage.getItem('auth_tokens');
        const userRaw = localStorage.getItem('auth_user');
        const role = localStorage.getItem('user_role') as UserRole | null;

        if (tokensRaw) {
            const tokens: AuthTokens = JSON.parse(tokensRaw);
            const user: AuthUser | null = userRaw ? JSON.parse(userRaw) : null;
            const mappedRole = role ?? (user ? mapBackendRole(user.role) : 'super-admin');

            useAuthStore.setState({
                status: 'signIn',
                token: tokens.accessToken,
                user,
                userRole: mappedRole,
            });
        } else {
            useAuthStore.setState({ status: 'signOut' });
        }
    } catch {
        useAuthStore.setState({ status: 'signOut' });
    }
};
