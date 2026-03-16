import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

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

// ── Request interceptor: attach Bearer token ──

client.interceptors.request.use(
    (config) => {
        const token = getStoredAccessToken();
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
