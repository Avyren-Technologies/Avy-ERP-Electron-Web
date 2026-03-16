/**
 * Tests for src/lib/api/client.ts
 *
 * Architecture note:
 *   client.ts creates TWO axios instances at module load time:
 *     - `client`        — the main exported instance with request + response interceptors
 *     - `refreshClient` — a private instance used only for /auth/refresh-token calls
 *                          to avoid interceptor infinite loops
 *
 * Testing strategy:
 *   We mock the `axios` module so that `axios.create()` returns a controlled
 *   instance whose `post` and `get` methods are vi.fn().  This lets us control
 *   what `refreshClient.post(...)` returns without having access to the private
 *   variable, while still running the real interceptor logic.
 *
 *   Because the module must be reimported after the mock is in place (the
 *   interceptors are registered at import time), we use vi.resetModules() +
 *   dynamic import() for every test that exercises interceptor behaviour.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStore: Record<string, string> = {};

const localStorageMock = {
    getItem: vi.fn((key: string) => localStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { localStore[key] = value; }),
    removeItem: vi.fn((key: string) => { delete localStore[key]; }),
    clear: vi.fn(() => { Object.keys(localStore).forEach((k) => delete localStore[k]); }),
};

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// ── window.location mock ──────────────────────────────────────────────────────

const locationMock = { pathname: '/app/dashboard', href: 'http://localhost/app/dashboard' };
Object.defineProperty(global, 'window', {
    value: { location: locationMock },
    writable: true,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function storeTokens(access = 'at', refresh = 'rt') {
    const tokens = { accessToken: access, refreshToken: refresh, expiresIn: 3600 };
    localStore['auth_tokens'] = JSON.stringify(tokens);
    // also update the spy so getItem returns it
    localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);
}

function clearStorage() {
    Object.keys(localStore).forEach((k) => delete localStore[k]);
    localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);
}

/** Import a fresh copy of client.ts after resetting modules. */
async function freshClient() {
    vi.resetModules();
    const mod = await import('@/lib/api/client');
    return mod.client;
}

// ── Request interceptor ───────────────────────────────────────────────────────

describe('client — request interceptor', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
        locationMock.href = 'http://localhost/app/dashboard';
    });

    it('attaches Authorization header when a token is in localStorage', async () => {
        storeTokens('my-access-token');
        const c = await freshClient();

        let capturedAuthHeader: string | undefined;

        c.defaults.adapter = async (config: any) => {
            capturedAuthHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/test');
        expect(capturedAuthHeader).toBe('Bearer my-access-token');
    });

    it('omits Authorization header when no token is in localStorage', async () => {
        clearStorage();
        const c = await freshClient();

        let capturedAuthHeader: string | undefined;

        c.defaults.adapter = async (config: any) => {
            capturedAuthHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/test');
        expect(capturedAuthHeader).toBeUndefined();
    });
});

// ── Response interceptor — success pass-through ───────────────────────────────

describe('client — response interceptor (success)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
    });

    it('passes through successful responses unchanged', async () => {
        const c = await freshClient();

        c.defaults.adapter = async (config: any) => ({
            data: { success: true, data: { id: 1 } },
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
        });

        const response = await c.get('/test');
        expect(response.data).toEqual({ success: true, data: { id: 1 } });
        expect(response.status).toBe(200);
    });
});

// ── Response interceptor — non-TOKEN_EXPIRED 401 ─────────────────────────────

describe('client — response interceptor (non-TOKEN_EXPIRED errors)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
    });

    it('re-rejects 401 that does not have TOKEN_EXPIRED code', async () => {
        const c = await freshClient();

        c.defaults.adapter = async (config: any) => {
            const err: any = Object.assign(new Error('Forbidden'), {
                config,
                response: { status: 401, data: { code: 'FORBIDDEN' } },
                isAxiosError: true,
            });
            throw err;
        };

        await expect(c.get('/test')).rejects.toMatchObject({ response: { status: 401 } });
    });

    it('re-rejects 500 errors without attempting refresh', async () => {
        const c = await freshClient();

        c.defaults.adapter = async (config: any) => {
            const err: any = Object.assign(new Error('Server Error'), {
                config,
                response: { status: 500, data: {} },
                isAxiosError: true,
            });
            throw err;
        };

        await expect(c.get('/test')).rejects.toMatchObject({ response: { status: 500 } });
        // No auth tokens were removed — refresh was not attempted
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
});

