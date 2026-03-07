import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Building, Check, ArrowUpRight } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";

// Make sure to add this schema
const loginSchema = z.object({
    email: z.string().email("Please enter a valid work email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

const PRD_HIGHLIGHTS = [
    { title: "Modular Architecture", desc: "Select and pay only for the modules your factory needs." },
    { title: "Single Source of Truth", desc: "No duplicate entry. Synchronized across web, desktop, and mobile." },
    { title: "Offline-First Design", desc: "Keep the shop floor moving even when the internet goes down." },
    { title: "Multi-Tenant Security", desc: "Isolated database shards per company for enterprise-grade security." },
    { title: "Role-Based Access", desc: "Granular control over what every member of your team can see or do." }
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
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-4">

            {/* Left Column: Welcome & Highlights */}
            <div className="w-full md:w-1/2 flex flex-col items-start gap-6 pt-10 px-4 md:px-0 order-last md:order-first">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-2">
                    <span className="text-white font-bold text-3xl">A</span>
                </div>
                <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 dark:text-white mb-3">Welcome to Avy ERP</h1>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">The operating system of modern manufacturing.</p>
                </div>

                {/* Animated Carousel Highlights */}
                <div className="mt-8 w-full max-w-sm relative h-32">
                    {PRD_HIGHLIGHTS.map((item, idx) => (
                        <div
                            key={idx}
                            className={cn(
                                "absolute inset-0 transition-all duration-700 transform flex flex-col justify-center",
                                idx === highlightIndex
                                    ? "opacity-100 translate-y-0 pointer-events-auto"
                                    : "opacity-0 translate-y-4 pointer-events-none"
                            )}
                        >
                            <div className="inline-flex items-center gap-2 mb-2">
                                <span className="bg-primary-100 dark:bg-primary-900/40 p-1.5 rounded-full">
                                    <Check className="w-4 h-4 text-primary-600 dark:text-primary-400" strokeWidth={3} />
                                </span>
                                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">
                                    {item.title}
                                </h3>
                            </div>
                            <p className="text-neutral-500 dark:text-neutral-400 pl-9">
                                {item.desc}
                            </p>
                        </div>
                    ))}

                    {/* Carousel Indicators */}
                    <div className="absolute bottom-0 left-9 flex gap-1.5">
                        {PRD_HIGHLIGHTS.map((_, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "h-1.5 rounded-full transition-all duration-500",
                                    idx === highlightIndex ? "w-6 bg-primary-600" : "w-1.5 bg-neutral-300 dark:bg-neutral-700"
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
