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

// ── Proactive token refresh ──

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

let isProactiveRefreshing = false;

/**
 * If the access token is about to expire, silently refresh it before the
 * request goes out. This avoids 401 round-trips for most requests.
 */
async function proactiveRefreshIfNeeded(): Promise<string | null> {
    const accessToken = getStoredAccessToken();
    if (!accessToken || !isTokenExpiringSoon(accessToken)) {
        return accessToken;
    }

    // Avoid duplicate proactive refreshes
    if (isProactiveRefreshing) return accessToken;
    isProactiveRefreshing = true;

    try {
        const storedRefreshToken = getStoredRefreshToken();
        if (!storedRefreshToken) return accessToken;

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

            return newTokens.accessToken;
        }
    } catch {
        // Proactive refresh failed — let the request proceed with the old token;
        // the response interceptor will handle the 401 if it actually expires.
    } finally {
        isProactiveRefreshing = false;
    }

    return accessToken;
}

// ── Request interceptor: attach Bearer token (with proactive refresh) ──

refreshClient.interceptors.request.use((config) => {
    config.headers['X-Device-Info'] = 'web';
    return config;
});

client.interceptors.request.use(
    async (config) => {
        config.headers['X-Device-Info'] = 'web';
        const token = await proactiveRefreshIfNeeded();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 + silent refresh ──

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value: unknown) => void;
    reject: (reason?: unknown) => void;
}> = [];

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

        // 403 — permission denied
        if (error.response?.status === 403) {
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

        if (isRefreshing) {
            // Queue this request until the refresh completes
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                return client(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const storedRefreshToken = getStoredRefreshToken();

        if (!storedRefreshToken) {
            isRefreshing = false;
            processQueue(error, null);
            clearAuthAndRedirect();
            return Promise.reject(error);
        }

        try {
            const { data } = await refreshClient.post('/auth/refresh-token', {
                refreshToken: storedRefreshToken,
            });

            if (data.success && data.data?.tokens) {
                const newTokens = data.data.tokens;
                localStorage.setItem('auth_tokens', JSON.stringify(newTokens));

                // Update the Zustand store if available
                try {
                    const { useAuthStore } = await import('@/store/useAuthStore');
                    useAuthStore.getState().updateTokens(newTokens);
                } catch {
                    // Store not available — tokens already saved to localStorage
                }

                originalRequest.headers.Authorization = `Bearer ${newTokens.accessToken}`;
                processQueue(null, newTokens.accessToken);
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
            isRefreshing = false;
        }
    },
);

function clearAuthAndRedirect() {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_role');
    // Redirect to login if not already there
    if (window.location.pathname !== '/login') {
        window.location.href = '/login';
    }
}
