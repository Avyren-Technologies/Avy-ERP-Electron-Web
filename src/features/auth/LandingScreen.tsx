import { useNavigate } from "react-router-dom";
import { ArrowRight, Box, ShieldCheck, Zap } from "lucide-react";

export function LandingScreen() {
    const navigate = useNavigate();

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 border border-primary-200 shadow-sm mb-8 backdrop-blur-md">
                <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-900">
                    Avyren ERP Super Admin
                </span>
            </div>

            {/* Hero Text */}
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 mb-6 drop-shadow-sm">
                Enterprise Management, <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500">
                    Perfected.
                </span>
            </h1>

            <p className="text-lg md:text-xl text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                The centralized hub to monitor platform health, manage tenant lifecycle, and configure global module access across the Avyren ecosystem.
            </p>

            {/* CTA */}
            <button
                onClick={() => navigate("/login")}
                className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 bg-primary-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/30 overflow-hidden transition-all hover:scale-[1.02] hover:shadow-primary-500/40"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative">Access Dashboard</span>
                <ArrowRight className="relative w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Feature Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full text-left">
                <div className="p-6 rounded-3xl bg-white/70 border border-white/40 shadow-xl shadow-neutral-200/50 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                        <ShieldCheck className="w-6 h-6 text-primary-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Tenant Control</h3>
                    <p className="text-sm text-neutral-600">Provision isolated environments, assign custom server endpoints, and manage subscription limits.</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/70 border border-white/40 shadow-xl shadow-neutral-200/50 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-accent-100 flex items-center justify-center mb-4">
                        <Box className="w-6 h-6 text-accent-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Module Logistics</h3>
                    <p className="text-sm text-neutral-600">Assign specific feature modules to tenants instantly. View auto-resolved dependencies in real-time.</p>
                </div>

                <div className="p-6 rounded-3xl bg-white/70 border border-white/40 shadow-xl shadow-neutral-200/50 backdrop-blur-md">
                    <div className="w-12 h-12 rounded-2xl bg-info-100 flex items-center justify-center mb-4">
                        <Zap className="w-6 h-6 text-info-600" />
                    </div>
                    <h3 className="text-lg font-bold text-neutral-900 mb-2">Platform Health</h3>
                    <p className="text-sm text-neutral-600">Monitor system uptime, active user load, and global revenue metrics from a unified vantage point.</p>
                </div>
            </div>
        </div>
    );
}
