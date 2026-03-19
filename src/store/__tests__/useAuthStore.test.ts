import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
    useAuthStore,
    mapBackendRole,
    getAccessToken,
    getRefreshToken,
    hydrateAuth,
} from '@/store/useAuthStore';
import type { AuthTokens, AuthUser } from '@/lib/api/auth';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTokens: AuthTokens = {
    accessToken: 'access-token-abc',
    refreshToken: 'refresh-token-xyz',
    expiresIn: 3600,
};

const mockUser: AuthUser = {
    id: 'user-1',
    email: 'admin@avy.com',
    firstName: 'Avy',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
    companyId: 'company-1',
};

// ── localStorage mock ─────────────────────────────────────────────────────────

// jsdom provides a real localStorage implementation; we spy on it so we can
// assert calls and clear state between tests without replacing the entire object.
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] ?? null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; }),
        get length() { return Object.keys(store).length; },
        key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    };
})();

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: false,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
    useAuthStore.setState({ status: 'idle', token: null, user: null, userRole: null });
}

// ── Test suite ────────────────────────────────────────────────────────────────

describe('mapBackendRole', () => {
    it('maps SUPER_ADMIN to super-admin', () => {
        expect(mapBackendRole('SUPER_ADMIN')).toBe('super-admin');
    });

    it('maps COMPANY_ADMIN to company-admin', () => {
        expect(mapBackendRole('COMPANY_ADMIN')).toBe('company-admin');
    });

    it('maps any unknown string to user', () => {
        expect(mapBackendRole('EMPLOYEE')).toBe('user');
        expect(mapBackendRole('')).toBe('user');
        expect(mapBackendRole('admin')).toBe('user');
    });
});

describe('useAuthStore — initial state', () => {
    beforeEach(() => {
        localStorageMock.clear();
        resetStore();
    });

    it('starts with idle status and all nulls', () => {
        const { status, token, user, userRole } = useAuthStore.getState();
        expect(status).toBe('idle');
        expect(token).toBeNull();
        expect(user).toBeNull();
        expect(userRole).toBeNull();
    });
});

describe('useAuthStore — signIn', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        resetStore();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('sets status to signIn and stores the accessToken', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        const { status, token } = useAuthStore.getState();
        expect(status).toBe('signIn');
        expect(token).toBe(mockTokens.accessToken);
    });

    it('stores the user object', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('derives userRole from user.role when no explicit role is passed', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        // mockUser.role is 'SUPER_ADMIN' → should map to 'super-admin'
        expect(useAuthStore.getState().userRole).toBe('super-admin');
    });

    it('uses the explicit role argument when supplied', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser, 'company-admin');
        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });

    it('persists tokens JSON to localStorage', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'auth_tokens',
            JSON.stringify(mockTokens),
        );
    });

    it('persists user JSON to localStorage', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'auth_user',
            JSON.stringify(mockUser),
        );
    });

    it('persists the role string to localStorage', () => {
        useAuthStore.getState().signIn(mockTokens, mockUser);
        expect(localStorageMock.setItem).toHaveBeenCalledWith('user_role', 'super-admin');
    });

    it('maps COMPANY_ADMIN role correctly when role is inferred from user', () => {
        const companyAdminUser: AuthUser = { ...mockUser, role: 'COMPANY_ADMIN' };
        useAuthStore.getState().signIn(mockTokens, companyAdminUser);
        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });
});

describe('useAuthStore — signOut', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        // Pre-populate store as signed-in
        useAuthStore.getState().signIn(mockTokens, mockUser);
        vi.clearAllMocks(); // reset call counts after signIn
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('sets status to signOut', () => {
        useAuthStore.getState().signOut();
        expect(useAuthStore.getState().status).toBe('signOut');
    });

    it('clears token, user, and userRole from store', () => {
        useAuthStore.getState().signOut();
        const { token, user, userRole } = useAuthStore.getState();
        expect(token).toBeNull();
        expect(user).toBeNull();
        expect(userRole).toBeNull();
    });

    it('removes auth_tokens from localStorage', () => {
        useAuthStore.getState().signOut();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_tokens');
    });

    it('removes auth_user from localStorage', () => {
        useAuthStore.getState().signOut();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_user');
    });

    it('removes user_role from localStorage', () => {
        useAuthStore.getState().signOut();
        expect(localStorageMock.removeItem).toHaveBeenCalledWith('user_role');
    });
});

