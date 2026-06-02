import { useNavigate } from "react-router-dom";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import {
    ClipboardList,
    FileText,
    Landmark,
    ArrowRight,
    Check,
    FileSpreadsheet,
    Receipt,
    CreditCard,
    Building2,
    ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StepProps {
    runId: string;
    runDetail: any;
    completedStep: number;
    onStepAction: () => void;
    anyMutating: boolean;
}

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: unknown) => `₹${(Number(v) || 0).toLocaleString("en-IN")}`;

const REPORT_CARDS = [
    {
        icon: FileSpreadsheet,
        title: "Salary Register",
        description: "Complete salary breakdown for all employees",
        href: "/app/company/hr/payroll-reports",
    },
    {
        icon: Landmark,
        title: "Bank File",
        description: "Bank transfer file for salary disbursement",
        href: "/app/company/hr/payroll-reports",
    },
    {
        icon: Building2,
        title: "PF ECR",
        description: "Provident Fund Electronic Challan cum Return",
        href: "/app/company/hr/payroll-reports",
    },
    {
        icon: Receipt,
        title: "ESI Challan",
        description: "Employee State Insurance contribution challan",
        href: "/app/company/hr/payroll-reports",
    },
    {
        icon: CreditCard,
        title: "PT Challan",
        description: "Professional Tax payment challan",
        href: "/app/company/hr/payroll-reports",
    },
    {
        icon: FileText,
        title: "Payslips",
        description: "View and download employee payslips",
        href: "/app/company/hr/payslips",
    },
];

const STATUTORY_CHECKLIST = [
    { label: "PF ECR Filing", key: "pf_ecr" },
    { label: "ESI Filing", key: "esi" },
    { label: "PT Filing", key: "pt" },
    { label: "TDS 24Q (Quarterly)", key: "tds_24q" },
];

export function Step7PostPayroll({ runDetail }: StepProps) {
    const navigate = useNavigate();
    const fmt = useCompanyFormatter();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center">
                    <ClipboardList size={20} className="text-accent-600 dark:text-accent-400" />
                </div>
                <div>
                    <h3 className="font-bold text-primary-950 dark:text-white">Post-Payroll Activities</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Generate reports, file statutory returns, and review the payroll summary</p>
                </div>
            </div>

            {/* Reports Section */}
            <div>
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Reports</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {REPORT_CARDS.map((card) => {
                        const Icon = card.icon;
                        return (
                            <button
                                key={card.title}
                                onClick={() => navigate(card.href)}
                                className="group text-left bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 p-4 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md hover:shadow-primary-500/5 transition-all"
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div className="w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                        <Icon size={16} className="text-primary-600 dark:text-primary-400" />
                                    </div>
                                    <ArrowRight size={14} className="text-neutral-300 dark:text-neutral-600 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors mt-1" />
                                </div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">{card.title}</p>
                                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5 leading-relaxed">{card.description}</p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Statutory Filing Checklist */}
            <div>
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Statutory Filing Checklist</h4>
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 p-5">
                    <div className="space-y-3">
                        {STATUTORY_CHECKLIST.map((item) => (
                            <div key={item.key} className="flex items-center gap-3">
                                <div className="w-5 h-5 rounded border-2 border-neutral-300 dark:border-neutral-600 flex items-center justify-center flex-shrink-0">
                                    {/* Placeholder: unchecked */}
                                </div>
                                <span className="text-sm text-neutral-700 dark:text-neutral-300 font-medium">{item.label}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
                                    Pending
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                        <a
                            href="/app/company/hr/statutory-filings"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
                        >
                            <ExternalLink size={12} />
                            Configure in Statutory Filings
                        </a>
                    </div>
                </div>
            </div>

            {/* Payroll Summary */}
            <div>
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">Payroll Summary</h4>
                <div className="bg-success-50/50 dark:bg-success-900/10 rounded-xl border border-success-100 dark:border-success-800/50 p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Check size={18} className="text-success-600 dark:text-success-400" />
                        <span className="text-sm font-bold text-success-700 dark:text-success-400">Payroll Completed</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            {
                                label: "Period",
                                value: `${MONTHS[(runDetail?.month ?? 1) - 1]} ${runDetail?.year ?? ""}`,
                            },
                            {
                                label: "Total Employees",
                                value: String(runDetail?.employeeCount ?? 0),
                            },
                            {
                                label: "Gross Pay",
                                value: formatCurrency(runDetail?.totalGross ?? 0),
                            },
                            {
                                label: "Net Pay",
                                value: formatCurrency(runDetail?.totalNet ?? runDetail?.totalNetPay ?? 0),
                            },
                            {
                                label: "Disbursed On",
                                value: runDetail?.disbursedAt ? fmt.date(runDetail.disbursedAt) : "-",
                            },
                        ].map((item) => (
                            <div key={item.label} className="text-center">
                                <span className="text-[10px] font-bold text-success-600/70 dark:text-success-400/60 uppercase tracking-wider">{item.label}</span>
                                <p className={cn("text-sm font-extrabold mt-1 font-mono", item.label === "Period" ? "text-success-800 dark:text-success-300" : "text-success-700 dark:text-success-300")}>
                                    {item.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
