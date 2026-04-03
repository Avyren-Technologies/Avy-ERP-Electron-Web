import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Building, Check, ArrowUpRight, Boxes, Users, Activity, Factory, Eye, EyeOff } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLoginMutation } from "@/lib/api/use-auth-mutations";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import { getTenantContext } from "@/lib/tenant";
import { useTenantBranding } from "@/lib/api/auth";
import companyLogo from "@/assets/logo/Company-Logo.png";

const loginSchema = z.object({
    email: z.string().email("Please enter a valid work email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PRD_HIGHLIGHTS = [
    {
        title: "Intelligent Orchestration",
        desc: "Real-time visibility and control across your entire production lifecycle.",
        accent: "from-primary-500 to-primary-600",
    },
    {
        title: "Global Connectivity",
        desc: "Synchronize teams, vendors, and clients on a single unified source of truth.",
        accent: "from-accent-500 to-accent-600",
    },
    {
        title: "Precision Analytics",
        desc: "Data-driven insights to optimize your output and minimize operational waste.",
        accent: "from-info-500 to-info-600",
    },
    {
        title: "Adaptive Scaling",
        desc: "Modular tools designed to grow with your enterprise from 10 to 10,000 members.",
        accent: "from-success-500 to-success-600",
    },
    {
        title: "Secure Infrastructure",
        desc: "Enterprise-grade protection for your most sensitive manufacturing data.",
        accent: "from-warning-500 to-warning-600",
    },
];

const METRICS = [
    { icon: Boxes, value: 9, suffix: "+", label: "Modules", color: "text-primary-600 dark:text-primary-400" },
    { icon: Users, value: 5000, suffix: "+", label: "Users Supported", color: "text-accent-600 dark:text-accent-400" },
    { icon: Activity, value: 99.9, suffix: "%", label: "Uptime", color: "text-success-600 dark:text-success-400" },
    { icon: Factory, value: 9, suffix: "+", label: "Industries", color: "text-info-600 dark:text-info-400" },
];

function useCountUp(target: number, duration = 1800, startDelay = 300) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval> | undefined;
        const timeout = setTimeout(() => {
            const isDecimal = target % 1 !== 0;
            const steps = 60;
            const increment = target / steps;
            let current = 0;
            let step = 0;

            interval = setInterval(() => {
                step++;
                current += increment;
                if (step >= steps) {
                    setCount(target);
                    if (interval) clearInterval(interval);
                } else {
                    setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));
                }
            }, duration / steps);
        }, startDelay);

        return () => {
            clearTimeout(timeout);
            if (interval) clearInterval(interval);
        };
    }, [target, duration, startDelay]);

    return count;
}

function MetricCounter({ icon: Icon, value, suffix, label, color, delay }: {
    icon: React.ElementType; value: number; suffix: string; label: string; color: string; delay: number;
}) {
    const count = useCountUp(value, 1800, delay);
    return (
        <div className="flex items-center gap-3 group">
            <div className={cn("w-9 h-9 rounded-xl bg-white/80 dark:bg-neutral-800/80 shadow-sm flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110", color)}>
                <Icon className="w-4.5 h-4.5" strokeWidth={2} />
            </div>
            <div className="flex flex-col">
                <span className="text-xl font-bold text-neutral-900 dark:text-white leading-none tracking-tight">
                    {count}{suffix}
                </span>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 uppercase tracking-wider mt-0.5">
                    {label}
                </span>
            </div>
        </div>
    );
}

