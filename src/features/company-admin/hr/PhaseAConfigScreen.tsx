import {
    Banknote,
    Building2,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronRight,
    Circle,
    Clock3,
    FileCheck2,
    FileSpreadsheet,
    HelpCircle,
    Info,
    Landmark,
    Lock,
    Menu,
    Network,
    Percent,
    Phone,
    ShieldCheck,
    UserPlus,
    Users,
    WalletCards,
    IndianRupee,
    Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "completed" | "in-progress" | "pending" | "not-started";

interface ConfigurationStep {
    id: number;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    iconTone: string;
    title: string;
    description: string;
    estimate: string;
    status: StepStatus;
    lastUpdated: string;
    updatedBy: string;
    role: string;
    action: string;
    locked?: boolean;
    isNew?: boolean;
}

const steps: ConfigurationStep[] = [
    {
        id: 1,
        icon: Network,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Configure organisational structure",
        description: "Set up departments, designations and grades.",
        estimate: "~ 10 min",
        status: "completed",
        lastUpdated: "15 Apr 2025",
        updatedBy: "Amit Tiwari",
        role: "HR Executive",
        action: "View Details",
    },
    {
        id: 2,
        icon: Users,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Set up employee master records",
        description: "Create employee profiles with bank account details.",
        estimate: "~ 20 min",
        status: "completed",
        lastUpdated: "18 Apr 2025",
        updatedBy: "Sneha Kapoor",
        role: "HR Executive",
        action: "View Details",
    },
    {
        id: 3,
        icon: IndianRupee,
        iconTone: "text-success-700 bg-success-50",
        title: "Define salary component master",
        description: "Define earnings and deduction components.",
        estimate: "~ 25 min",
        status: "completed",
        lastUpdated: "20 Apr 2025",
        updatedBy: "Devansh Kumar",
        role: "HR Executive",
        action: "View Details",
    },
    {
        id: 4,
        icon: FileSpreadsheet,
        iconTone: "text-info-600 bg-info-50",
        title: "Create salary structure templates",
        description: "Create templates per grade/designation/employment type.",
        estimate: "~ 45 min",
        status: "in-progress",
        lastUpdated: "29 Apr 2025",
        updatedBy: "Rajiv Kumar",
        role: "HR Manager",
        action: "Continue Setup",
        locked: true,
    },
    {
        id: 5,
        icon: UserPlus,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Assign CTC and salary structure to each employee",
        description: "Assign CTC and applicable structure to each employee.",
        estimate: "~ 30 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
    {
        id: 6,
        icon: ShieldCheck,
        iconTone: "text-info-600 bg-info-50",
        title: "Configure statutory rules",
        description: "Configure PF, ESI, PT, LWF, Gratuity and Bonus rules.",
        estimate: "~ 45 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
    {
        id: 7,
        icon: Percent,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Configure TDS tax regime & open IT declaration window",
        description: "Configure TDS tax regime and open IT declaration window.",
        estimate: "~ 20 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
    {
        id: 8,
        icon: FileCheck2,
        iconTone: "text-info-600 bg-info-50",
        title: "Collect and process employee IT declarations (Form 12BB)",
        description: "Collect and process employee IT declarations.",
        estimate: "~ 30 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
    {
        id: 9,
        icon: Landmark,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Configure bank disbursement settings",
        description: "Set payment mode, bank accounts and bank file format.",
        estimate: "~ 30 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
    {
        id: 10,
        icon: WalletCards,
        iconTone: "text-info-600 bg-info-50",
        title: "Configure loan policy (Loan Types & Rules)",
        description: "Define loan types, limits, tenure, interest rate, EMI cap %, eligibility and approval levels.",
        estimate: "~ 40 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
        isNew: true,
    },
    {
        id: 11,
        icon: Settings,
        iconTone: "text-primary-600 bg-primary-50",
        title: "Set payroll run configuration",
        description: "Configure cut-off day, LOP method, pro-rata rules, rounding rules and variance alert threshold.",
        estimate: "~ 30 min",
        status: "pending",
        lastUpdated: "-",
        updatedBy: "-",
        role: "",
        action: "Start Setup",
        locked: true,
    },
];

const quickLinks = [
    "Organisation Structure",
    "Salary Component Master",
    "Salary Structure Templates",
    "Statutory Configuration",
    "Bank Master",
    "Loan Policy Configuration",
    "Payroll Run Configuration",
    "IT Declaration Settings",
];

const benefits = [
    "Accurate salary computation",
    "Statutory compliance",
    "Reduced payroll errors",
    "Faster payroll processing",
    "Audit ready setup",
];

const statusConfig: Record<StepStatus, { label: string; className: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = {
    completed: {
        label: "Completed",
        className: "border-success-200 bg-success-50 text-success-700",
        icon: Check,
    },
    "in-progress": {
        label: "In Progress",
        className: "border-warning-200 bg-warning-50 text-warning-700",
        icon: Circle,
    },
    pending: {
        label: "Pending",
        className: "border-accent-200 bg-accent-50 text-accent-700",
        icon: Clock3,
    },
    "not-started": {
        label: "Not Started",
        className: "border-neutral-200 bg-neutral-50 text-neutral-600",
        icon: Circle,
    },
};

function StatusBadge({ status }: { status: StepStatus }) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span className={cn("inline-flex min-w-[112px] items-center justify-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-bold", config.className)}>
            <Icon size={13} className={status === "completed" ? "" : "fill-transparent"} />
            {config.label}
        </span>
    );
}

function SummaryTile({
    value,
    label,
    className,
}: {
    value: string;
    label: string;
    className: string;
}) {
    return (
        <div className={cn("flex min-h-[92px] flex-col items-center justify-center rounded-lg border px-5 text-center", className)}>
            <div className="text-3xl font-bold leading-none">{value}</div>
            <div className="mt-3 text-sm font-semibold">{label}</div>
        </div>
    );
}

function InfoCard({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-base font-bold text-primary-950 dark:text-white">{title}</h2>
            <div className="mt-4">{children}</div>
        </section>
    );
}

function Initials({ name }: { name: string }) {
    if (!name || name === "-") {
        return <span className="text-neutral-400">-</span>;
    }

    const initials = name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2);

    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-100 text-xs font-bold text-accent-700">
                {initials}
            </div>
            <div className="min-w-0">
                <div className="truncate text-xs font-bold text-primary-950 dark:text-white">{name}</div>
                <div className="truncate text-[11px] font-medium text-neutral-500">{steps.find((step) => step.updatedBy === name)?.role}</div>
            </div>
        </div>
    );
}

export function PhaseAConfigScreen() {
    const completed = steps.filter((step) => step.status === "completed").length;
    const inProgress = steps.filter((step) => step.status === "in-progress").length;
    const pending = steps.filter((step) => step.status === "pending").length;
    const notStarted = steps.filter((step) => step.status === "not-started").length;
    const progressPercent = Math.round((completed / steps.length) * 100);

    return (
        <div className="space-y-5 text-primary-950 dark:text-white">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0">
                    <div className="mb-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        <Menu size={18} className="mr-2 text-neutral-600 dark:text-neutral-300" />
                        <span>Payroll</span>
                        <ChevronRight size={14} />
                        <span>Payroll Configuration</span>
                        <ChevronRight size={14} />
                        <span className="text-primary-950 dark:text-white">Phase A - Configuration Prerequisites</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-normal text-primary-950 dark:text-white">
                            Phase A - Configuration Prerequisites
                        </h1>
                        <span className="rounded-lg bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            One-time Setup
                        </span>
                    </div>
                    <p className="mt-3 max-w-4xl text-sm font-medium leading-6 text-neutral-600 dark:text-neutral-300">
                        Complete all configuration prerequisites to ensure accurate, compliant and audit-ready payroll processing.
                    </p>
                </div>
                <button className="inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-lg border border-primary-500 bg-white px-6 text-sm font-bold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 dark:bg-neutral-900 dark:hover:bg-primary-950/30">
                    Phase A Actions
                    <ChevronDown size={18} />
                </button>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_500px]">
                <section className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                    <div className="grid gap-4 lg:grid-cols-[250px_1fr]">
                        <div className="flex items-center justify-center gap-5 border-neutral-200 lg:justify-start lg:border-r dark:border-neutral-800">
                            <div
                                className="flex h-28 w-28 items-center justify-center rounded-full"
                                style={{
                                    background: `conic-gradient(#059669 ${progressPercent * 3.6}deg, #E5E7EB 0deg)`,
                                }}
                                aria-label={`${completed} of ${steps.length} steps completed`}
                            >
                                <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white dark:bg-neutral-900">
                                    <span className="text-2xl font-bold">{completed}/{steps.length}</span>
                                    <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Completed</span>
                                </div>
                            </div>
                            <div>
                                <div className="text-base font-bold leading-tight">Overall</div>
                                <div className="text-base font-bold leading-tight">Progress</div>
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryTile value={String(completed)} label="Completed" className="border-success-200 bg-success-50 text-success-700" />
                            <SummaryTile value={String(inProgress)} label="In Progress" className="border-warning-200 bg-warning-50 text-warning-700" />
                            <SummaryTile value={String(pending)} label="Pending" className="border-accent-200 bg-accent-50 text-accent-700" />
                            <SummaryTile value={String(notStarted)} label="Not Started" className="border-neutral-200 bg-neutral-50 text-neutral-600" />
                        </div>
                    </div>
                </section>

                <section className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:grid-cols-2">
                    <div className="flex items-center gap-5 border-neutral-200 sm:border-r dark:border-neutral-800">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                            <Clock3 size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Estimated Time (Remaining)</div>
                            <div className="mt-2 text-2xl font-bold">~ 2h 15m</div>
                            <div className="mt-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">Across 7 steps</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-5 sm:pl-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                            <CalendarDays size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Last Updated</div>
                            <div className="mt-2 text-2xl font-bold">30 Apr 2025</div>
                            <div className="mt-1 text-sm font-medium text-neutral-600 dark:text-neutral-400">by Rohit Sharma</div>
                        </div>
                    </div>
                </section>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-4">
                    <section className="overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex flex-col gap-3 border-b border-neutral-200 px-5 py-4 dark:border-neutral-800 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-base font-bold text-primary-950 dark:text-white">Configuration Steps (11)</h2>
                            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                                <span className="inline-flex items-center gap-2"><Lock size={14} /> Dependent on previous step</span>
                                <span className="inline-flex items-center gap-2"><Clock3 size={14} /> Estimated time</span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-[1080px] w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-neutral-200 bg-neutral-50 text-[11px] font-bold text-primary-950 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-200">
                                        <th className="w-14 px-5 py-3">#</th>
                                        <th className="w-[300px] px-4 py-3">Step</th>
                                        <th className="w-[300px] px-4 py-3">Description</th>
                                        <th className="w-28 px-4 py-3">Est. Time</th>
                                        <th className="w-36 px-4 py-3">Status</th>
                                        <th className="w-32 px-4 py-3">Last Updated</th>
                                        <th className="w-40 px-4 py-3">Updated By</th>
                                        <th className="w-36 px-4 py-3 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                                    {steps.map((step) => {
                                        const Icon = step.icon;
                                        return (
                                            <tr key={step.id} className="bg-white transition-colors hover:bg-neutral-50 dark:bg-neutral-900 dark:hover:bg-neutral-800/70">
                                                <td className="px-5 py-4 align-middle text-sm font-bold text-primary-950 dark:text-white">
                                                    <div className="flex items-center gap-1">
                                                        {step.id}
                                                        {step.locked && <Lock size={12} className="text-neutral-500" />}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", step.iconTone)}>
                                                            <Icon size={21} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-xs font-bold leading-5 text-primary-950 dark:text-white">{step.title}</span>
                                                                {step.isNew && (
                                                                    <span className="rounded bg-success-100 px-2 py-1 text-[10px] font-bold text-success-700">NEW</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-middle text-xs font-medium leading-5 text-primary-950 dark:text-neutral-200">
                                                    {step.description}
                                                </td>
                                                <td className="px-4 py-4 align-middle text-xs font-semibold text-neutral-600 dark:text-neutral-400">{step.estimate}</td>
                                                <td className="px-4 py-4 align-middle"><StatusBadge status={step.status} /></td>
                                                <td className="px-4 py-4 align-middle text-xs font-semibold text-primary-950 dark:text-neutral-200">{step.lastUpdated}</td>
                                                <td className="px-4 py-4 align-middle"><Initials name={step.updatedBy} /></td>
                                                <td className="px-4 py-4 align-middle text-right">
                                                    <button className="inline-flex items-center justify-end gap-2 text-xs font-bold text-primary-700 hover:text-primary-900 dark:text-primary-300">
                                                        {step.action}
                                                        <ChevronRight size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    <div className="flex items-center gap-3 rounded-lg border border-primary-100 bg-white px-5 py-4 text-sm font-medium text-neutral-600 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
                        <Info size={18} className="shrink-0 text-primary-600" />
                        Complete all 11 steps in Phase A before proceeding to Phase B - Pre-Run Activities.
                    </div>
                </div>

                <aside className="space-y-5">
                    <InfoCard title="About Phase A">
                        <div className="flex gap-3">
                            <Info size={22} className="mt-0.5 shrink-0 text-primary-600" />
                            <div>
                                <p className="text-sm font-medium leading-6 text-primary-950 dark:text-neutral-200">
                                    Phase A is a one-time configuration of masters, rules and preferences. Once completed, you can proceed to Phase B (Pre-Run Activities) every payroll cycle.
                                </p>
                                <button className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-700 dark:text-primary-300">
                                    Learn more
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    </InfoCard>

                    <InfoCard title="Key Benefits">
                        <ul className="space-y-3">
                            {benefits.map((benefit) => (
                                <li key={benefit} className="flex items-center gap-3 text-sm font-medium text-primary-950 dark:text-neutral-200">
                                    <CheckCircle2 size={17} className="shrink-0 fill-success-600 text-white" />
                                    {benefit}
                                </li>
                            ))}
                        </ul>
                    </InfoCard>

                    <InfoCard title="Quick Links">
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link}>
                                    <button className="inline-flex items-center gap-3 text-left text-sm font-semibold text-primary-700 hover:text-primary-900 dark:text-primary-300">
                                        <FileCheck2 size={16} />
                                        {link}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </InfoCard>

                    <section className="rounded-lg border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                        <div className="flex items-center gap-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-primary-600 text-primary-600">
                                <HelpCircle size={30} />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-primary-950 dark:text-white">Need Help?</h2>
                                <p className="mt-3 text-sm font-medium text-neutral-600 dark:text-neutral-300">Contact Payroll Support Team</p>
                                <a className="mt-3 block text-sm font-bold text-primary-700 dark:text-primary-300" href="mailto:payroll.support@avyerp.com">
                                    payroll.support@avyerp.com
                                </a>
                                <div className="mt-3 flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                    <Phone size={15} />
                                    +91 80 1234 5678
                                </div>
                            </div>
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
}