// ── Response interceptor — TOKEN_EXPIRED, no refresh token ───────────────────

describe('client — response interceptor (TOKEN_EXPIRED, no refresh token)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
        locationMock.href = 'http://localhost/app/dashboard';
    });

    it('clears auth and redirects to /login', async () => {
        // No tokens in storage → getStoredRefreshToken returns null
        const c = await freshClient();

        c.defaults.adapter = async (config: any) => {
            const err: any = Object.assign(new Error('Unauthorized'), {
                config,
                response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
                isAxiosError: true,
            });
            throw err;
        };

        await expect(c.get('/test')).rejects.toBeDefined();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_tokens');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_role');
        expect(locationMock.href).toBe('/login');
    });

    it('does NOT update href when already on /login', async () => {
        locationMock.pathname = '/login';
        locationMock.href = 'http://localhost/login';

        const c = await freshClient();

        c.defaults.adapter = async (config: any) => {
            const err: any = Object.assign(new Error('Unauthorized'), {
                config,
                response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
                isAxiosError: true,
            });
            throw err;
        };

        await expect(c.get('/test')).rejects.toBeDefined();

        // href must remain 'http://localhost/login', not be reset via assignment
        // (we verify it was not changed from its pre-test value)
        expect(locationMock.href).toBe('http://localhost/login');
    });
});

// ── Response interceptor — TOKEN_EXPIRED, successful refresh ─────────────────
//
// This describe block CANNOT use vi.resetModules() per-test because we need to
// control `refreshClient` — the private axios instance created inside client.ts.
//
// Solution: mock the `axios` module so that axios.create() returns our
// controllable spy instance.  We use vi.resetModules() + reimport so that the
// mock is active when the module initialises.

describe('client — response interceptor (TOKEN_EXPIRED, successful refresh)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
        locationMock.href = 'http://localhost/app/dashboard';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('stores new tokens in localStorage after a successful refresh', async () => {
        storeTokens('expired-access', 'valid-refresh');

        vi.resetModules();

        const newTokens = { accessToken: 'fresh-at', refreshToken: 'fresh-rt', expiresIn: 3600 };

        // Mock axios so both axios.create() calls return a spy instance we control
        const refreshPost = vi.fn();
        const createSpy = vi.fn().mockImplementation(() => ({
            post: refreshPost,
            get: vi.fn(),
            interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
            defaults: { adapter: undefined, headers: {} },
        }));

        vi.doMock('axios', async (importOriginal) => {
            const actual: any = await importOriginal();
            // Handle CJS/ESM interop: axios may be at actual.default or actual directly
            const axiosInstance = actual.default ?? actual;
            // Keep the real axios.create for the main `client` instance (first call),
            // use our spy for refreshClient (second call).
            let callCount = 0;
            return {
                ...actual,
                default: {
                    ...axiosInstance,
                    create: (...args: any[]) => {
                        callCount++;
                        if (callCount === 2) {
                            // This is the refreshClient
                            return { post: refreshPost, get: vi.fn(), defaults: {} };
                        }
                        return axiosInstance.create(...args);
                    },
                },
            };
        });

        // reimport the module under test with the mock active
        const { client: c } = await import('@/lib/api/client');

        let requestCount = 0;
        c.defaults.adapter = async (config: any) => {
            requestCount++;
            if (requestCount === 1) {
                // First call: original request fails with TOKEN_EXPIRED
                const err: any = Object.assign(new Error('Unauthorized'), {
                    config,
                    response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
                    isAxiosError: true,
                });
                throw err;
            }
            // Second call: the retried original request succeeds
            return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
        };

        // refreshClient.post returns a successful refresh response
        refreshPost.mockResolvedValue({
            data: { success: true, data: { tokens: newTokens } },
        });

        await c.get('/some/resource');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'auth_tokens',
            JSON.stringify(newTokens),
        );
    });
});

// ── Response interceptor — TOKEN_EXPIRED, refresh fails ──────────────────────

