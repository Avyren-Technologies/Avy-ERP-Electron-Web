import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight, ShieldCheck, Factory, Users, BarChart3,
    Wrench, Package, Receipt, Eye, ClipboardList, Smartphone, Globe, Monitor,
    ChevronRight, Cpu, Layers, WifiOff, Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/logo/Company-Logo.png";

/* ─── Animated Counter ─── */
function useCountUp(target: number, duration = 2000, startDelay = 400) {
    const [count, setCount] = useState(0);
    const hasAnimated = useRef(false);

    useEffect(() => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        const timeout = setTimeout(() => {
            const isDecimal = target % 1 !== 0;
            const steps = 60;
            const inc = target / steps;
            let cur = 0, step = 0;
            const interval = setInterval(() => {
                step++;
                cur += inc;
                if (step >= steps) { setCount(target); clearInterval(interval); }
                else setCount(isDecimal ? parseFloat(cur.toFixed(1)) : Math.floor(cur));
            }, duration / steps);
        }, startDelay);
        return () => clearTimeout(timeout);
    }, [target, duration, startDelay]);
    return count;
}

/* ─── Stat Counter Component ─── */
function StatBlock({ value, suffix, label, delay }: { value: number; suffix: string; label: string; delay: number }) {
    const count = useCountUp(value, 2000, delay);
    return (
        <div className="flex flex-col items-center px-5 md:px-8">
            <span className="text-2xl md:text-3xl font-black tracking-tight text-neutral-900 dark:text-white stat-glow">
                {count}{suffix}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-[0.15em] mt-1.5">
                {label}
            </span>
        </div>
    );
}

/* ─── Data ─── */
const HERO_STATS = [
    { value: 10, suffix: "+", label: "Modules" },
    { value: 9, suffix: "+", label: "Industries" },
    { value: 99.9, suffix: "%", label: "Uptime SLA" },
    { value: 3, suffix: "", label: "Platforms" },
];

const FLOATING_MODULES = [
    { icon: Factory, label: "Production", color: "from-primary-500 to-primary-700" },
    { icon: Users, label: "HR", color: "from-accent-500 to-accent-700" },
    { icon: BarChart3, label: "Finance", color: "from-info-500 to-info-700" },
    { icon: Wrench, label: "Maintenance", color: "from-warning-500 to-warning-700" },
    { icon: Package, label: "Inventory", color: "from-success-500 to-success-700" },
    { icon: ShieldCheck, label: "Security", color: "from-danger-500 to-danger-700" },
];

const MODULES = [
    { icon: Receipt, name: "Sales & Invoicing", desc: "Quote-to-cash lifecycle with GST-compliant invoicing" },
    { icon: Package, name: "Inventory", desc: "Stock management across warehouses with real-time alerts" },
    { icon: ShieldCheck, name: "Security", desc: "Gate attendance, goods verification, and visitor control" },
    { icon: ClipboardList, name: "Vendor Management", desc: "Full procurement lifecycle from PO to GRN" },
    { icon: BarChart3, name: "Finance", desc: "Payables, receivables, and financial reporting" },
    { icon: Wrench, name: "Machine Maintenance", desc: "PM scheduling, breakdown management, and OEE integration" },
    { icon: Users, name: "HR Management", desc: "Employee lifecycle, attendance, payroll, and incentives" },
    { icon: Factory, name: "Production", desc: "OEE dashboard, production logging, and scrap tracking" },
    { icon: Eye, name: "Visitor Management", desc: "Pre-registration, QR self-check-in, and audit trails" },
];

const PLATFORMS = [
    { icon: Smartphone, name: "Mobile App", desc: "Shop-floor ready, offline-first on iOS & Android", tech: "React Native + Expo" },
    { icon: Globe, name: "Web App", desc: "Full administration and deep data access", tech: "React + Vite" },
    { icon: Monitor, name: "Desktop App", desc: "Installed client with local hardware integration", tech: "ElectronJS" },
];

