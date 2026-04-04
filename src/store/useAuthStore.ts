import { create } from 'zustand';
import type { AuthTokens, AuthUser } from '@/lib/api/auth';
import { checkPermission, parsePermissionsFromAccessToken } from '@/lib/api/auth';
import { queryClient } from '@/lib/api/provider';

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
        const fromJwt = parsePermissionsFromAccessToken(tokens.accessToken);
        const permissions =
            fromJwt !== undefined && fromJwt.length > 0 ? fromJwt : (user.permissions ?? []);
        const userToStore = { ...user, permissions };
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        localStorage.setItem('auth_user', JSON.stringify(userToStore));
        localStorage.setItem('user_role', mappedRole);
        set({ status: 'signIn', token: tokens.accessToken, user: userToStore, userRole: mappedRole, permissions });
    },

    signOut: () => {
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_role');
        // Clear all React Query caches so new user doesn't see stale data
        queryClient.clear();
        set({ status: 'signOut', token: null, user: null, userRole: null, permissions: [] });
    },

    updateTokens: (tokens) => {
        localStorage.setItem('auth_tokens', JSON.stringify(tokens));
        const fromJwt = parsePermissionsFromAccessToken(tokens.accessToken);
        if (fromJwt !== undefined) {
            try {
                const raw = localStorage.getItem('auth_user');
                if (raw) {
                    const u = JSON.parse(raw) as AuthUser;
                    u.permissions = fromJwt;
                    localStorage.setItem('auth_user', JSON.stringify(u));
                    set({ token: tokens.accessToken, permissions: fromJwt, user: u });
                    return;
                }
            } catch {
                // fall through
            }
            set({ token: tokens.accessToken, permissions: fromJwt });
            return;
        }
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
            // If nothing about the user role is stored, default to super-admin
            // to match expected app/test behavior.
            const mappedRole = role ?? (user ? mapBackendRole(user.role) : 'super-admin');
            const fromJwt = parsePermissionsFromAccessToken(tokens.accessToken);
            const permissions =
                fromJwt !== undefined && fromJwt.length > 0
                    ? fromJwt
                    : (user?.permissions ?? []);
            const userMerged =
                user && fromJwt !== undefined && fromJwt.length > 0
                    ? { ...user, permissions: fromJwt }
                    : user;

            useAuthStore.setState({
                status: 'signIn',
                token: tokens.accessToken,
                user: userMerged,
                userRole: mappedRole,
                permissions,
            });
            if (userMerged && fromJwt !== undefined && fromJwt.length > 0) {
                try {
                    localStorage.setItem('auth_user', JSON.stringify(userMerged));
                } catch {
                    // ignore
                }
            }
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

/** Returns true if the user is an employee (not super-admin or company-admin) with ESS permissions. */
export function isEmployeeUser(userRole: UserRole | null, permissions: string[]): boolean {
    if (userRole === 'super-admin' || userRole === 'company-admin') return false;
    // Check if user has any ESS permissions but not company:read
    return permissions.some(p => p.startsWith('ess:')) && !checkPermission(permissions, 'company:read');
}

// Re-export checkPermission for convenience
export { checkPermission };

// ── Cross-tab logout synchronization ──

/**
 * Listens for localStorage changes from other tabs.
 * When `auth_tokens` is removed in another tab, signs out in this tab too.
 * NOTE: The `storage` event only fires for *other* tabs/windows, not the current one.
 */
export function initCrossTabSync() {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event: StorageEvent) => {
        if (event.key === 'auth_tokens' && event.newValue === null) {
            // Another tab logged out — sync this tab
            const { signOut } = useAuthStore.getState();
            signOut();
        }

        // Another tab signed in or refreshed tokens — pick up the new session
        if (event.key === 'auth_tokens' && event.newValue !== null) {
            try {
                const tokens = JSON.parse(event.newValue);
                const userRaw = localStorage.getItem('auth_user');
                const role = localStorage.getItem('user_role') as UserRole | null;
                const user = userRaw ? JSON.parse(userRaw) : null;
                const mappedRole = role ?? (user ? mapBackendRole(user.role) : 'user');
                const fromJwt = parsePermissionsFromAccessToken(tokens.accessToken);
                const permissions =
                    fromJwt !== undefined && fromJwt.length > 0
                        ? fromJwt
                        : (user?.permissions ?? []);
                const userMerged =
                    user && fromJwt !== undefined && fromJwt.length > 0
                        ? { ...user, permissions: fromJwt }
                        : user;

                useAuthStore.setState({
                    status: 'signIn',
                    token: tokens.accessToken,
                    user: userMerged,
                    userRole: mappedRole,
                    permissions,
                });
            } catch {
                // Malformed data — ignore
            }
        }
    });
}
