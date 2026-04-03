import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building, User, Mail, Phone, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRegisterCompanyMutation } from "@/lib/api/registration";
import { CustomLoader } from "@/components/ui/CustomLoader";
import { cn } from "@/lib/utils";
import companyLogo from "@/assets/logo/Company-Logo.png";

const registerSchema = z.object({
    companyName: z.string().min(2, "Company name must be at least 2 characters").max(200, "Company name must be at most 200 characters"),
    adminName: z.string().min(2, "Admin name must be at least 2 characters").max(100, "Admin name must be at most 100 characters"),
    email: z.string().email("Please enter a valid email address"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number must be at most 15 digits"),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

type FocusedField = "companyName" | "adminName" | "email" | "phone" | null;

const FORM_FIELDS = [
    { name: "companyName" as const, label: "Company Name", placeholder: "Acme Manufacturing Ltd.", icon: Building, type: "text" },
    { name: "adminName" as const, label: "Admin Name", placeholder: "John Doe", icon: User, type: "text" },
    { name: "email" as const, label: "Work Email", placeholder: "admin@company.com", icon: Mail, type: "email" },
    { name: "phone" as const, label: "Phone Number", placeholder: "+91 98765 43210", icon: Phone, type: "tel" },
] as const;

export function RegisterCompanyScreen() {
    const navigate = useNavigate();
    const registerMutation = useRegisterCompanyMutation();

    const [focusedInput, setFocusedInput] = useState<FocusedField>(null);

    const { register, handleSubmit, formState: { errors } } = useForm<RegisterFormValues>({
        resolver: zodResolver(registerSchema),
        defaultValues: { companyName: "", adminName: "", email: "", phone: "" },
    });

    const isLoading = registerMutation.isPending;
    const isSuccess = registerMutation.isSuccess;

    const onSubmit = (data: RegisterFormValues) => {
        registerMutation.mutate(data);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row gap-8 items-center justify-center p-6 pt-8 min-h-screen">

            {/* -- Left Column -- */}
            <div className="w-full md:w-1/2 flex flex-col items-start justify-center order-last md:order-first pl-0 md:pl-2 pr-4">

                {/* Logo */}
                <img
                    src={companyLogo}
                    alt="Avyren Technologies"
                    className="w-full max-w-[380px] h-auto object-contain -mt-20 -ml-9 mb-0"
                />

                {/* Headline */}
                <h1 className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white mb-3 tracking-tight -mt-16 leading-tight">
                    Start your{" "}
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent-500 dark:from-primary-400 dark:to-accent-400">
                        digital transformation.
                    </span>
                </h1>
                <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed mb-6 font-medium">
                    Register your company and get access to the next-generation ERP platform built for modern manufacturing.
                </p>

                {/* Benefits */}
                <div className="space-y-4 w-full max-w-md">
                    {[
                        { title: "Quick Setup", desc: "Get your company workspace configured in minutes." },
                        { title: "Modular Platform", desc: "Choose only the modules your business needs." },
                        { title: "Enterprise Security", desc: "Role-based access control with multi-factor authentication." },
                    ].map((item) => (
                        <div key={item.title} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-neutral-800 dark:text-neutral-100">{item.title}</h3>
                                <p className="text-[13px] text-neutral-500 dark:text-neutral-400 font-medium">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* -- Right Column: Registration Form -- */}
            <div className="w-full md:w-[440px] flex-shrink-0">
                <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-right-4 duration-500">

                    {isSuccess ? (
                        /* -- Success State -- */
                        <div className="flex flex-col items-center text-center py-6">
                            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center mb-5">
                                <CheckCircle2 className="w-8 h-8 text-success-600 dark:text-success-400" strokeWidth={2} />
                            </div>
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Registration Submitted</h2>
                            <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed max-w-xs mb-8">
                                Your company registration request has been submitted successfully. Our team will review your application and set up your account shortly. You will receive an email with your login credentials.
                            </p>
                            <button
                                onClick={() => navigate("/login")}
                                className="group flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/25"
                            >
                                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                                <span>Back to Sign In</span>
                            </button>
                        </div>
                    ) : (
                        /* -- Registration Form -- */
                        <>
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">Register Company</h2>
                                <p className="text-neutral-500 dark:text-neutral-400 text-sm">Fill in your details to get started</p>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {FORM_FIELDS.map((field) => {
                                    const Icon = field.icon;
                                    const error = errors[field.name];
                                    return (
                                        <div key={field.name} className="space-y-1.5">
                                            <label className="text-sm font-semibold text-neutral-900 dark:text-neutral-200 ml-1">{field.label}</label>
                                            <div
                                                className={cn(
                                                    "relative flex items-center h-14 bg-white dark:bg-neutral-950 rounded-xl border-2 transition-colors overflow-hidden",
                                                    focusedInput === field.name
                                                        ? "border-primary-500 shadow-sm shadow-primary-500/10"
                                                        : error
                                                            ? "border-danger-500"
                                                            : "border-neutral-200 dark:border-neutral-800"
                                                )}
                                            >
                                                <div className="pl-4 pr-3 flex items-center justify-center">
                                                    <Icon className={cn("w-5 h-5", focusedInput === field.name ? "text-primary-600 dark:text-primary-400" : (error ? "text-danger-500" : "text-neutral-400 dark:text-neutral-500"))} />
                                                </div>
                                                <input
                                                    type={field.type}
                                                    {...register(field.name)}
                                                    onFocus={() => setFocusedInput(field.name)}
                                                    onBlur={() => setFocusedInput(null)}
                                                    placeholder={field.placeholder}
                                                    className="flex-1 h-full bg-transparent border-none outline-none text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-600 font-medium disabled:opacity-50"
                                                    disabled={isLoading}
                                                />
                                            </div>
                                            {error && <p className="text-xs font-bold text-danger-500 ml-1">{error.message}</p>}
                                        </div>
                                    );
                                })}

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="group relative w-full h-14 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 overflow-hidden transition-all hover:bg-primary-700 disabled:opacity-70 disabled:hover:bg-primary-600 mt-2"
                                >
                                    {isLoading ? (
                                        <CustomLoader size="sm" className="text-white brightness-200" />
                                    ) : (
                                        <>
                                            <span>Submit Registration</span>
                                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {registerMutation.isError && (
                                <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                                    <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                                        {(registerMutation.error as any)?.response?.data?.message
                                            || (registerMutation.error as any)?.response?.data?.error
                                            || 'Registration failed. Please try again.'}
                                    </p>
                                </div>
                            )}

                            {/* Back to Sign In */}
                            <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800 flex flex-col items-center gap-4">
                                <p className="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Already have an account?</p>
                                <button
                                    onClick={() => navigate("/login")}
                                    className="relative flex items-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/50 dark:to-accent-950/50 border-2 border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-300 font-bold hover:border-primary-400 dark:hover:border-primary-600 hover:shadow-md hover:shadow-primary-500/10 transition-all w-full justify-center group"
                                >
                                    <ArrowLeft className="w-4 h-4 text-primary-500 group-hover:text-primary-600 dark:group-hover:text-primary-300 group-hover:-translate-x-0.5 transition-all" />
                                    <span>Back to Sign In</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
