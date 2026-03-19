/**
 * Tests for the proactive token refresh logic in src/lib/api/client.ts
 *
 * `isTokenExpiringSoon` is a private helper inside client.ts that drives
 * `proactiveRefreshIfNeeded()`, called by the request interceptor.
 *
 * Testing strategy:
 *   We cannot control `refreshClient` (private instance) without the
 *   vi.doMock('axios') trick, which is unreliable in this environment
 *   (the pre-existing client.test.ts also has the same limitation for those
 *   tests).  Instead we test the observable effect of `isTokenExpiringSoon`
 *   through the request interceptor:
 *
 *     - We use vi.resetModules() + dynamic import() (same as the working
 *       tests in client.test.ts) to get a fresh client with real interceptors.
 *     - We use c.defaults.adapter to capture outgoing headers.
 *     - For "non-expiring" vs "expiring" we check whether the Authorization
 *       header matches the original token or a refreshed one.
 *     - For cases where a proactive refresh WOULD be attempted, we verify the
 *       absence of side effects (e.g. no localStorage.setItem when the token
 *       is not expiring soon).
 *
 * JWT construction:
 *   We build minimal JWTs (header.payload.signature) using btoa() so that
 *   the atob() call inside isTokenExpiringSoon can parse the exp field.
 *
 * Note on proactive refresh network calls:
 *   Tests that exercise the branch where refreshClient.post is called (token
 *   IS expiring soon) rely on the fact that the proactive refresh failure is
 *   silently swallowed and the original token is used as fallback.  The
 *   refreshClient will make a real network call in jsdom (which will fail /
 *   hang), but the try/catch in proactiveRefreshIfNeeded handles that — the
 *   token attached to the request is the original expiring token.
 *   We verify this silent-fallback behaviour.
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

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// ── window mock ───────────────────────────────────────────────────────────────

const locationMock = { pathname: '/app/dashboard', href: 'http://localhost/app/dashboard' };
Object.defineProperty(globalThis, 'window', {
    value: { location: locationMock },
    writable: true,
});

// ── JWT helpers ───────────────────────────────────────────────────────────────

/** Build a minimal JWT with an exp field that atob() in client.ts can parse. */
function makeJwt(expTimestamp: number): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({ sub: 'u-1', exp: expTimestamp }));
    return `${header}.${payload}.fake-sig`;
}

/** Token that expires `secondsFromNow` seconds in the future. */
function tokenExpiringIn(secondsFromNow: number): string {
    return makeJwt(Math.floor(Date.now() / 1000) + secondsFromNow);
}

// ── Storage helpers ───────────────────────────────────────────────────────────

function storeTokens(accessToken: string, refreshToken = 'rt-valid') {
    localStore['auth_tokens'] = JSON.stringify({ accessToken, refreshToken, expiresIn: 3600 });
    localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);
}

function clearStorage() {
    Object.keys(localStore).forEach((k) => delete localStore[k]);
    localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);
}

/** Import a fresh copy of client.ts after resetting the module registry. */
async function freshClient() {
    vi.resetModules();
    const mod = await import('@/lib/api/client');
    return mod.client;
}

// ── Tests: non-expiring token — no proactive refresh ─────────────────────────