const CAPABILITIES = [
    { icon: Layers, title: "Multi-Tenant SaaS", desc: "Complete data isolation per company with independent configuration, billing, and module access." },
    { icon: WifiOff, title: "Offline-First Design", desc: "Critical operations work without connectivity and sync automatically when reconnected." },
    { icon: Lock, title: "Role-Based Access", desc: "Granular RBAC with feature toggles — every user sees only what their role permits." },
    { icon: Cpu, title: "Modular Architecture", desc: "Activate only the modules you need. Dependencies auto-resolve. Scale as you grow." },
];

/* ════════════════════════════════════════════ */
export function LandingScreen() {
    const navigate = useNavigate();
    const [activeModule, setActiveModule] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => setActiveModule((p) => (p + 1) % MODULES.length), 3000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-full flex flex-col items-center">

            {/* ═══════════════ HERO ═══════════════ */}
            <section className="relative w-full overflow-hidden">
                {/* ── Dot grid background ── */}
                <div className="absolute inset-0 dot-grid text-neutral-300/50 dark:text-neutral-700/30 pointer-events-none" />

                {/* ── Gradient orb accents ── */}
                <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary-400/15 dark:bg-primary-600/10 blur-[120px] pointer-events-none" />
                <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-accent-400/15 dark:bg-accent-600/10 blur-[120px] pointer-events-none" />

                <div className="relative z-10 max-w-7xl mx-auto px-6 pt-4 pb-16 md:pb-24">

                    {/* ── Top bar: Logo + Sign In ── */}
                    <div className="flex items-center justify-between mb-8 md:mb-12 hero-stagger-1">
                        <img
                            src={companyLogo}
                            alt="Avyren Technologies"
                            className="w-40 md:w-48 h-auto object-contain -ml-5"
                        />
                        <button
                            onClick={() => navigate("/login")}
                            className="text-sm font-bold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            Sign In &rarr;
                        </button>
                    </div>

                    {/* ── Main hero grid ── */}
                    <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">

                        {/* Left: Copy */}
                        <div className="flex-1 max-w-2xl">
                            {/* Eyebrow */}
                            <div className="hero-stagger-2 flex items-center gap-3 mb-6">
                                <div className="h-px w-8 bg-primary-500 hero-line-anim" />
                                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">
                                    Enterprise Resource Planning
                                </span>
                            </div>

                            {/* Headline */}
                            <h1 className="hero-stagger-3 text-[2.5rem] md:text-[3.5rem] lg:text-[4rem] font-black leading-[1.05] tracking-tight text-neutral-900 dark:text-white mb-6">
                                The operating{" "}
                                <br className="hidden md:block" />
                                system for{" "}
                                <span className="relative inline-block">
                                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-accent-500 to-primary-500 dark:from-primary-400 dark:via-accent-400 dark:to-primary-400">
                                        modern manufacturing.
                                    </span>
                                    {/* Underline accent */}
                                    <span className="absolute -bottom-1.5 left-0 right-0 h-[3px] rounded-full bg-gradient-to-r from-primary-500 to-accent-500 hero-line-anim opacity-60" />
                                </span>
                            </h1>

                            {/* Sub-copy */}
                            <p className="hero-stagger-4 text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed mb-10 max-w-lg">
                                A mobile-first, modular platform giving every person in your factory — from shop-floor operator to business owner — the right information at the right time.
                            </p>

                            {/* CTAs */}
                            <div className="hero-stagger-5 flex flex-col sm:flex-row items-start gap-4">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="group relative inline-flex items-center gap-3 px-8 py-4 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-base shadow-2xl shadow-neutral-900/20 dark:shadow-black/30 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {/* Hover gradient sweep */}
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    <span className="relative group-hover:text-white">Get Started</span>
                                    <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 group-hover:text-white transition-all" />
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-primary-400 dark:hover:border-primary-600 hover:text-primary-600 dark:hover:text-primary-400 transition-all"
                                >
                                    <span>Register Company</span>
                                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Module constellation — expand from center + orbit */}
                        <div className="relative w-72 h-72 md:w-80 md:h-80 lg:w-[400px] lg:h-[400px] flex-shrink-0 hidden md:flex items-center justify-center constellation-breathe">

                            {/* SVG connectivity lines from center to each module */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 400 400">
                                {FLOATING_MODULES.map((_, i) => {
                                    const angle = (i * 60) - 90;
                                    const radius = 150;
                                    const ex = 200 + Math.cos((angle * Math.PI) / 180) * radius;
                                    const ey = 200 + Math.sin((angle * Math.PI) / 180) * radius;
                                    return (
                                        <line
                                            key={`line-${i}`}
                                            x1="200" y1="200"
                                            x2={ex} y2={ey}
                                            stroke="url(#line-gradient)"
                                            strokeWidth="1.5"
                                            className="connectivity-line"
                                            style={{ "--delay": `${0.8 + i * 0.1}s` } as React.CSSProperties}
                                        />
                                    );
                                })}
                                <defs>
                                    <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#6366F1" stopOpacity="0.5" />
                                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.15" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {/* Orbit rings — expand in */}
                            <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-neutral-300/50 dark:border-neutral-700/30 orbit-ring-1" />
                            <div className="absolute w-[200px] h-[200px] rounded-full border border-dashed border-neutral-200/40 dark:border-neutral-800/20 orbit-ring-2" />

                            {/* Central orb — pops in first */}
                            <div className="absolute w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 shadow-2xl shadow-primary-500/40 flex items-center justify-center z-30 orb-enter">
                                <span className="text-white font-black text-lg tracking-tight">Avy</span>
                            </div>

                            {/* Orbiting module pills container — rotates continuously */}
                            <div className="absolute inset-0 orbit-container">
                                {FLOATING_MODULES.map((mod, i) => {
                                    const Icon = mod.icon;
                                    const angle = (i * 60) - 90;
                                    const radius = 150;
                                    const x = Math.cos((angle * Math.PI) / 180) * radius;
                                    const y = Math.sin((angle * Math.PI) / 180) * radius;
                                    return (
                                        <div
                                            key={mod.label}
                                            className="orbit-pill absolute z-10 left-1/2 top-1/2"
                                            style={{
                                                "--tx": `${x}px`,
                                                "--ty": `${y}px`,
                                                "--delay": `${0.6 + i * 0.12}s`,
                                                marginLeft: "-50px",
                                                marginTop: "-18px",
                                            } as React.CSSProperties}
                                        >
                                            {/* Counter-rotate so pill content stays upright */}
                                            <div className="orbit-pill-inner flex items-center gap-2 px-3 py-2 rounded-xl bg-white/90 dark:bg-neutral-900/90 border border-neutral-200/60 dark:border-neutral-700/40 shadow-lg backdrop-blur-sm">
                                                <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center flex-shrink-0", mod.color)}>
                                                    <Icon className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                                                </div>
                                                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 whitespace-nowrap">
                                                    {mod.label}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* ── Stats bar ── */}
                    <div className="hero-stagger-6 mt-12 md:mt-16">
                        <div className="relative mx-auto max-w-3xl">
                            {/* Glass card */}
                            <div className="flex items-center justify-center divide-x divide-neutral-200/60 dark:divide-neutral-700/40 py-5 px-4 rounded-2xl bg-white/60 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/50 backdrop-blur-xl shadow-xl shadow-neutral-200/20 dark:shadow-black/20">
                                {HERO_STATS.map((stat, i) => (
                                    <StatBlock key={stat.label} {...stat} delay={800 + i * 200} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ═══════════════ BELOW-FOLD CONTENT ═══════════════ */}
            <div className="w-full max-w-6xl mx-auto flex flex-col items-center px-6 gap-28 pb-16">

                {/* ════════════ CAPABILITIES ════════════ */}
                <section className="w-full max-w-5xl">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px w-6 bg-primary-400" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400">Architecture</span>
                            <div className="h-px w-6 bg-primary-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
                            Built for Scale, Designed for Simplicity
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
                            Enterprise-grade architecture that stays simple to use.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {CAPABILITIES.map((cap) => {
                            const Icon = cap.icon;
                            return (
                                <div
                                    key={cap.title}
                                    className="group p-6 rounded-2xl bg-white/60 dark:bg-neutral-900/60 border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-0.5"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-950/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors">
                                            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400" strokeWidth={2} />
                                        </div>
                                        <div>
                                            <h3 className="text-base font-bold text-neutral-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                                {cap.title}
                                            </h3>
                                            <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                {cap.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ════════════ MODULES ════════════ */}
                <section className="w-full max-w-5xl">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px w-6 bg-accent-400" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-600 dark:text-accent-400">Modules</span>
                            <div className="h-px w-6 bg-accent-400" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
                            9 Integrated Modules
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
                            Activate only what you need. Every module shares data — no silos, no duplicate entry.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {MODULES.map((mod, idx) => {
                            const Icon = mod.icon;
                            const isActive = idx === activeModule;
                            return (
                                <div
                                    key={mod.name}
                                    onMouseEnter={() => setActiveModule(idx)}
                                    className={cn(
                                        "group relative p-5 rounded-2xl border transition-all duration-300 cursor-default",
                                        isActive
                                            ? "bg-primary-50/80 dark:bg-primary-950/30 border-primary-200 dark:border-primary-800 shadow-lg shadow-primary-500/10 -translate-y-0.5"
                                            : "bg-white/50 dark:bg-neutral-900/50 border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md"
                                    )}
                                >
                                    <div className="flex items-start gap-3.5">
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                                            isActive
                                                ? "bg-primary-600 text-white shadow-md shadow-primary-500/25"
                                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
                                        )}>
                                            <Icon className="w-5 h-5" strokeWidth={2} />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className={cn(
                                                "font-bold text-[15px] mb-1 transition-colors",
                                                isActive
                                                    ? "text-primary-700 dark:text-primary-300"
                                                    : "text-neutral-800 dark:text-neutral-200"
                                            )}>
                                                {mod.name}
                                            </h3>
                                            <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                {mod.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ════════════ PLATFORMS ════════════ */}
                <section className="w-full max-w-5xl">
                    <div className="text-center mb-12">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="h-px w-6 bg-success-500" />
                            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-success-600 dark:text-success-500">Platforms</span>
                            <div className="h-px w-6 bg-success-500" />
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
                            One Platform, Three Surfaces
                        </h2>
                        <p className="text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
                            All surfaces share a single backend — there is never a discrepancy in operational truth.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {PLATFORMS.map((plat) => {
                            const Icon = plat.icon;
                            return (
                                <div
                                    key={plat.name}
                                    className="group p-6 rounded-2xl bg-white/70 dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800 shadow-sm transition-all hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-800 hover:-translate-y-0.5"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-neutral-900 dark:bg-white flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg">
                                        <Icon className="w-6 h-6 text-white dark:text-neutral-900" />
                                    </div>
                                    <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">
                                        {plat.name}
                                    </h3>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">
                                        {plat.desc}
                                    </p>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-[11px] font-bold text-neutral-500 dark:text-neutral-400 tracking-wide">
                                        {plat.tech}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ════════════ BOTTOM CTA ════════════ */}
                <section className="w-full max-w-3xl text-center pb-8">
                    <div className="relative p-10 md:p-14 rounded-3xl overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-neutral-900 dark:bg-white/[0.03] dark:border dark:border-neutral-800 rounded-3xl" />
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-600/20 to-accent-600/20 rounded-3xl" />
                        <div className="absolute inset-0 dot-grid text-white/[0.06] pointer-events-none" />

                        <div className="relative z-10">
                            <h2 className="text-2xl md:text-3xl font-black text-white dark:text-neutral-100 mb-3 tracking-tight">
                                Ready to transform your operations?
                            </h2>
                            <p className="text-neutral-400 dark:text-neutral-500 mb-10 max-w-lg mx-auto">
                                Join manufacturing teams who run their entire operations on Avy ERP — from the shop floor to the boardroom.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <button
                                    onClick={() => navigate("/login")}
                                    className="group inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-primary-600 text-neutral-900 dark:text-white rounded-xl font-bold text-base shadow-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base text-neutral-400 hover:text-white dark:hover:text-primary-300 transition-colors"
                                >
                                    <span>Sign In</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <p className="mt-10 text-[11px] font-medium text-neutral-400 dark:text-neutral-600 tracking-wide">
                        &copy; {new Date().getFullYear()} Avyren Technologies &middot; All rights reserved
                    </p>
                </section>
            </div>
        </div>
    );
}
