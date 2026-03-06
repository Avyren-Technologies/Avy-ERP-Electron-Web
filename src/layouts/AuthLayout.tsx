import { Outlet } from "react-router-dom";

export function AuthLayout() {
    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
            {/* Decorative Orbs */}
            <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] rounded-full bg-primary-400/20 blur-[120px]" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-accent-400/20 blur-[120px]" />
            <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] rounded-full bg-info-400/10 blur-[100px]" />

            {/* Content Area */}
            <div className="relative z-10 flex min-h-screen items-center justify-center p-6">
                <Outlet />
            </div>
        </div>
    );
}