describe('useAuthStore — updateTokens', () => {
    const newTokens: AuthTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresIn: 7200,
    };

    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        useAuthStore.getState().signIn(mockTokens, mockUser);
        vi.clearAllMocks();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('updates the token in store to the new accessToken', () => {
        useAuthStore.getState().updateTokens(newTokens);
        expect(useAuthStore.getState().token).toBe('new-access-token');
    });

    it('persists new tokens JSON to localStorage', () => {
        useAuthStore.getState().updateTokens(newTokens);
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
            'auth_tokens',
            JSON.stringify(newTokens),
        );
    });

    it('does not change user or status', () => {
        useAuthStore.getState().updateTokens(newTokens);
        const { user, status } = useAuthStore.getState();
        expect(user).toEqual(mockUser);
        expect(status).toBe('signIn');
    });

    it('does not change userRole', () => {
        useAuthStore.getState().updateTokens(newTokens);
        expect(useAuthStore.getState().userRole).toBe('super-admin');
    });
});

describe('getAccessToken / getRefreshToken static helpers', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('getAccessToken returns the stored accessToken', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        expect(getAccessToken()).toBe(mockTokens.accessToken);
    });

    it('getAccessToken returns null when no tokens in storage', () => {
        expect(getAccessToken()).toBeNull();
    });

    it('getAccessToken returns null when stored JSON is malformed', () => {
        localStorageMock.setItem('auth_tokens', 'not-valid-json{{{');
        expect(getAccessToken()).toBeNull();
    });

    it('getAccessToken returns null when accessToken key is absent', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify({ refreshToken: 'r' }));
        expect(getAccessToken()).toBeNull();
    });

    it('getRefreshToken returns the stored refreshToken', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        expect(getRefreshToken()).toBe(mockTokens.refreshToken);
    });

    it('getRefreshToken returns null when no tokens in storage', () => {
        expect(getRefreshToken()).toBeNull();
    });

    it('getRefreshToken returns null when stored JSON is malformed', () => {
        localStorageMock.setItem('auth_tokens', 'not-valid-json{{{');
        expect(getRefreshToken()).toBeNull();
    });

    it('getRefreshToken returns null when refreshToken key is absent', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify({ accessToken: 'a' }));
        expect(getRefreshToken()).toBeNull();
    });
});

describe('hydrateAuth', () => {
    beforeEach(() => {
        localStorageMock.clear();
        resetStore();
    });

    afterEach(() => {
        localStorageMock.clear();
    });

    it('sets status signIn when tokens exist in storage', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'super-admin');
        hydrateAuth();
        expect(useAuthStore.getState().status).toBe('signIn');
    });

    it('loads accessToken from storage into store', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        hydrateAuth();
        expect(useAuthStore.getState().token).toBe(mockTokens.accessToken);
    });

    it('loads user from storage into store', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        hydrateAuth();
        expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('uses stored role string directly when available', () => {
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'company-admin');
        hydrateAuth();
        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });

    it('falls back to mapBackendRole(user.role) when user_role not stored', () => {
        const companyUser: AuthUser = { ...mockUser, role: 'COMPANY_ADMIN' };
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        localStorageMock.setItem('auth_user', JSON.stringify(companyUser));
        // no user_role in storage
        hydrateAuth();
        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });

    it('falls back to super-admin when neither role nor user are stored', () => {
        // Only tokens — no user, no role
        localStorageMock.setItem('auth_tokens', JSON.stringify(mockTokens));
        hydrateAuth();
        expect(useAuthStore.getState().userRole).toBe('super-admin');
    });

    it('sets status signOut when no tokens in storage', () => {
        hydrateAuth();
        expect(useAuthStore.getState().status).toBe('signOut');
    });

    it('sets status signOut on malformed JSON in storage', () => {
        localStorageMock.setItem('auth_tokens', '{not-json');
        hydrateAuth();
        expect(useAuthStore.getState().status).toBe('signOut');
    });
});
