/**
 * Tests for src/lib/api/tenant.ts
 *
 * tenantApi wraps axios `client` calls and unwraps the Axios envelope
 * manually (`response.data`), returning the raw API payload to callers.
 *
 * Strategy: mock `@/lib/api/client` entirely so no real HTTP calls are made
 * and none of the request/response interceptors run.  The mock exposes
 * `post`, `get`, `patch`, `put`, and `delete` as vi.fn() so we can
 * control what each test returns.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tenantApi } from '@/lib/api/tenant';

// ── Mock the axios client ──────────────────────────────────────────────────────

vi.mock('@/lib/api/client', () => ({
    client: {
        post: vi.fn(),
        get: vi.fn(),
        patch: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
    },
}));

import { client } from '@/lib/api/client';

const mockedPost = vi.mocked(client.post);
const mockedGet = vi.mocked(client.get);
const mockedPatch = vi.mocked(client.patch);
const mockedPut = vi.mocked(client.put);
const mockedDelete = vi.mocked(client.delete);

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Wrap a value in the Axios-shaped { data: ... } envelope that tenant.ts
 * unwraps via `response.data`.
 */
function axiosResp<T>(payload: T) {
    return { data: payload };
}

const successEnvelope = { success: true, message: 'OK' };

// ── tenantApi.onboard ─────────────────────────────────────────────────────────

describe('tenantApi.onboard', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls POST /platform/tenants/onboard with the given payload', async () => {
        const payload = { companyName: 'Acme Corp', adminEmail: 'admin@acme.com' };
        const apiResponse = { success: true, data: { tenantId: 't-001' } };
        mockedPost.mockResolvedValueOnce(axiosResp(apiResponse));

        const result = await tenantApi.onboard(payload);

        expect(mockedPost).toHaveBeenCalledTimes(1);
        expect(mockedPost).toHaveBeenCalledWith('/platform/tenants/onboard', payload);
        expect(result).toEqual(apiResponse);
    });

    it('returns the raw API response including success flag', async () => {
        mockedPost.mockResolvedValueOnce(axiosResp({ success: false, error: 'VALIDATION_ERROR' }));
        const result = await tenantApi.onboard({});
        expect(result).toEqual({ success: false, error: 'VALIDATION_ERROR' });
    });

    it('propagates rejection when the client throws', async () => {
        mockedPost.mockRejectedValueOnce(new Error('Network error'));
        await expect(tenantApi.onboard({})).rejects.toThrow('Network error');
    });

    it('accepts an arbitrary payload shape (any)', async () => {
        const complexPayload = {
            identity: { name: 'TechCo', gstin: '27AAPFU0939F1ZV' },
            modules: ['hrm', 'crm'],
        };
        mockedPost.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.onboard(complexPayload);
        expect(mockedPost).toHaveBeenCalledWith('/platform/tenants/onboard', complexPayload);
    });
});

// ── tenantApi.listCompanies ───────────────────────────────────────────────────

describe('tenantApi.listCompanies', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/companies with no params when called with no arguments', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        await tenantApi.listCompanies();
        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies', { params: undefined });
    });

    it('forwards pagination params to the query string', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { page: 2, limit: 20 };
        await tenantApi.listCompanies(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies', { params });
    });

    it('forwards search and status filters', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { search: 'acme', status: 'Active' };
        await tenantApi.listCompanies(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies', { params });
    });

    it('forwards all params together', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: [] }));
        const params = { page: 1, limit: 10, search: 'tech', status: 'Pilot' };
        await tenantApi.listCompanies(params);
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies', { params });
    });

    it('returns the unwrapped API payload', async () => {
        const payload = { success: true, data: [{ id: 'c-1', name: 'Corp A' }] };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));
        const result = await tenantApi.listCompanies();
        expect(result).toEqual(payload);
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Timeout'));
        await expect(tenantApi.listCompanies()).rejects.toThrow('Timeout');
    });
});

// ── tenantApi.getCompanyDetail ────────────────────────────────────────────────

describe('tenantApi.getCompanyDetail', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls GET /platform/companies/:id with the given companyId', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: { id: 'c-42' } }));
        await tenantApi.getCompanyDetail('c-42');
        expect(mockedGet).toHaveBeenCalledTimes(1);
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies/c-42');
    });

    it('interpolates the companyId correctly in the URL', async () => {
        mockedGet.mockResolvedValueOnce(axiosResp({ success: true, data: {} }));
        await tenantApi.getCompanyDetail('my-special-uuid-123');
        expect(mockedGet).toHaveBeenCalledWith('/platform/companies/my-special-uuid-123');
    });

    it('returns the unwrapped API payload', async () => {
        const payload = { success: true, data: { id: 'c-42', name: 'Acme', status: 'Active' } };
        mockedGet.mockResolvedValueOnce(axiosResp(payload));
        const result = await tenantApi.getCompanyDetail('c-42');
        expect(result).toEqual(payload);
    });

    it('propagates rejection when the client throws', async () => {
        mockedGet.mockRejectedValueOnce(new Error('Not Found'));
        await expect(tenantApi.getCompanyDetail('c-99')).rejects.toThrow('Not Found');
    });
});

