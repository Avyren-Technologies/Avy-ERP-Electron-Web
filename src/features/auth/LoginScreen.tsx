import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Building, Check, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/logo/Company-Logo.png";

// Make sure to add this schema
const loginSchema = z.object({
    email: z.string().email("Please enter a valid work email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PRD_HIGHLIGHTS = [
    { 
        title: "Intelligent Orchestration", 
        desc: "Real-time visibility and control across your entire production lifecycle." 
    },
    { 
        title: "Global Connectivity", 
        desc: "Synchronize teams, vendors, and clients on a single unified source of truth." 
    },
    { 
        title: "Precision Analytics", 
        desc: "Data-driven insights to optimize your output and minimize operational waste." 
    },
    { 
        title: "Adaptive Scaling", 
        desc: "Modular tools designed to grow with your enterprise from 10 to 10,000 members." 
    },
    { 
        title: "Secure Infrastructure", 
        desc: "Enterprise-grade protection for your most sensitive manufacturing data." 
    }
];

export function LoginScreen() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);

    const [isLoading, setIsLoading] = useState(false);
    const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);
    const [highlightIndex, setHighlightIndex] = useState(0);

    const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: "", password: "", rememberMe: false }
    });

    useEffect(() => {
        const interval = setInterval(() => {
            setHighlightIndex(prev => (prev + 1) % PRD_HIGHLIGHTS.length);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const onSubmit = (data: LoginFormValues) => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            console.log("Form values (including rememberMe): ", data);
            signIn("mock-jwt-token-xyz", "super-admin");
            navigate("/app/dashboard");
        }, 1200);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-start justify-center p-4">

            {/* ── Left Column ── */}
            <div className="w-full md:w-1/2 flex flex-col items-start justify-start order-last md:order-first pl-0 md:pl-2 pr-4">

                {/* Logo — negative top margin cancels PNG internal whitespace */}
                <img
                    src={companyLogo}
                    alt="Avyren Technologies"
                    className="w-full max-w-[380px] h-auto object-contain -mt-20 -ml-9 mb-0"
                />

                {/* Headline — single line and professional */}
                <h1 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight -mt-16 leading-tight whitespace-nowrap">
                    Empowering modern <span className="text-primary-600 dark:text-primary-400">manufacturing teams.</span>
                </h1>
                <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-8 font-medium">
                    The next-generation operating system for industrial excellence.
                </p>

                {/* Slide box — elegant tinted card */}
                <div className="w-full max-w-md">
                    <div className="relative border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/20 rounded-2xl min-h-[140px] overflow-hidden backdrop-blur-sm shadow-sm">
                        {PRD_HIGHLIGHTS.map((item, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "absolute inset-0 px-7 py-6 flex flex-col justify-center transition-all duration-1000 ease-in-out",
                                    idx === highlightIndex
                                        ? "opacity-100 translate-y-0 scale-100 pointer-events-auto z-10"
                                        : "opacity-0 translate-y-4 scale-95 pointer-events-none z-0"
                                )}
                            >
                                <div className="flex items-center gap-3.5 mb-2.5">
                                    <div className="w-7 h-7 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" strokeWidth={2.5} />
                                    </div>
                                    <h3 className="font-bold text-[16px] text-neutral-800 dark:text-neutral-100 tracking-tight">
                                        {item.title}
                                    </h3>
                                </div>
                                <p className="text-[14px] text-neutral-500 dark:text-neutral-400 pl-[42px] leading-relaxed font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Dot indicators */}
                    <div className="flex items-center gap-1.5 mt-3 px-1">
                        {PRD_HIGHLIGHTS.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setHighlightIndex(idx)}
                                className={cn(
                                    "h-1 rounded-full transition-all duration-400 border-0 outline-none cursor-pointer",
                                    idx === highlightIndex
                                        ? "w-5 bg-primary-500 dark:bg-primary-400"
                                        : "w-1.5 bg-neutral-300 dark:bg-neutral-600 hover:bg-neutral-400"
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Dynamic Form Container */}
            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
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
                                    focusedInput === "email" ? "border-primary-500" : (errors.email ? "border-danger-500" : "border-neutral-200 dark:border-neutral-800")
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
                                <button type="button" className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
                                    Forgot password?
                                </button>
                            </div>
                            <div
                                className={cn(
                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                    focusedInput === "password" ? "border-primary-500" : (errors.password ? "border-danger-500" : "border-neutral-200 dark:border-neutral-800")
                                )}
                            >
                                <div className="pl-4 pr-3 flex items-center justify-center">
                                    <Lock className={cn("w-5 h-5", focusedInput === "password" ? "text-primary-600 dark:text-primary-400" : (errors.password ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                </div>
                                <input
                                    type="password"
                                    {...register("password")}
                                    onFocus={() => setFocusedInput("password")}
                                    onBlur={() => setFocusedInput(null)}
                                    placeholder="••••••••"
                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50 tracking-widest text-lg"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.password && <p className="text-xs font-bold text-danger-500 ml-1">{errors.password.message}</p>}
                        </div>

                        {/* Remember Me */}
                        <div className="flex items-center ml-1">
                            <label className="relative flex items-center cursor-pointer gap-3">
                                <input
                                    type="checkbox"
                                    {...register("rememberMe")}
                                    className="peer sr-only"
                                    disabled={isLoading}
                                />
                                <div className="w-5 h-5 border-2 border-neutral-300 dark:border-neutral-600 rounded bg-white dark:bg-neutral-900 peer-checked:bg-primary-600 peer-checked:border-primary-600 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500/30 transition-all flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
                                </div>
                                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-400 select-none">Remember me</span>
                            </label>
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
                    </form>

                    {/* Terms Disclaimer */}
                    <p className="mt-5 text-center text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed px-2">
                        By signing in, you agree to our <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Terms of Service</a> and <a href="#" className="font-semibold text-primary-600 dark:text-primary-400 hover:underline">Privacy Policy</a>.
                    </p>

                    <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center gap-4">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">New to Avy ERP?</p>
                        <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-primary-600 dark:hover:text-primary-400 transition-all w-full justify-center group">
                            <Building className="w-4 h-4 text-neutral-400 group-hover:text-primary-500 transition-colors" />
                            <span>Register Your Company</span>
                            <ArrowUpRight className="w-4 h-4 ml-1 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-neutral-400 group-hover:text-primary-500" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
