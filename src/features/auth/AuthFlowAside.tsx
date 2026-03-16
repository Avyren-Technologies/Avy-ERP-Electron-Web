import { Check, ShieldCheck } from "lucide-react";
import companyLogo from "@/assets/logo/Company-Logo.png";
import { cn } from "@/lib/utils";

type FlowStep = {
    title: string;
    desc: string;
    state: "completed" | "active" | "upcoming";
};

type AuthFlowAsideProps = {
    eyebrow: string;
    title: string;
    description: string;
    steps: FlowStep[];
};

export function AuthFlowAside({ eyebrow, title, description, steps }: AuthFlowAsideProps) {
    return (
        <div className="w-full md:w-1/2 flex flex-col items-start justify-center order-last md:order-first pl-0 md:pl-2 pr-4">
            <img
                src={companyLogo}
                alt="Avyren Technologies"
                className="w-full max-w-[360px] h-auto object-contain -mt-16 -ml-9 mb-0"
            />

            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 -mt-6 mb-3">
                {eyebrow}
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-neutral-900 dark:text-white tracking-tight leading-tight mb-3 max-w-xl">
                {title}
            </h1>
            <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-md leading-relaxed mb-6">
                {description}
            </p>

            <div className="w-full max-w-md rounded-2xl bg-white/55 dark:bg-neutral-900/55 border border-neutral-200/60 dark:border-neutral-800/60 backdrop-blur-xl p-5 space-y-3">
                {steps.map((step, idx) => (
                    <div key={step.title} className="flex items-start gap-3">
                        <div
                            className={cn(
                                "mt-0.5 w-6 h-6 rounded-full border flex items-center justify-center transition-all",
                                step.state === "completed" && "bg-success-500 border-success-500 text-white",
                                step.state === "active" && "bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-500/20",
                                step.state === "upcoming" && "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 text-neutral-400"
                            )}
                        >
                            {step.state === "completed" ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : <span className="text-[10px] font-bold">{idx + 1}</span>}
                        </div>
                        <div className="min-w-0">
                            <p
                                className={cn(
                                    "text-sm font-bold",
                                    step.state === "active"
                                        ? "text-primary-700 dark:text-primary-300"
                                        : "text-neutral-800 dark:text-neutral-200"
                                )}
                            >
                                {step.title}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">
                                {step.desc}
                            </p>
                        </div>
                    </div>
                ))}

                <div className="pt-3 mt-3 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                        Secure reset links and one-time verification code are used for account safety.
                    </p>
                </div>
            </div>
        </div>
    );
}