// ── tenantApi.updateSection ───────────────────────────────────────────────────

describe('tenantApi.updateSection', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls PATCH /platform/companies/:id/sections/:key with data', async () => {
        const data = { legalName: 'Acme Ltd' };
        mockedPatch.mockResolvedValueOnce(axiosResp(successEnvelope));

        await tenantApi.updateSection('c-1', 'identity', data);

        expect(mockedPatch).toHaveBeenCalledTimes(1);
        expect(mockedPatch).toHaveBeenCalledWith(
            '/platform/companies/c-1/sections/identity',
            data,
        );
    });

    it('interpolates both companyId and sectionKey in the URL', async () => {
        mockedPatch.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.updateSection('company-xyz', 'fiscal-calendar', { year: 2025 });
        expect(mockedPatch).toHaveBeenCalledWith(
            '/platform/companies/company-xyz/sections/fiscal-calendar',
            { year: 2025 },
        );
    });

    it('returns the unwrapped API payload', async () => {
        mockedPatch.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await tenantApi.updateSection('c-1', 'address', {});
        expect(result).toEqual(successEnvelope);
    });

    it('propagates rejection when the client throws', async () => {
        mockedPatch.mockRejectedValueOnce(new Error('Forbidden'));
        await expect(tenantApi.updateSection('c-1', 'identity', {})).rejects.toThrow('Forbidden');
    });

    it('does not call any other HTTP method', async () => {
        mockedPatch.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.updateSection('c-1', 'identity', {});
        expect(mockedPost).not.toHaveBeenCalled();
        expect(mockedPut).not.toHaveBeenCalled();
        expect(mockedGet).not.toHaveBeenCalled();
        expect(mockedDelete).not.toHaveBeenCalled();
    });
});

// ── tenantApi.updateStatus ────────────────────────────────────────────────────

describe('tenantApi.updateStatus', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls PUT /platform/companies/:id/status with { status }', async () => {
        mockedPut.mockResolvedValueOnce(axiosResp(successEnvelope));

        await tenantApi.updateStatus('c-1', 'Active');

        expect(mockedPut).toHaveBeenCalledTimes(1);
        expect(mockedPut).toHaveBeenCalledWith('/platform/companies/c-1/status', {
            status: 'Active',
        });
    });

    it('wraps the status string in a { status } body', async () => {
        mockedPut.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.updateStatus('c-99', 'Inactive');
        expect(mockedPut).toHaveBeenCalledWith('/platform/companies/c-99/status', {
            status: 'Inactive',
        });
    });

    it('returns the unwrapped API payload', async () => {
        mockedPut.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await tenantApi.updateStatus('c-1', 'Draft');
        expect(result).toEqual(successEnvelope);
    });

    it('propagates rejection when the client throws', async () => {
        mockedPut.mockRejectedValueOnce(new Error('Server Error'));
        await expect(tenantApi.updateStatus('c-1', 'Active')).rejects.toThrow('Server Error');
    });

    it('does not call any other HTTP method', async () => {
        mockedPut.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.updateStatus('c-1', 'Active');
        expect(mockedPost).not.toHaveBeenCalled();
        expect(mockedGet).not.toHaveBeenCalled();
        expect(mockedPatch).not.toHaveBeenCalled();
        expect(mockedDelete).not.toHaveBeenCalled();
    });
});

// ── tenantApi.deleteCompany ───────────────────────────────────────────────────

describe('tenantApi.deleteCompany', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls DELETE /platform/companies/:id with the given companyId', async () => {
        mockedDelete.mockResolvedValueOnce(axiosResp(successEnvelope));

        await tenantApi.deleteCompany('c-1');

        expect(mockedDelete).toHaveBeenCalledTimes(1);
        expect(mockedDelete).toHaveBeenCalledWith('/platform/companies/c-1');
    });

    it('interpolates the companyId correctly in the URL', async () => {
        mockedDelete.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.deleteCompany('company-uuid-abc');
        expect(mockedDelete).toHaveBeenCalledWith('/platform/companies/company-uuid-abc');
    });

    it('returns the unwrapped API payload', async () => {
        mockedDelete.mockResolvedValueOnce(axiosResp(successEnvelope));
        const result = await tenantApi.deleteCompany('c-1');
        expect(result).toEqual(successEnvelope);
    });

    it('propagates rejection when the client throws', async () => {
        mockedDelete.mockRejectedValueOnce(new Error('Not Found'));
        await expect(tenantApi.deleteCompany('c-999')).rejects.toThrow('Not Found');
    });

    it('does not call any other HTTP method', async () => {
        mockedDelete.mockResolvedValueOnce(axiosResp(successEnvelope));
        await tenantApi.deleteCompany('c-1');
        expect(mockedPost).not.toHaveBeenCalled();
        expect(mockedGet).not.toHaveBeenCalled();
        expect(mockedPatch).not.toHaveBeenCalled();
        expect(mockedPut).not.toHaveBeenCalled();
    });
});
