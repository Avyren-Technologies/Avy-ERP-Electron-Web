import { useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'click'] as const;
const CHECK_INTERVAL_MS = 30_000; // check every 30 seconds

/**
 * Tracks user activity and auto-logs out after the company's
 * configured `sessionTimeoutMinutes` of inactivity.
 *
 * Fetches session timeout from `GET /auth/security-settings` (no permission required).
 * Only active for company-admin and user roles (not super-admin, which has no company).
 */
export function useSessionTimeout() {
    const userRole = useAuthStore((s) => s.userRole);
    const signOut = useAuthStore((s) => s.signOut);
    const lastActivityRef = useRef(Date.now());

    // Only fetch for company users (super-admin has no company)
    const isCompanyUser = userRole === 'company-admin' || userRole === 'user';

    const { data } = useQuery({
        queryKey: ['auth', 'security-settings'],
        queryFn: async () => {
            const response = await client.get('/auth/security-settings');
            return response.data as { success: boolean; data: { sessionTimeoutMinutes: number } };
        },
        enabled: isCompanyUser,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: false, // Don't retry on permission errors
    });

    const sessionTimeoutMinutes = data?.data?.sessionTimeoutMinutes ?? 30;

    const resetActivity = useCallback(() => {
        lastActivityRef.current = Date.now();
    }, []);

    useEffect(() => {
        if (!isCompanyUser) return;

        for (const event of ACTIVITY_EVENTS) {
            window.addEventListener(event, resetActivity, { passive: true });
        }

        const intervalId = setInterval(() => {
            const idleMs = Date.now() - lastActivityRef.current;
            const timeoutMs = sessionTimeoutMinutes * 60 * 1000;

            if (idleMs >= timeoutMs) {
                signOut();
                window.location.href = '/login?reason=session_timeout';
            }
        }, CHECK_INTERVAL_MS);

        return () => {
            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, resetActivity);
            }
            clearInterval(intervalId);
        };
    }, [isCompanyUser, sessionTimeoutMinutes, resetActivity, signOut]);
}
