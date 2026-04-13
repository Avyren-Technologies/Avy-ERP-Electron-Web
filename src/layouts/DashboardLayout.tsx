// ============================================================
// DashboardLayout — Main application shell
// ============================================================
import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useNavigationManifest } from '@/features/company-admin/api';
import { usePermissionRefresh } from '@/hooks/usePermissionRefresh';
import { useSessionTimeout } from '@/hooks/useSessionTimeout';
import { initWebPushNotifications } from '@/lib/notifications';
import { useNotificationSocket } from '@/hooks/useNotificationSocket';

export function DashboardLayout() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { data: manifestData } = useNavigationManifest();

    // Auto-refresh permissions on dashboard load (picks up role changes without re-login)
    usePermissionRefresh();

    // Auto-logout after inactivity (respects company's sessionTimeoutMinutes from SystemControls)
    useSessionTimeout();

    // Initialize web push notifications after authentication
    useEffect(() => {
        initWebPushNotifications();
    }, []);

    // Subscribe to real-time notification:new socket events
    useNotificationSocket();

    // Extract manifest sections from API response envelope
    const manifestSections = manifestData?.data ?? (Array.isArray(manifestData) ? manifestData : undefined);

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--background)] dark:bg-neutral-950 transition-colors">
            {/* Nav Sidebar */}
            <Sidebar
                collapsed={sidebarCollapsed}
                onCollapse={setSidebarCollapsed}
                manifestSections={manifestSections}
            />

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 bg-[var(--background)] dark:bg-neutral-950 transition-colors">
                <TopBar sidebarCollapsed={sidebarCollapsed} />

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto">
                        <Outlet />
                    </div>
                </div>
            </main>
        </div>
    );
}
