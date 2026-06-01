import axios from 'axios';

import { showError, showWarning } from '@/lib/toast';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://avy-erp-api.avyren.in/api/v1/';

// Separate instance for refresh calls — avoids interceptor infinite loops
const refreshClient = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: { Accept: 'application/json' },
});

export const client = axios.create({
    baseURL: BASE_URL,
    timeout: 10000,
    headers: {
        Accept: 'application/json',
    },
});

// ── Token helpers (read from localStorage directly for interceptor use) ──

function getStoredAccessToken(): string | null {
    try {
        const raw = localStorage.getItem('auth_tokens');
        if (!raw) return null;
        return JSON.parse(raw).accessToken ?? null;
    } catch {
        return null;
    }
}

function getStoredRefreshToken(): string | null {
    try {
        const raw = localStorage.getItem('auth_tokens');
        if (!raw) return null;
        return JSON.parse(raw).refreshToken ?? null;
    } catch {
        return null;
    }
}

/**
 * Returns true if the JWT will expire within `thresholdMs` milliseconds.
 * Defaults to 60 seconds — enough time to refresh before the server rejects it.
 */
function isTokenExpiringSoon(token: string, thresholdMs = 60_000): boolean {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expiresAt = payload.exp * 1000;
        return Date.now() > expiresAt - thresholdMs;
    } catch {
        return false;
    }
}

// ── Unified token refresh (single promise, shared by proactive + reactive) ──

/**
 * A single in-flight refresh promise. Both proactive (request interceptor) and
 * reactive (response interceptor) paths share this. If a refresh is already
 * in-flight, callers get the same promise — preventing the race condition where
 * two parallel refresh calls consume and blacklist each other's tokens.
 */
let activeRefreshPromise: Promise<string | null> | null = null;

/**
 * Performs a token refresh, or returns the existing in-flight promise.
 * Returns the new access token on success, or null on failure.
 */
function refreshTokens(): Promise<string | null> {
    if (activeRefreshPromise) return activeRefreshPromise;

    activeRefreshPromise = (async () => {
        const storedRefreshToken = getStoredRefreshToken();
        if (!storedRefreshToken) return null;

        try {
            const { data } = await refreshClient.post('/auth/refresh-token', {
                refreshToken: storedRefreshToken,
            });

            if (data.success && data.data?.tokens) {
                const newTokens = data.data.tokens;
                localStorage.setItem('auth_tokens', JSON.stringify(newTokens));

                // Update Zustand store
                try {
                    const { useAuthStore } = await import('@/store/useAuthStore');
                    useAuthStore.getState().updateTokens(newTokens);
                } catch {
                    // Store not available — tokens already saved to localStorage
                }

                return newTokens.accessToken as string;
            }
            return null;
        } catch {
            return null;
        } finally {
            activeRefreshPromise = null;
        }
    })();

    return activeRefreshPromise;
}

// ── Request interceptor: attach Bearer token (with proactive refresh) ──

refreshClient.interceptors.request.use((config) => {
    config.headers['X-Device-Info'] = 'web';
    return config;
});

client.interceptors.request.use(
    async (config) => {
        config.headers['X-Device-Info'] = 'web';

        let token = getStoredAccessToken();

        // Proactive refresh: if the token is about to expire, refresh before sending
        if (token && isTokenExpiringSoon(token)) {
            const newToken = await refreshTokens();
            if (newToken) token = newToken;
            // If refresh fails, proceed with old token — response interceptor handles 401
        }

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 + silent refresh ──

let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];
let isHandlingRefresh = false;

function processQueue(error: unknown, token: string | null = null) {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    failedQueue = [];
}

client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // 403 — company deactivated: force logout
        if (error.response?.status === 403) {
            const code = error.response?.data?.code;
            if (code === 'COMPANY_SUSPENDED' || code === 'COMPANY_CANCELLED' || code === 'COMPANY_EXPIRED' || code === 'COMPANY_INACTIVE') {
                showError('Account Deactivated', error.response?.data?.message || 'Your company account is no longer active.');
                // Force logout after a short delay so the toast is visible
                setTimeout(() => {
                    void import('@/store/useAuthStore').then(({ useAuthStore }) => {
                        useAuthStore.getState().signOut();
                    });
                }, 2000);
                return Promise.reject(error);
            }
            showWarning('Access Denied', 'You do not have permission to perform this action.');
            return Promise.reject(error);
        }

        // 5xx — server errors
        if (error.response?.status && error.response.status >= 500) {
            showError('Server Error', 'Something went wrong. Please try again later.');
        }

        // Only attempt refresh on 401 with TOKEN_EXPIRED code
        const isTokenExpired =
            error.response?.status === 401 &&
            (error.response?.data?.code === 'TOKEN_EXPIRED' || error.response?.data?.error === 'TOKEN_EXPIRED');

        if (!isTokenExpired || originalRequest._retry) {
            return Promise.reject(error);
        }

        // Check if the token was already refreshed since this request was sent
        // (by proactive refresh, another concurrent request, or another tab).
        // If so, just retry with the current token — no need for another refresh.
        const currentToken = getStoredAccessToken();
        const requestToken = originalRequest.headers?.Authorization?.replace('Bearer ', '');
        if (currentToken && requestToken && currentToken !== requestToken) {
            originalRequest._retry = true;
            originalRequest.headers.Authorization = `Bearer ${currentToken}`;
            return client(originalRequest);
        }

        if (isHandlingRefresh) {
            // Queue this request until the in-progress refresh completes
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return client(originalRequest);
            });
        }

        originalRequest._retry = true;
        isHandlingRefresh = true;

        try {
            // refreshTokens() deduplicates: if a proactive refresh is already
            // in-flight, this awaits the same promise instead of firing a second call
            const newAccessToken = await refreshTokens();

            if (newAccessToken) {
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                processQueue(null, newAccessToken);
                return client(originalRequest);
            } else {
                processQueue(error, null);
                clearAuthAndRedirect();
                return Promise.reject(error);
            }
        } catch (refreshError) {
            processQueue(refreshError, null);
            clearAuthAndRedirect();
            return Promise.reject(refreshError);
        } finally {
            isHandlingRefresh = false;
        }
    },
);

// ── Visibility change: refresh tokens when tab becomes active ──
//
// When the user switches back to this tab after a long absence, the access token
// may be expired. React Query's refetchOnWindowFocus fires stale queries
// immediately. By refreshing here FIRST, we ensure the new token is available
// before those queries go out.

if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const token = getStoredAccessToken();
            if (token && isTokenExpiringSoon(token)) {
                // Fire-and-forget — if a refresh is already in progress
                // (activeRefreshPromise !== null), this reuses the same promise.
                // The request interceptor will await the result before sending.
                refreshTokens();
            }
        }
    });
}

function clearAuthAndRedirect() {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');
    // Redirect to login preserving tenant context
    if (window.location.pathname !== '/login') {
        // On localhost dev, preserve ?tenant=slug param
        const hostname = window.location.hostname;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            const params = new URLSearchParams(window.location.search);
            const devSlug = params.get('tenant');
            if (devSlug) {
                window.location.href = `/login?tenant=${devSlug}`;
                return;
            }
        }
        window.location.href = '/login';
    }
}
