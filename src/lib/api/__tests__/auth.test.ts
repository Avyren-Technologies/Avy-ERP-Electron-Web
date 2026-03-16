import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from '@/lib/api/auth';

// ── Mock the axios client ─────────────────────────────────────────────────────
//
// auth.ts imports `client` from './client'. We mock the entire module so that
// no real HTTP calls are made and the request/response interceptors are skipped.

vi.mock('@/lib/api/client', () => ({
    client: {
        post: vi.fn(),
        get: vi.fn(),
    },
}));

// Pull the mocked instance so we can configure per-test return values.
import { client } from '@/lib/api/client';

const mockedPost = vi.mocked(client.post);
const mockedGet = vi.mocked(client.get);

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Wrap a value in the Axios-shaped { data: ... } envelope that auth.ts unwraps. */
function axiosResp<T>(payload: T) {
    return { data: payload };
}

const successEnvelope = { success: true, message: 'OK' };

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('authApi.login', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/login with email and password', async () => {
        const payload = {
            success: true,
            data: {
                user: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'SUPER_ADMIN' },
                tokens: { accessToken: 'at', refreshToken: 'rt', expiresIn: 3600 },
            },
        };
        mockedPost.mockResolvedValueOnce(axiosResp(payload));

        const result = await authApi.login('a@b.com', 's3cr3t');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/login', {
            email: 'a@b.com',
            password: 's3cr3t',
        });
        expect(result).toEqual(payload);
    });

    it('returns the raw API response including success flag', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp({ success: false, error: 'INVALID_CREDENTIALS' }));
        const result = await authApi.login('x@y.com', 'wrong');
        expect(result).toEqual({ success: false, error: 'INVALID_CREDENTIALS' });
    });
});

describe('authApi.refreshToken', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/refresh-token with the provided token', async () => {
        const payload = {
            success: true,
            data: { tokens: { accessToken: 'new-at', refreshToken: 'new-rt', expiresIn: 3600 } },
        };
        mockedPost.mockResolvedValueOnce(axiosResp(payload));

        const result = await authApi.refreshToken('my-refresh-token');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/refresh-token', {
            refreshToken: 'my-refresh-token',
        });
        expect(result).toEqual(payload);
    });
});

describe('authApi.logout', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/logout with no body', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));

        const result = await authApi.logout();

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/logout');
        expect(result).toEqual(successEnvelope);
    });
});

describe('authApi.forgotPassword', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/forgot-password with the email', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));

        await authApi.forgotPassword('user@example.com');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/forgot-password', {
            email: 'user@example.com',
        });
    });

    it('returns the API response', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await authApi.forgotPassword('user@example.com');
        expect(result).toEqual(successEnvelope);
    });
});

describe('authApi.verifyResetCode', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/verify-reset-code with email and code', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));

        await authApi.verifyResetCode('user@example.com', '123456');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/verify-reset-code', {
            email: 'user@example.com',
            code: '123456',
        });
    });

    it('returns the API response', async () => {
        const failEnvelope = { success: false, error: 'INVALID_CODE' };
        mockedPost.mockResolvedValueOnce(axiosResp(failEnvelope));
        const result = await authApi.verifyResetCode('user@example.com', 'bad');
        expect(result).toEqual(failEnvelope);
    });
});

describe('authApi.resetPassword', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/reset-password with email, code, and newPassword', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));

        await authApi.resetPassword('user@example.com', '123456', 'NewP@ss1');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/reset-password', {
            email: 'user@example.com',
            code: '123456',
            newPassword: 'NewP@ss1',
        });
    });

    it('returns the API response', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await authApi.resetPassword('user@example.com', '123456', 'NewP@ss1');
        expect(result).toEqual(successEnvelope);
    });
});

describe('authApi.getProfile', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /auth/profile', async () => {
        const profilePayload = {
            success: true,
            data: { id: '1', email: 'a@b.com', firstName: 'A', lastName: 'B', role: 'SUPER_ADMIN' },
        };
        mockedGet.mockResolvedValueOnce(axiosResp(profilePayload));

        const result = await authApi.getProfile();

        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/auth/profile');
        expect(result).toEqual(profilePayload);
    });

    it('does not call POST', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true }));
        await authApi.getProfile();
        expect(mockedPost).not.toHaveBeenCalled();
    });
});

describe('authApi.changePassword', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /auth/change-password with currentPassword and newPassword', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));

        await authApi.changePassword('OldP@ss1', 'NewP@ss2');

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/auth/change-password', {
            currentPassword: 'OldP@ss1',
            newPassword: 'NewP@ss2',
        });
    });

    it('returns the API response', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await authApi.changePassword('OldP@ss1', 'NewP@ss2');
        expect(result).toEqual(successEnvelope);
    });
});
