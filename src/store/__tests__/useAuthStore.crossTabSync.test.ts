/**
 * Tests for initCrossTabSync() in src/store/useAuthStore.ts
 *
 * initCrossTabSync() registers a 'storage' event listener on `window`.
 * The storage event fires in *other* browser tabs when they write to
 * localStorage — not in the current tab — so we simulate it by dispatching
 * a CustomEvent that mimics StorageEvent's shape.
 *
 * jsdom's StorageEvent constructor does not accept a plain-object
 * `storageArea`, so we use a CustomEvent carrying the relevant fields
 * and dispatch it manually.  The listener in initCrossTabSync reads
 * `event.key` and `event.newValue`, which are set on StorageEvent.  Since
 * jsdom does NOT let us construct StorageEvent with storageArea, we
 * fire a real StorageEvent but without the storageArea field — jsdom accepts
 * that form.
 *
 * Two scenarios are covered:
 *   A. auth_tokens removed (newValue === null)  → signOut should be called
 *   B. auth_tokens written (newValue !== null)  → store should adopt new session
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initCrossTabSync, useAuthStore } from '@/store/useAuthStore';
import type { AuthTokens, AuthUser } from '@/lib/api/auth';

// ── localStorage mock ─────────────────────────────────────────────────────────

const localStore: Record<string, string> = {};

const localStorageMock = {
    getItem: vi.fn((key: string) => localStore[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { localStore[key] = value; }),
    removeItem: vi.fn((key: string) => { delete localStore[key]; }),
    clear: vi.fn(() => { Object.keys(localStore).forEach((k) => delete localStore[k]); }),
    get length() { return Object.keys(localStore).length; },
    key: vi.fn((i: number) => Object.keys(localStore)[i] ?? null),
};

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// ── Fixtures ──────────────────────────────────────────────────────────────────

const mockTokens: AuthTokens = {
    accessToken: 'at-abc',
    refreshToken: 'rt-xyz',
    expiresIn: 3600,
};

const mockUser: AuthUser = {
    id: 'u-1',
    email: 'admin@avy.com',
    firstName: 'Avy',
    lastName: 'Admin',
    role: 'SUPER_ADMIN',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function resetStore() {
    useAuthStore.setState({
        status: 'idle',
        token: null,
        user: null,
        userRole: null,
        permissions: [],
    });
}

/**
 * Fire a synthetic storage event on window.
 *
 * jsdom accepts StorageEvent without a storageArea argument.
 * We omit storageArea because passing our mock object causes a TypeError
 * (jsdom validates the storageArea type against the Storage WebIDL interface).
 */
function fireStorageEvent(key: string, newValue: string | null, oldValue: string | null = null) {
    const event = new StorageEvent('storage', { key, newValue, oldValue });
    window.dispatchEvent(event);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('initCrossTabSync — auth_tokens removed in another tab', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        // Start in a signed-in state
        useAuthStore.getState().signIn(mockTokens, mockUser);
        vi.clearAllMocks(); // reset call counts after signIn
        initCrossTabSync();
    });

    afterEach(() => {
        localStorageMock.clear();
        resetStore();
    });

    it('signs out the current tab when auth_tokens is removed in another tab', () => {
        expect(useAuthStore.getState().status).toBe('signIn');

        fireStorageEvent('auth_tokens', null, JSON.stringify(mockTokens));

        expect(useAuthStore.getState().status).toBe('signOut');
    });

    it('clears the token in the store after cross-tab logout', () => {
        fireStorageEvent('auth_tokens', null, JSON.stringify(mockTokens));

        expect(useAuthStore.getState().token).toBeNull();
    });

    it('clears the user in the store after cross-tab logout', () => {
        fireStorageEvent('auth_tokens', null, JSON.stringify(mockTokens));

        expect(useAuthStore.getState().user).toBeNull();
    });

    it('clears userRole in the store after cross-tab logout', () => {
        fireStorageEvent('auth_tokens', null, JSON.stringify(mockTokens));

        expect(useAuthStore.getState().userRole).toBeNull();
    });

    it('does NOT sign out when an unrelated storage key changes', () => {
        fireStorageEvent('some_other_key', null, 'old-value');

        // Status should remain signIn — unrelated key must not trigger signOut
        expect(useAuthStore.getState().status).toBe('signIn');
    });

    it('does NOT sign out when auth_tokens is set to a non-null value', () => {
        const newTokens = { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 3600 };
        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), JSON.stringify(mockTokens));

        // newValue !== null → this is the sign-in branch, not the sign-out branch
        expect(useAuthStore.getState().status).toBe('signIn');
    });
});

describe('initCrossTabSync — auth_tokens written in another tab (cross-tab sign-in)', () => {
    beforeEach(() => {
        localStorageMock.clear();
        vi.clearAllMocks();
        resetStore();
        initCrossTabSync();
    });

    afterEach(() => {
        localStorageMock.clear();
        resetStore();
    });

    it('sets status to signIn when another tab writes a new auth_tokens value', () => {
        const newTokens = { accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 3600 };

        // Place matching user/role data in localStorage (as another tab would have done)
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'super-admin');

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().status).toBe('signIn');
    });

    it('stores the new accessToken in the store', () => {
        const newTokens = { accessToken: 'at-from-other-tab', refreshToken: 'rt-new', expiresIn: 3600 };
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'super-admin');

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().token).toBe('at-from-other-tab');
    });

    it('loads the user from localStorage when another tab signs in', () => {
        const newTokens = { accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 3600 };
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'super-admin');

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('picks up the stored role when another tab signs in', () => {
        const newTokens = { accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 3600 };
        localStorageMock.setItem('auth_user', JSON.stringify(mockUser));
        localStorageMock.setItem('user_role', 'company-admin');

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });

    it('falls back to mapBackendRole(user.role) when user_role is not in localStorage', () => {
        const newTokens = { accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 3600 };
        const companyAdminUser: AuthUser = { ...mockUser, role: 'COMPANY_ADMIN' };
        localStorageMock.setItem('auth_user', JSON.stringify(companyAdminUser));
        // intentionally no user_role key

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().userRole).toBe('company-admin');
    });

    it('does not throw and leaves store unchanged when the new auth_tokens value is malformed JSON', () => {
        // Should silently ignore the error, not throw
        expect(() => {
            fireStorageEvent('auth_tokens', '{not-valid-json', null);
        }).not.toThrow();

        // Store should remain in its prior state (idle), not transition to signIn
        const { status } = useAuthStore.getState();
        expect(status).not.toBe('signIn');
    });

    it('uses "user" as the fallback role when neither user_role nor auth_user are in storage', () => {
        const newTokens = { accessToken: 'at-new', refreshToken: 'rt-new', expiresIn: 3600 };
        // No auth_user, no user_role in storage

        fireStorageEvent('auth_tokens', JSON.stringify(newTokens), null);

        expect(useAuthStore.getState().userRole).toBe('user');
    });
});

describe('initCrossTabSync — window is undefined (SSR guard)', () => {
    it('returns early and does not throw when window is undefined', () => {
        const originalWindow = globalThis.window;
        // @ts-expect-error intentionally set window to undefined to test guard
        globalThis.window = undefined;

        expect(() => initCrossTabSync()).not.toThrow();

        globalThis.window = originalWindow;
    });
});
