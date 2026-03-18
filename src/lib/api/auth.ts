import { client } from './client';

// ── Types ──

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
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
    companyId?: string;
    tenantId?: string;
    permissions?: string[];
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
    const response = await client.post('/auth/logout');
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

export const authApi = {
    login,
    refreshToken,
    logout,
    forgotPassword,
    verifyResetCode,
    resetPassword,
    getProfile,
    changePassword,
};