describe('client — response interceptor (TOKEN_EXPIRED, refresh fails)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
        locationMock.href = 'http://localhost/app/dashboard';
    });

    it('clears auth and redirects when refresh API call throws', async () => {
        storeTokens('expired-access', 'valid-refresh');

        vi.resetModules();

        const refreshPost = vi.fn().mockRejectedValue(new Error('Refresh network error'));

        vi.doMock('axios', async (importOriginal) => {
            const actual: any = await importOriginal();
            const axiosInstance = actual.default ?? actual;
            let callCount = 0;
            return {
                ...actual,
                default: {
                    ...axiosInstance,
                    create: (...args: any[]) => {
                        callCount++;
                        if (callCount === 2) {
                            return { post: refreshPost, get: vi.fn(), defaults: {} };
                        }
                        return axiosInstance.create(...args);
                    },
                },
            };
        });

        const { client: c } = await import('@/lib/api/client');

        let requestCount = 0;
        c.defaults.adapter = async (config: any) => {
            requestCount++;
            if (requestCount === 1) {
                const err: any = Object.assign(new Error('Unauthorized'), {
                    config,
                    response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
                    isAxiosError: true,
                });
                throw err;
            }
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await expect(c.get('/resource')).rejects.toBeDefined();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_tokens');
        expect(locationMock.href).toBe('/login');
    });

    it('clears auth when refresh returns success:false', async () => {
        storeTokens('expired-access', 'valid-refresh');

        vi.resetModules();

        const refreshPost = vi.fn().mockResolvedValue({
            data: { success: false, error: 'INVALID_REFRESH_TOKEN' },
        });

        vi.doMock('axios', async (importOriginal) => {
            const actual: any = await importOriginal();
            const axiosInstance = actual.default ?? actual;
            let callCount = 0;
            return {
                ...actual,
                default: {
                    ...axiosInstance,
                    create: (...args: any[]) => {
                        callCount++;
                        if (callCount === 2) {
                            return { post: refreshPost, get: vi.fn(), defaults: {} };
                        }
                        return axiosInstance.create(...args);
                    },
                },
            };
        });

        const { client: c } = await import('@/lib/api/client');

        let requestCount = 0;
        c.defaults.adapter = async (config: any) => {
            requestCount++;
            if (requestCount === 1) {
                const err: any = Object.assign(new Error('Unauthorized'), {
                    config,
                    response: { status: 401, data: { code: 'TOKEN_EXPIRED' } },
                    isAxiosError: true,
                });
                throw err;
            }
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await expect(c.get('/resource')).rejects.toBeDefined();

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_tokens');
        expect(locationMock.href).toBe('/login');
    });

    it('accepts TOKEN_EXPIRED in error.data.error field (alternative backend format)', async () => {
        storeTokens('expired-access', 'valid-refresh');

        vi.resetModules();

        const newTokens = { accessToken: 'fresh-at2', refreshToken: 'fresh-rt2', expiresIn: 3600 };
        const refreshPost = vi.fn().mockResolvedValue({
            data: { success: true, data: { tokens: newTokens } },
        });

        vi.doMock('axios', async (importOriginal) => {
            const actual: any = await importOriginal();
            const axiosInstance = actual.default ?? actual;
            let callCount = 0;
            return {
                ...actual,
                default: {
                    ...axiosInstance,
                    create: (...args: any[]) => {
                        callCount++;
                        if (callCount === 2) {
                            return { post: refreshPost, get: vi.fn(), defaults: {} };
                        }
                        return axiosInstance.create(...args);
                    },
                },
            };
        });

        const { client: c } = await import('@/lib/api/client');

        let requestCount = 0;
        c.defaults.adapter = async (config: any) => {
            requestCount++;
            if (requestCount === 1) {
                // Uses 'error' field instead of 'code'
                const err: any = Object.assign(new Error('Unauthorized'), {
                    config,
                    response: { status: 401, data: { error: 'TOKEN_EXPIRED' } },
                    isAxiosError: true,
                });
                throw err;
            }
            return { data: { success: true }, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/resource');

        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'auth_tokens',
            JSON.stringify(newTokens),
        );
    });
});