describe('client — proactive refresh (token NOT expiring soon)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('attaches the existing token unchanged when it expires in 5 minutes', async () => {
        // 300 s = 5 min — well outside the 60-second threshold
        const accessToken = tokenExpiringIn(300);
        storeTokens(accessToken);

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/test');

        expect(capturedHeader).toBe(`Bearer ${accessToken}`);
        // No new tokens were stored — no refresh happened
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('attaches the existing token unchanged when it expires in 61 seconds', async () => {
        // 61 s — just outside the 60-second proactive threshold
        const accessToken = tokenExpiringIn(61);
        storeTokens(accessToken);

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/test');

        expect(capturedHeader).toBe(`Bearer ${accessToken}`);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('attaches the existing token unchanged for a freshly-minted token (exp 1 hour away)', async () => {
        const accessToken = tokenExpiringIn(3600);
        storeTokens(accessToken);

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/api/data');

        expect(capturedHeader).toBe(`Bearer ${accessToken}`);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });
});

// ── Tests: token IS expiring soon — proactive refresh is attempted ────────────

describe('client — proactive refresh (token expiring soon, silent fallback)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('falls through with the old token (does not throw) when the refresh network call fails', async () => {
        // A token expiring in 30 s is inside the 60 s threshold
        const expiringToken = tokenExpiringIn(30);
        storeTokens(expiringToken, 'rt-ok');

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        // The proactive refresh will attempt a real network call to
        // POST /auth/refresh-token which fails in jsdom (no server).
        // proactiveRefreshIfNeeded() catches this and falls back to the old token.
        await expect(c.get('/resource')).resolves.toBeDefined();

        // The original expiring token is still attached as best-effort
        expect(capturedHeader).toBe(`Bearer ${expiringToken}`);

        // Auth storage must NOT be cleared — this is a proactive failure,
        // not a server-side 401 rejection.
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('does not throw when the token expires in exactly 1 second', async () => {
        const expiringToken = tokenExpiringIn(1);
        storeTokens(expiringToken, 'rt-ok');

        const c = await freshClient();

        c.defaults.adapter = async (config: any) => ({
            data: {}, status: 200, statusText: 'OK', headers: {}, config,
        });

        // Should resolve (not throw) even when the token is about to expire
        await expect(c.get('/resource')).resolves.toBeDefined();
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });

    it('does not attempt proactive refresh when no refresh token is stored', async () => {
        // Access token is expiring, but no refresh token → should not call refresh API
        const expiringToken = tokenExpiringIn(20);
        localStore['auth_tokens'] = JSON.stringify({
            accessToken: expiringToken,
            // refreshToken intentionally absent
            expiresIn: 3600,
        });
        localStorageMock.getItem.mockImplementation((key: string) => localStore[key] ?? null);

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/resource');

        // Token is still attached — no redirect, no storage clear
        expect(capturedHeader).toBe(`Bearer ${expiringToken}`);
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
});

// ── Tests: isTokenExpiringSoon — malformed / edge-case tokens ─────────────────

describe('client — isTokenExpiringSoon (malformed tokens → safe fallback, no refresh)', () => {
    beforeEach(() => {
        clearStorage();
        vi.clearAllMocks();
        locationMock.pathname = '/app/dashboard';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('does not try to refresh when the token is a plain string (not a JWT)', async () => {
        storeTokens('not-a-valid-jwt', 'rt-ok');

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/resource');

        // isTokenExpiringSoon returns false on parse error → no refresh
        // → original (invalid) token is attached unchanged
        expect(capturedHeader).toBe('Bearer not-a-valid-jwt');
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('does not try to refresh when the JWT payload has no exp field', async () => {
        // Build a JWT with a payload that omits `exp`
        const header = btoa(JSON.stringify({ alg: 'HS256' }));
        const payload = btoa(JSON.stringify({ sub: 'u-1' })); // no exp
        const noExpToken = `${header}.${payload}.sig`;
        storeTokens(noExpToken, 'rt-ok');

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/resource');

        // exp is undefined → `undefined * 1000` is NaN → Date.now() > NaN is false
        // → isTokenExpiringSoon returns false → no refresh
        expect(capturedHeader).toBe(`Bearer ${noExpToken}`);
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('omits Authorization header and does not refresh when no token is stored', async () => {
        clearStorage(); // nothing in localStorage

        const c = await freshClient();

        let capturedHeader: string | undefined;
        c.defaults.adapter = async (config: any) => {
            capturedHeader = config.headers['Authorization'];
            return { data: {}, status: 200, statusText: 'OK', headers: {}, config };
        };

        await c.get('/resource');

        expect(capturedHeader).toBeUndefined();
        expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('treats an already-expired token (exp in the past) as expiring soon and falls through', async () => {
        // An already-expired token: exp is 5 minutes ago
        const expiredToken = makeJwt(Math.floor(Date.now() / 1000) - 300);
        storeTokens(expiredToken, 'rt-ok');

        const c = await freshClient();

        c.defaults.adapter = async (config: any) => ({
            data: {}, status: 200, statusText: 'OK', headers: {}, config,
        });

        // Should resolve — proactive refresh attempt fails silently, original token used
        await expect(c.get('/resource')).resolves.toBeDefined();
        expect(localStorageMock.removeItem).not.toHaveBeenCalled();
    });
});

