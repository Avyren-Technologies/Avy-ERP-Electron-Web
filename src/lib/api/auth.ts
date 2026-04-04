import { useQuery } from '@tanstack/react-query';
import { client } from './client';

// ── Types ──

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    meta?: any;
    message?: string;
    error?: string;
    code?: string;
}

export interface AuthUser {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    roleName?: string | null;
    companyId?: string;
    tenantId?: string;
    permissions?: string[];
    /** Present when returned from GET /auth/profile (and merged into session). */
    mfaEnabled?: boolean;
}

/** Unwrap GET /auth/profile envelope: `{ data: { user: AuthUser } }`. */
export function getAuthUserFromProfileResponse(res: ApiResponse<unknown>): AuthUser | null {
    const data = res?.data as { user?: AuthUser } | undefined;
    if (data?.user && typeof data.user === 'object') return data.user;
    return null;
}

/** Decode a JWT payload without verifying the signature (client-side read only). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
        const base64 = token.split('.')[1];
        if (!base64) return null;
        const decoded = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(decoded);
    } catch {
        return null;
    }
}

/** Permissions embedded in the access token (source of truth after refresh). */
export function parsePermissionsFromAccessToken(accessToken: string): string[] | undefined {
    const p = decodeJwtPayload(accessToken);
    if (!p || !Array.isArray(p.permissions)) return undefined;
    return p.permissions as string[];
}

/** Utility: check if a permission string is satisfied by the user's permissions array.
 *  Supports exact match, wildcard '*', and module wildcard 'module:*'.
 */
export function checkPermission(userPermissions: string[], required: string): boolean {
    if (userPermissions.includes('*')) return true;
    if (userPermissions.includes(required)) return true;
    const [module] = required.split(':');
    if (module && userPermissions.includes(`${module}:*`)) return true;
    return false;
}

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}

export interface LoginResponse {
    user: AuthUser;
    tokens: AuthTokens;
}

// ── API Functions ──

async function login(email: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
}

async function refreshToken(token: string): Promise<ApiResponse<{ tokens: AuthTokens }>> {
    const response = await client.post('/auth/refresh-token', { refreshToken: token });
    return response.data;
}

async function logout(): Promise<ApiResponse> {
    // Send refreshToken so the backend can remove the ActiveSession record
    const storedRefreshToken = (() => {
        try {
            const raw = localStorage.getItem('auth_tokens');
            return raw ? JSON.parse(raw).refreshToken : undefined;
        } catch { return undefined; }
    })();
    const response = await client.post('/auth/logout', { refreshToken: storedRefreshToken });
    return response.data;
}

async function forgotPassword(email: string): Promise<ApiResponse> {
    const response = await client.post('/auth/forgot-password', { email });
    return response.data;
}

async function verifyResetCode(email: string, code: string): Promise<ApiResponse> {
    const response = await client.post('/auth/verify-reset-code', { email, code });
    return response.data;
}

async function resetPassword(email: string, code: string, newPassword: string): Promise<ApiResponse> {
    const response = await client.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
}

async function getProfile(): Promise<ApiResponse<AuthUser>> {
    const response = await client.get('/auth/profile');
    return response.data;
}

async function changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    const response = await client.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
}

async function verifyMfa(mfaToken: string, code: string): Promise<ApiResponse<LoginResponse>> {
    const response = await client.post('/auth/mfa/verify', { mfaToken, code });
    return response.data;
}

async function setupMfa(): Promise<ApiResponse<{ secret: string; otpauthUrl: string; qrCodeDataUrl: string }>> {
    const response = await client.post('/auth/mfa/setup');
    return response.data;
}

async function confirmMfa(code: string): Promise<ApiResponse> {
    const response = await client.post('/auth/mfa/confirm', { code });
    return response.data;
}

async function disableMfa(password: string): Promise<ApiResponse> {
    const response = await client.post('/auth/mfa/disable', { password });
    return response.data;
}

export const authApi = {
    login,
    refreshToken,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    getProfile,
    changePassword,
    verifyMfa,
    setupMfa,
    confirmMfa,
    disableMfa,
};

// ── Tenant Branding ──

export interface TenantBranding {
    exists: boolean;
    companyName?: string;
    logoUrl?: string;
}

export async function fetchTenantBranding(slug: string): Promise<TenantBranding> {
    const response = await client.get('/auth/tenant-branding', { params: { slug } });
    return response.data?.data;
}

export function useTenantBranding(slug: string | null) {
    return useQuery({
        queryKey: ['tenant-branding', slug],
        queryFn: () => fetchTenantBranding(slug!),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
        retry: 1,
    });
}
