import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForgotPasswordMutation } from "@/lib/api/use-auth-mutations";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import { AuthFlowAside } from "./AuthFlowAside";

const forgotPasswordSchema = z.object({
    email: z.string().email("Please enter a valid work email"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordScreen() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const emailFromQuery = searchParams.get("email") ?? "";
    const forgotPasswordMutation = useForgotPasswordMutation();
    const [focused, setFocused] = useState(false);

    const isLoading = forgotPasswordMutation.isPending;

    const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: { email: emailFromQuery },
    });

    const onSubmit = (data: ForgotPasswordFormValues) => {
        forgotPasswordMutation.mutate(
            { email: data.email },
            {
                onSuccess: (response) => {
                    if (response.success) {
                        navigate(`/reset-password/verify?email=${encodeURIComponent(data.email)}`);
                    }
                },
            },
        );
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 pt-8 min-h-screen">
            <AuthFlowAside
                eyebrow="Account Recovery"
                title="Forgot your password?"
                description="No worries. Enter your registered work email and we will send a verification code to securely reset your password."
                steps={[
                    { title: "Enter email", desc: "Use your registered work email", state: "active" },
                    { title: "Verify code", desc: "Confirm OTP sent to your inbox", state: "upcoming" },
                    { title: "Set new password", desc: "Create a fresh secure password", state: "upcoming" },
                ]}
            />

            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Reset Password</h2>
                        <p className="text-neutral-500 dark:text-neutral-400 text-sm">We will send a one-time verification code to your email.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">Work Email</label>
                            <div
                                className={cn(
                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                    focused
                                        ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                        : errors.email
                                            ? "border-danger-500"
                                            : "border-neutral-200 dark:border-neutral-800"
                                )}
                            >
                                <div className="pl-4 pr-3 flex items-center justify-center">
                                    <Mail className={cn("w-5 h-5", focused ? "text-primary-600 dark:text-primary-400" : (errors.email ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                </div>
                                <input
                                    type="email"
                                    {...register("email")}
                                    onFocus={() => setFocused(true)}
                                    onBlur={() => setFocused(false)}
                                    placeholder="name@company.com"
                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50"
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && <p className="text-xs font-bold text-danger-500 ml-1">{errors.email.message}</p>}
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
                                    <span>Send Verification Code</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {forgotPasswordMutation.isError && (
                        <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                            <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                                {(forgotPasswordMutation.error as any)?.response?.data?.message
                                    || (forgotPasswordMutation.error as any)?.response?.data?.error
                                    || 'Something went wrong. Please try again.'}
                            </p>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-neutral-500 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Sign In
                    </button>
                </div>
            </div>
        </div>
    );
}
