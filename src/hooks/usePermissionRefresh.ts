import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { client } from '@/lib/api/client';
import type { AuthUser } from '@/lib/api/auth';

/**
 * Auto-refreshes user permissions on mount by calling GET /auth/profile.
 * This ensures permissions update immediately when an admin changes a user's role,
 * without requiring logout/login.
 */
export function usePermissionRefresh() {
    const status = useAuthStore((s) => s.status);
    const currentPermissions = useAuthStore((s) => s.permissions);
    const currentUser = useAuthStore((s) => s.user);

    useEffect(() => {
        if (status !== 'signIn') return;

        let cancelled = false;

        async function refresh() {
            try {
                const res = await client.get('/auth/profile').then(r => r.data);
                if (cancelled) return;
                const freshUser = (res?.data?.user ?? res?.user ?? null) as Partial<AuthUser> | null;
                const freshPermissions: string[] = res?.data?.user?.permissions ?? res?.user?.permissions ?? [];

                if (freshUser) {
                    const mergedPermissions =
                        freshPermissions.length > 0 ? freshPermissions : (currentPermissions ?? []);
                    const mergedUser: AuthUser = {
                        ...(currentUser ?? {}),
                        ...freshUser,
                        permissions: mergedPermissions,
                    } as AuthUser;
                    useAuthStore.setState({ user: mergedUser, permissions: mergedPermissions });
                    try {
                        localStorage.setItem('auth_user', JSON.stringify(mergedUser));
                    } catch { /* ignore */ }
                    return;
                }

                if (freshPermissions.length > 0 && JSON.stringify(freshPermissions) !== JSON.stringify(currentPermissions)) {
                    useAuthStore.setState({ permissions: freshPermissions });
                }
            } catch {
                // Silent fail — don't break the app if profile fetch fails
            }
        }

        refresh();
        return () => { cancelled = true; };
    }, [status]); // Only re-run on auth status change, not on every permission change
}