export function LoginScreen() {
    const navigate = useNavigate();
    const loginMutation = useLoginMutation();
    const tenantContext = getTenantContext();
    const { data: branding } = useTenantBranding(tenantContext.slug);
    const isTenantMode = tenantContext.mode === 'tenant';
    const isMainMode = tenantContext.mode === 'main';

    const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [highlightIndex, setHighlightIndex] = useState(0);

    // Show session timeout banner if redirected from inactivity logout
    const searchParams = new URLSearchParams(window.location.search);
    const sessionTimedOut = searchParams.get('reason') === 'session_timeout';

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "", rememberMe: false },
    });

    const rememberMe = watch("rememberMe");
    const isLoading = loginMutation.isPending;

    useEffect(() => {
        const interval = setInterval(() => {
            setHighlightIndex((prev) => (prev + 1) % PRD_HIGHLIGHTS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const onSubmit = async (data: LoginFormValues) => {
        loginMutation.mutate(
            { email: data.email, password: data.password },
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 pt-8 min-h-screen">

            {/* ── Left Column ── */}
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center order-last md:order-first pl-0 md:pl-2 pr-4">

                {/* Logo */}
                <img
                    src={companyLogo}
                    alt="Avyren Technologies"
                    className="w-full max-w-[380px] h-auto object-contain -mt-20 -ml-9 mb-0"
                />

                {/* Headline */}
                <h1 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight -mt-16 leading-tight whitespace-nowrap">
                    Empowering modern{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400">
                        manufacturing teams.
                    </span>
                </h1>
                <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6 font-medium">
                    The next-generation operating system for industrial excellence.
                </p>

                {/* ── Animated Metric Counters ── */}
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 mb-8 w-full max-w-md">
                    {METRICS.map((m, i) => (
                        <MetricCounter key={m.label} {...m} delay={200 + i * 150} />
                    ))}
                </div>

                {/* ── Revamped Feature Carousel ── */}
                <div className="w-full max-w-md">
                    <div className="relative rounded-2xl overflow-hidden min-h-[130px]">
                        {/* Subtle background */}
                        <div className="absolute inset-0 bg-white/40 dark:bg-neutral-900/40 backdrop-blur-sm border border-neutral-200/60 dark:border-neutral-700/40 rounded-2xl" />

                        {PRD_HIGHLIGHTS.map((item, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "absolute inset-0 px-6 py-5 flex items-center gap-4 transition-all duration-700 ease-in-out",
                                    idx === highlightIndex
                                        ? "opacity-100 scale-100 pointer-events-auto z-10"
                                        : "opacity-0 scale-[0.97] pointer-events-none z-0"
                                )}
                            >
                                {/* Accent bar */}
                                <div className={cn(
                                    "w-1 self-stretch rounded-full bg-gradient-to-b flex-shrink-0",
                                    item.accent
                                )} />

                                <div className="flex flex-col justify-center min-w-0">
                                    <div className="flex items-center gap-2.5 mb-1.5">
                                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary-100 dark:bg-primary-900/30 flex-shrink-0">
                                            <Check className="w-3 h-3 text-primary-600 dark:text-primary-400" strokeWidth={3} />
                                        </span>
                                        <h3 className="font-bold text-[15px] text-neutral-800 dark:text-neutral-100 tracking-tight">
                                            {item.title}
                                        </h3>
                                    </div>
                                    <p className="text-[13px] text-neutral-500 dark:text-neutral-400 leading-relaxed font-medium pl-[30px]">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Progress-style dot indicators */}
                    <div className="flex items-center gap-1.5 mt-3 px-1">
                        {PRD_HIGHLIGHTS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setHighlightIndex(idx)}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500 border-0 outline-none cursor-pointer",
                                    idx === highlightIndex
                                        ? "w-7 bg-gradient-to-r from-primary-500 to-accent-500"
                                        : "w-1.5 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400 dark:hover:bg-neutral-500"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Right Column: Login Form ── */}
            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                    {sessionTimedOut && (
                        <div className="mb-4 px-4 py-3 rounded-xl bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800/50 text-warning-700 dark:text-warning-400 text-sm font-medium">
                            Your session expired due to inactivity. Please sign in again.
                        </div>
                    )}

                    {isTenantMode && branding?.exists && (
                        <div className="text-center mb-6">
                            {branding.logoUrl ? (
                                <img src={branding.logoUrl} alt={branding.companyName} className="h-14 mx-auto mb-3 object-contain" />
                            ) : null}
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-white">
                                {branding.companyName}
                            </h3>
                        </div>
                    )}

                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Sign In</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">Enter your credentials to continue</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">Work Email</label>
                            <div
                                className={cn(
                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                    focusedInput === "email"
                                        ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                        : errors.email
                                            ? "border-danger-500"
                                            : "border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <div className="pl-4 pr-3 flex items-center justify-center">
                                    <Mail className={cn("w-5 h-5", focusedInput === "email" ? "text-primary-600 dark:text-primary-400" : (errors.email ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                </div>
                                <input
                                    type="email"
                                    {...register("email")}
                                    onFocus={() => setFocusedInput("email")}
                                    onBlur={() => setFocusedInput(null)}
                                    placeholder="name@company.com"
                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && <p className="text-xs font-bold text-danger-500 ml-1">{errors.email.message}</p>}
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <div className="flex justify-between items-baseline mb-1 ml-1 pr-1">
                                <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200">Password</label>
                                <button
                                    type="button"
                                    onClick={() => navigate("/forgot-password")}
                                    className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <div
                                className={cn(
                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                    focusedInput === "password"
                                        ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                        : errors.password
                                            ? "border-danger-500"
                                            : "border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <div className="pl-4 pr-3 flex items-center justify-center">
                                    <Lock className={cn("w-5 h-5", focusedInput === "password" ? "text-primary-600 dark:text-primary-400" : (errors.password ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    {...register("password")}
                                    onFocus={() => setFocusedInput("password")}
                                    onBlur={() => setFocusedInput(null)}
                                    placeholder="••••••••"
                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50 tracking-widest text-lg"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="pr-4 pl-2 flex items-center justify-center text-neutral-400 dark:text-neutral-500 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword
                                        ? <EyeOff className="w-5 h-5" />
                                        : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs font-bold text-danger-500 ml-1">{errors.password.message}</p>}
                        </div>

                        {/* Remember Me — Fixed checkbox with visible tick */}
                        <div className="flex items-center ml-1">
                            <button
                                type="button"
                                onClick={() => setValue("rememberMe", !rememberMe)}
                                disabled={isLoading}
                                className="flex items-center gap-3 cursor-pointer group"
                            >
                                <div className={cn(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200",
                                    rememberMe
                                        ? "bg-primary-600 border-primary-600"
                                        : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-600 group-hover:border-primary-400"
                                )}>
                                    {rememberMe && (
                                        <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                                    )}
                                </div>
                                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 select-none">Remember me</span>
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="group relative w-full h-14 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 overflow-hidden transition-all hover:bg-primary-700 disabled:opacity-70 disabled:hover:bg-primary-600 mt-2"
                        >
                            {isLoading ? (
                                <CustomLoader size="sm" className="text-white brightness-200" />
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                        {isMainMode && (
                            <button
                                type="button"
                                onClick={() => {
                                    setValue("email", "demo-admin@avyerp.com");
                                    setValue("password", "demo123");
                                }}
                                className="w-full h-14 border-2 border-primary-200 dark:border-primary-800 text-primary-600 dark:text-primary-400 rounded-xl font-semibold hover:bg-primary-50 dark:hover:bg-primary-950 transition-colors"
                            >
                                Try Demo
                            </button>
                        )}
                    </form>

                    {loginMutation.isError && (() => {
                        const errorMsg = (loginMutation.error as any)?.response?.data?.message
                            || (loginMutation.error as any)?.response?.data?.error
                            || '';
                        const isTenantMismatch = errorMsg.includes('tenant mismatch') || errorMsg.includes('Access denied');

                        return (
                            <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                                <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                                    {isTenantMismatch
                                        ? "Your account doesn't belong to this company. Please check your URL."
                                        : (errorMsg || 'Login failed. Please check your credentials and try again.')}
                                </p>
                            </div>
                        );
                    })()}

                    {/* Terms Disclaimer — main/admin domains only */}
                    {!isTenantMode && (
                        <p className="mt-5 text-center text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed px-2">
                            By signing in, you agree to our{" "}
                            <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a>{" "}
                            and{" "}
                            <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>.
                        </p>
                    )}

                    {/* Powered by — tenant domains only */}
                    {isTenantMode && (
                        <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 mt-6">
                            Powered by{' '}
                            <a
                                href="https://avyrentechnologies.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary-500 hover:text-primary-600 font-medium transition-colors"
                            >
                                Avyren Technologies
                            </a>
                        </p>
                    )}

                    {/* ── Register CTA — Highlighted ── */}
                    {isMainMode && (
                        <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center gap-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">New to Avy ERP?</p>
                            <button
                                onClick={() => navigate("/register")}
                                className="relative flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/50 dark:to-accent-950/50 border-2 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-bold hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md hover:shadow-primary-500/10 transition-all w-full justify-center group"
                            >
                                <Building className="w-4 h-4 text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors" />
                                <span>Register Your Company</span>
                                <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-300" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
