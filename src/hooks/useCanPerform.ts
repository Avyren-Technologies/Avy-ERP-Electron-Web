import { useAuthStore } from '@/store/useAuthStore';
import { checkPermission } from '@/lib/api/auth';

/**
 * Hook for button-level permission checks.
 * Usage: const canCreate = useCanPerform('hr:create');
 */
export function useCanPerform(permission: string): boolean {
    const permissions = useAuthStore((s) => s.permissions);
    return checkPermission(permissions, permission);
}

/**
 * Returns a permission checker function for checking multiple permissions.
 * Usage: const can = usePermissionChecker(); can('hr:read');
 */
export function usePermissionChecker(): (permission: string) => boolean {
    const permissions = useAuthStore((s) => s.permissions);
    return (permission: string) => checkPermission(permissions, permission);
}
