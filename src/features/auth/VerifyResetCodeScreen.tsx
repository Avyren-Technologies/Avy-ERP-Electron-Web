import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useVerifyResetCodeMutation, useForgotPasswordMutation } from "@/lib/api/use-auth-mutations";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import { AuthFlowAside } from "./AuthFlowAside";

const verifyCodeSchema = z.object({
    code: z.string().regex(/^\d{6}$/, "Enter the 6-digit verification code"),
});

type VerifyCodeFormValues = z.infer<typeof verifyCodeSchema>;

function maskEmail(email: string) {
    const [name, domain] = email.split("@");
    if (!name || !domain) return email;
    if (name.length <= 2) return `${name[0] ?? "*"}*@${domain}`;
    return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
}

export function VerifyResetCodeScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const email = searchParams.get("email") ?? "";

    const verifyMutation = useVerifyResetCodeMutation();
    const resendMutation = useForgotPasswordMutation();
    const [focused, setFocused] = useState(false);
    const [resendTimer, setResendTimer] = useState(30);

    const isLoading = verifyMutation.isPending;
    const maskedEmail = useMemo(() => maskEmail(email), [email]);

    const { register, handleSubmit, formState: { errors } } = useForm<VerifyCodeFormValues>({
        resolver: zodResolver(verifyCodeSchema),
        defaultValues: { code: "" },
    });

    useEffect(() => {
        if (!email) navigate("/forgot-password", { replace: true });
    }, [email, navigate]);

    useEffect(() => {
        if (resendTimer <= 0) return;
        const interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [resendTimer]);

    const onSubmit = (data: VerifyCodeFormValues) => {
        verifyMutation.mutate(
            { email, code: data.code },
            {
                onSuccess: (response) => {
                    if (response.success) {
                        navigate(`/reset-password/new?email=${encodeURIComponent(email)}&code=${encodeURIComponent(data.code)}`);
                    }
                },
            },
        );
    };

    const resendCode = () => {
        resendMutation.mutate({ email });
        setResendTimer(30);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 pt-8 min-h-screen">
            <AuthFlowAside
                eyebrow="Account Recovery"
                title="Verify your reset code"
                description="We have sent a one-time 6-digit verification code to your email address. Enter it below to continue."
                steps={[
                    { title: "Enter email", desc: "Use your registered work email", state: "completed" },
                    { title: "Verify code", desc: "Confirm OTP sent to your inbox", state: "active" },
                    { title: "Set new password", desc: "Create a fresh secure password", state: "upcoming" },
                ]}
            />

            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Enter Verification Code</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                            Code sent to <span className="font-semibold text-neutral-700 dark:text-neutral-300">{maskedEmail || "your email"}</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">6-digit Code</label>
                            <div
                                className={cn(
                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                    focused
                                        ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                        : errors.code
                                            ? "border-danger-500"
                                            : "border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <div className="pl-4 pr-3 flex items-center justify-center">
                                    <KeyRound className={cn("w-5 h-5", focused ? "text-primary-600 dark:text-primary-400" : (errors.code ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                </div>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    {...register("code")}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="123456"
                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-semibold tracking-[0.3em] disabled:opacity-50"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.code && <p className="text-xs font-bold text-danger-500 ml-1">{errors.code.message}</p>}
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
                                    <span>Verify Code</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {verifyMutation.isError && (
                        <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                            <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                                {(verifyMutation.error as any)?.response?.data?.message
                                    || (verifyMutation.error as any)?.response?.data?.error
                                    || 'Invalid verification code. Please try again.'}
                            </p>
                        </div>
                    )}

                    <div className="mt-5 flex items-center justify-between">
                        <button
                            type="button"
                            onClick={() => navigate(`/forgot-password?email=${encodeURIComponent(email)}`)}
                            className="inline-flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Change Email
                        </button>

                        <button
                            type="button"
                            onClick={resendCode}
                            disabled={resendTimer > 0}
                            className="text-sm font-bold text-primary-600 dark:text-primary-400 disabled:text-neutral-400 dark:disabled:text-neutral-600 transition-colors"
                        >
                            {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Code"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
