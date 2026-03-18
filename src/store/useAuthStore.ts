import { create } from 'zustand';
import type { AuthTokens, AuthUser } from '@/lib/api/auth';
import { checkPermission } from '@/lib/api/auth';

export type UserRole = 'super-admin' | 'company-admin' | 'user';

interface AuthState {
    status: 'idle' | 'signOut' | 'signIn';
    token: string | null;
    user: AuthUser | null;
    userRole: UserRole | null;
    permissions: string[];
    signIn: (tokens: AuthTokens, user: AuthUser, role?: UserRole) => void;
    signOut: () => void;
    updateTokens: (tokens: AuthTokens) => void;
}

/** Map backend role strings to our internal role type */
export function mapBackendRole(backendRole: string): UserRole {
    switch (backendRole) {
        case 'SUPER_ADMIN': return 'super-admin';
        case 'COMPANY_ADMIN': return 'company-admin';
        default: return 'user';
    }
}

/** Human-readable label for a role. */
export function getRoleLabel(role: UserRole | null): string {
    switch (role) {
        case 'super-admin': return 'Super Admin';
        case 'company-admin': return 'Company Admin';
        default: return 'User';
    }
}

/** Get initials from a user object. */
export function getUserInitials(user: AuthUser | null): string {
    if (!user) return '?';
    const f = user.firstName?.[0] ?? '';
    const l = user.lastName?.[0] ?? '';
    return (f + l).toUpperCase() || '?';
}

/** Get full display name. */
export function getDisplayName(user: AuthUser | null): string {
    if (!user) return 'Unknown';
    return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email;
}

export const useAuthStore = create<AuthState>((set) => ({
    status: 'idle',
    token: null,
    user: null,
    userRole: null,
    permissions: [],

    signIn: (tokens, user, role) => {
        const mappedRole = role ?? mapBackendRole(user.role);
        const permissions = user.permissions ?? [];
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        localStorage.setItem('auth_user', JSON.stringify(user));
        localStorage.setItem('user_role', mappedRole);
        set({ status: 'signIn', token: tokens.accessToken, user, userRole: mappedRole, permissions });
    },

    signOut: () => {
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_role');
        set({ status: 'signOut', token: null, user: null, userRole: null, permissions: [] });
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
            const mappedRole = role ?? (user ? mapBackendRole(user.role) : 'user');
            const permissions = user?.permissions ?? [];

            useAuthStore.setState({
                status: 'signIn',
                token: tokens.accessToken,
                user,
                userRole: mappedRole,
                permissions,
            });
        } else {
            useAuthStore.setState({ status: 'signOut' });
        }
    } catch {
        useAuthStore.setState({ status: 'signOut' });
    }
};

/** React hook: returns true if the current user has the given permission. */
export function useHasPermission(permission: string): boolean {
    const permissions = useAuthStore((s) => s.permissions);
    return checkPermission(permissions, permission);
}
