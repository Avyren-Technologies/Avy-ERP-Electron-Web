import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useResetPasswordMutation } from "@/lib/api/use-auth-mutations";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import { AuthFlowAside } from "./AuthFlowAside";

const resetPasswordSchema = z.object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
}).refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
});

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export function ResetPasswordScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") ?? "";
    const code = searchParams.get("code") ?? "";

    const resetMutation = useResetPasswordMutation();
    const [isDone, setIsDone] = useState(false);
    const [focusedInput, setFocusedInput] = useState<"password" | "confirmPassword" | null>(null);

    const isLoading = resetMutation.isPending;

    const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: { password: "", confirmPassword: "" },
    });

    useEffect(() => {
        if (!email || !code) {
            navigate("/forgot-password", { replace: true });
        }
    }, [code, email, navigate]);

    const title = useMemo(() => (isDone ? "Password reset complete" : "Create a new password"), [isDone]);

    const onSubmit = (data: ResetPasswordFormValues) => {
        resetMutation.mutate(
            { email, code, newPassword: data.password },
            {
                onSuccess: (response) => {
                    if (response.success) {
                        setIsDone(true);
                    }
                },
            },
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 pt-8 min-h-screen">
            <AuthFlowAside
                eyebrow="Account Recovery"
                title={title}
                description="Use a strong password that is unique to your Avy ERP account for better security and compliance."
                steps={[
                    { title: "Enter email", desc: "Use your registered work email", state: "completed" },
                    { title: "Verify code", desc: "Confirm OTP sent to your inbox", state: "completed" },
                    { title: "Set new password", desc: "Create a fresh secure password", state: isDone ? "completed" : "active" },
                ]}
            />

            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                    {!isDone ? (
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Set New Password</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">Your new password must be at least 8 characters long.</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">New Password</label>
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

                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">Confirm Password</label>
                                    <div
                                        className={cn(
                                            "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                            focusedInput === "confirmPassword"
                                                ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                                : errors.confirmPassword
                                                    ? "border-danger-500"
                                                    : "border-neutral-200 dark:border-neutral-800"
                                        )}
                                    >
                                        <div className="pl-4 pr-3 flex items-center justify-center">
                                            <Lock className={cn("w-5 h-5", focusedInput === "confirmPassword" ? "text-primary-600 dark:text-primary-400" : (errors.confirmPassword ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                        </div>
                                        <input
                                            type="password"
                                            {...register("confirmPassword")}
                                            onFocus={() => setFocusedInput("confirmPassword")}
                                            onBlur={() => setFocusedInput(null)}
                                            placeholder="••••••••"
                                            className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50 tracking-widest text-lg"
                                            disabled={isLoading}
                                        />
                                    </div>
                                    {errors.confirmPassword && <p className="text-xs font-bold text-danger-500 ml-1">{errors.confirmPassword.message}</p>}
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
                                            <span>Update Password</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {resetMutation.isError && (
                                <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                                    <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                                        {(resetMutation.error as any)?.response?.data?.message
                                            || (resetMutation.error as any)?.response?.data?.error
                                            || 'Failed to reset password. Please try again.'}
                                    </p>
                                </div>
                            )}

                            <button
                                type="button"
                                onClick={() => navigate(`/reset-password/verify?email=${encodeURIComponent(email)}`)}
                                className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Code Verification
                            </button>
                        </>
                    ) : (
                        <div className="text-center py-8">
                            <div className="mx-auto w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-5">
                                <CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Password Updated</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
                                Your password has been reset successfully. You can now sign in with your new credentials.
                            </p>
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="group relative w-full h-14 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 overflow-hidden transition-all hover:bg-primary-700"
                            >
                                <span>Back to Sign In</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
