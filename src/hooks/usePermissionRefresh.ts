import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { client } from '@/lib/api/client';

/**
 * Auto-refreshes user permissions on mount by calling GET /auth/profile.
 * This ensures permissions update immediately when an admin changes a user's role,
 * without requiring logout/login.
 */
export function usePermissionRefresh() {
    const status = useAuthStore((s) => s.status);
    const currentPermissions = useAuthStore((s) => s.permissions);

    useEffect(() => {
        if (status !== 'signIn') return;

        let cancelled = false;

        async function refresh() {
            try {
                const res = await client.get('/auth/profile').then(r => r.data);
                if (cancelled) return;
                const freshPermissions: string[] = res?.data?.user?.permissions ?? res?.user?.permissions ?? [];
                if (freshPermissions.length > 0 && JSON.stringify(freshPermissions) !== JSON.stringify(currentPermissions)) {
                    useAuthStore.setState({ permissions: freshPermissions });
                    // Also update the cached user object in localStorage
                    try {
                        const userRaw = localStorage.getItem('auth_user');
                        if (userRaw) {
                            const user = JSON.parse(userRaw);
                            user.permissions = freshPermissions;
                            localStorage.setItem('auth_user', JSON.stringify(user));
                        }
                    } catch { /* ignore */ }
                }
            } catch {
                // Silent fail — don't break the app if profile fetch fails
            }
        }

        refresh();
        return () => { cancelled = true; };
    }, [status]); // Only re-run on auth status change, not on every permission change
}
