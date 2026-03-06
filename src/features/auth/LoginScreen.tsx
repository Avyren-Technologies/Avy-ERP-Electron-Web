import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Building } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";

export function LoginScreen() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);

    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            signIn("mock-jwt-token-xyz", "super-admin");
            navigate("/app/dashboard");
        }, 1200);
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="mb-8 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary-600 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30 mb-6">
                    <span className="text-white font-bold text-3xl">A</span>
                </div>
                <h1 className="text-3xl font-bold text-neutral-900 mb-2">Welcome Back</h1>
                <p className="text-neutral-500">Sign in to the Super Admin console</p>
            </div>

            <div className="bg-white/80 backdrop-blur-xl border border-white shadow-2xl shadow-primary-900/5 rounded-3xl p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-neutral-900 ml-1">Work Email</label>
                        <div
                            className={cn(
                                "relative flex items-center h-14 bg-white rounded-xl border-2 transition-colors overflow-hidden",
                                focusedInput === "email" ? "border-primary-500" : "border-neutral-200"
                            )}
                        >
                            <div className="pl-4 pr-3 flex items-center justify-center">
                                <Mail className={cn("w-5 h-5", focusedInput === "email" ? "text-primary-600" : "text-neutral-400")} />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setFocusedInput("email")}
                                onBlur={() => setFocusedInput(null)}
                                placeholder="admin@avyren.com"
                                className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 placeholder:text-neutral-400 font-medium disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex justify-between items-baseline mb-1 ml-1 pr-1">
                            <label className="text-sm font-semibold text-neutral-900">Password</label>
                            <button type="button" className="text-xs font-bold text-primary-600 hover:text-primary-700">
                                Forgot passing?
                            </button>
                        </div>
                        <div
                            className={cn(
                                "relative flex items-center h-14 bg-white rounded-xl border-2 transition-colors overflow-hidden",
                                focusedInput === "password" ? "border-primary-500" : "border-neutral-200"
                            )}
                        >
                            <div className="pl-4 pr-3 flex items-center justify-center">
                                <Lock className={cn("w-5 h-5", focusedInput === "password" ? "text-primary-600" : "text-neutral-400")} />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedInput("password")}
                                onBlur={() => setFocusedInput(null)}
                                placeholder="••••••••"
                                className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 placeholder:text-neutral-400 font-medium disabled:opacity-50"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !email || !password}
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

                <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col items-center gap-4">
                    <p className="text-sm text-neutral-500">Not an admin?</p>
                    <button className="flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-neutral-300 text-neutral-600 font-semibold hover:border-primary-400 hover:text-primary-700 hover:bg-primary-50 transition-all w-full justify-center">
                        <Building className="w-4 h-4" />
                        Sign in to your Company
                    </button>
                </div>
            </div>
        </div>
    );
}
