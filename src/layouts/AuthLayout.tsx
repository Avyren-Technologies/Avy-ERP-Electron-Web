import { Outlet } from "react-router-dom";

export function AuthLayout() {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950 transition-colors duration-500">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-400/20 dark:bg-primary-600/10 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-accent-400/20 dark:bg-accent-600/10 blur-[120px]" />
            <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-info-400/10 dark:bg-info-600/10 blur-[100px]" />

            {/* Content Area */}
            <div className="relative z-10 min-h-screen">
                <Outlet />
            </div>
        </div>
    );
}
