import { useState } from "react";
import {
    HelpCircle,
    Building2,
    MapPin,
    Network,
    Briefcase,
    Users,
    BarChart3,
    Clock,
    Wallet,
    Shield,
    Hash,
    UserPlus,
    ChevronDown,
    ChevronRight,
    CheckCircle2,
    Info,
    Mail,
    Phone,
    MessageCircle,
    BookOpen,
    Rocket,
    ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Setup Steps Data                                                   */
/* ------------------------------------------------------------------ */

interface SetupStep {
    number: number;
    title: string;
    description: string;
    navHint: string;
    required: boolean;
    icon: React.ElementType;
    route: string;
}

const SETUP_STEPS: SetupStep[] = [
    {
        number: 1,
        title: "Company Profile",
        description: "Review and complete your company details, statutory info, and preferences.",
        navHint: "Company \u2192 Profile",
        required: true,
        icon: Building2,
        route: "/app/company/profile",
    },
    {
        number: 2,
        title: "Create Locations",
        description: "Add your plant, branch, and office locations where employees will be assigned.",
        navHint: "HR \u2192 Locations",
        required: true,
        icon: MapPin,
        route: "/app/company/locations",
    },
    {
        number: 3,
        title: "Create Departments",
        description: "Set up your department hierarchy \u2014 e.g. Engineering, Finance, HR.",
        navHint: "HR \u2192 Departments",
        required: true,
        icon: Network,
        route: "/app/company/hr/departments",
    },
    {
        number: 4,
        title: "Create Designations",
        description: "Define job titles like Manager, Engineer, Analyst used across the organisation.",
        navHint: "HR \u2192 Designations",
        required: true,
        icon: Briefcase,
        route: "/app/company/hr/designations",
    },
    {
        number: 5,
        title: "Create Employee Types",
        description: "Define employment categories such as Full-time, Part-time, Contract, Intern.",
        navHint: "HR \u2192 Employee Types",
        required: true,
        icon: Users,
        route: "/app/company/hr/employee-types",
    },
    {
        number: 6,
        title: "Create Grades",
        description: "Set up grade levels with probation periods for structured career progression.",
        navHint: "HR \u2192 Grades",
        required: false,
        icon: BarChart3,
        route: "/app/company/hr/grades",
    },
    {
        number: 7,
        title: "Set Up Shifts",
        description: "Configure work shifts with start/end times for attendance tracking.",
        navHint: "Company \u2192 Shifts",
        required: false,
        icon: Clock,
        route: "/app/company/shifts",
    },
    {
        number: 8,
        title: "Create Cost Centres",
        description: "Define cost centres for budgeting and expense allocation across departments.",
        navHint: "HR \u2192 Cost Centres",
        required: false,
        icon: Wallet,
        route: "/app/company/hr/cost-centres",
    },
    {
        number: 9,
        title: "Configure Roles & Permissions",
        description: "Create roles with fine-grained permissions for user accounts and access control.",
        navHint: "People & Access \u2192 Roles",
        required: true,
        icon: Shield,
        route: "/app/company/roles",
    },
    {
        number: 10,
        title: "Configure Number Series",
        description: "Set up the employee ID format (e.g. EMP-0001) for auto-generated IDs.",
        navHint: "Configuration \u2192 No. Series",
        required: false,
        icon: Hash,
        route: "/app/company/no-series",
    },
    {
        number: 11,
        title: "Onboard Employees",
        description: "You're all set! Start creating employee records with all the master data in place.",
        navHint: "HR \u2192 Employees \u2192 Create",
        required: true,
        icon: UserPlus,
        route: "/app/company/hr/employees",
    },
];

/* ------------------------------------------------------------------ */
/*  FAQ Data                                                           */
/* ------------------------------------------------------------------ */

interface FaqItem {
    question: string;
    answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
    {
        question: "How do I create an employee?",
        answer: "Navigate to HR \u2192 Employees and click the \"Add Employee\" button. You will need to have at least one Location, Department, Designation, and Employee Type created before you can fill out the employee form. The employee ID is auto-generated based on your Number Series configuration.",
    },
    {
        question: "What is a Grade and do I need one?",
        answer: "A Grade represents a level in your organisation's hierarchy (e.g. L1, L2, Senior, Principal). Grades are optional but useful for structuring probation periods, salary bands, and career progression paths. You can always add them later.",
    },
    {
        question: "How do Roles & Permissions work?",
        answer: "Roles are collections of permissions that control what users can see and do in the system. Each permission follows a module:action format (e.g. hr:read, hr:create). You can create custom roles or start from reference templates. Assign roles to users when creating or editing their accounts.",
    },
    {
        question: "Can I change the employee ID format later?",
        answer: "You can update the Number Series configuration at any time under Configuration \u2192 No. Series. However, already-generated employee IDs will not change \u2014 only new employees will use the updated format.",
    },
    {
        question: "What is the difference between a Location and a Department?",
        answer: "A Location represents a physical place \u2014 a factory, office, warehouse, or branch. A Department represents an organisational unit \u2014 like Engineering, HR, or Finance. Employees are assigned to both: a location (where they work) and a department (what team they belong to).",
    },
    {
        question: "How do I set up shifts for attendance tracking?",
        answer: "Go to Company \u2192 Shifts to define shift schedules with start time, end time, and break durations. Shifts are optional \u2014 if your company follows standard 9-to-5 hours, you can skip this step. Shifts become important when you enable attendance tracking or have multiple work schedules.",
    },
    {
        question: "What are Cost Centres used for?",
        answer: "Cost Centres help you track expenses and budgets by grouping employees or departments under specific financial units. They are optional and primarily useful for companies that need detailed cost allocation and financial reporting.",
    },
    {
        question: "Can I import employees in bulk?",
        answer: "Bulk import via CSV/Excel is planned for a future release. Currently, employees need to be added one at a time through the employee creation form. Contact support if you need assistance with large-scale onboarding.",
    },
];

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StepCard({ step }: { step: SetupStep }) {
    const Icon = step.icon;
    const isLast = step.number === SETUP_STEPS.length;

    return (
        <div className="group relative flex gap-4 pb-8 last:pb-0">
            {/* Connector line */}
            {!isLast && (
                <div className="absolute left-[1.375rem] top-12 bottom-0 w-px bg-gradient-to-b from-primary-300 to-primary-100 dark:from-primary-700 dark:to-primary-900" />
            )}

            {/* Step number badge */}
            <div className="relative z-10 flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-500/25 dark:shadow-primary-500/10 group-hover:scale-110 transition-transform">
                {step.number}
            </div>

            {/* Content */}
            <div className="flex-1 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2.5 mb-1.5">
                            <Icon className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0" />
                            <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                                {step.title}
                            </h3>
                            {step.required ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300 flex-shrink-0">
                                    Required
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 flex-shrink-0">
                                    Optional
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                            {step.description}
                        </p>
                    </div>

                    <a
                        href={step.route}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 whitespace-nowrap transition-colors group/link"
                    >
                        {step.navHint}
                        <ArrowRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                </div>
            </div>
        </div>
    );
}

function FaqAccordion({ item }: { item: FaqItem }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="border-b border-neutral-200/60 dark:border-neutral-800 last:border-b-0">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between gap-4 py-4 px-1 text-left group"
            >
                <span className="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {item.question}
                </span>
                {open ? (
                    <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                )}
            </button>
            {open && (
                <div className="pb-4 px-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {item.answer}
                    </p>
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export function HelpSupportScreen() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl">
            {/* ---- Header ---- */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    Help & Support
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Everything you need to get started with your company setup and employee onboarding.
                </p>
            </div>

            {/* ---- Quick Start Guide ---- */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl overflow-hidden">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-950/30 dark:to-accent-950/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25 dark:shadow-primary-500/10">
                            <Rocket className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                Quick Start Guide
                            </h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Follow these steps in order to set up your company before onboarding employees.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Info Banner */}
                <div className="mx-6 mt-5 flex items-start gap-3 p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/30 border border-primary-200/60 dark:border-primary-800/40">
                    <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-primary-700 dark:text-primary-300 leading-relaxed">
                        Complete the <span className="font-semibold">required</span> steps (1\u20135, 9, 11) before creating employees.
                        Optional steps can be configured at any time.
                    </p>
                </div>

                {/* Steps */}
                <div className="px-6 py-6">
                    {SETUP_STEPS.map((step) => (
                        <StepCard key={step.number} step={step} />
                    ))}
                </div>

                {/* Completion note */}
                <div className="mx-6 mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/60 dark:border-green-800/40">
                    <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        Once all required steps are complete, you can start onboarding employees from HR \u2192 Employees.
                    </p>
                </div>
            </div>

            {/* ---- FAQ Section ---- */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center shadow-lg shadow-accent-500/25 dark:shadow-accent-500/10">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                Frequently Asked Questions
                            </h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Common questions about setup and employee management.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-6 py-2">
                    {FAQ_ITEMS.map((item, idx) => (
                        <FaqAccordion key={idx} item={item} />
                    ))}
                </div>
            </div>

            {/* ---- Contact Support ---- */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl overflow-hidden">
                <div className="px-6 py-5 border-b border-neutral-200/60 dark:border-neutral-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/25 dark:shadow-primary-500/10">
                            <MessageCircle className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                                Contact Support
                            </h2>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Need help? Reach out to our support team.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Email */}
                    <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/50">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                            <Mail className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Email</p>
                            <a
                                href="mailto:support@avyerp.com"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                                support@avyerp.com
                            </a>
                        </div>
                    </div>

                    {/* Phone */}
                    <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/50">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                            <Phone className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Phone</p>
                            <a
                                href="tel:+918001234567"
                                className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                            >
                                +91 800-123-4567
                            </a>
                        </div>
                    </div>

                    {/* Working Hours */}
                    <div className="flex items-start gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-700/50">
                        <div className="w-9 h-9 rounded-lg bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-4.5 h-4.5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-neutral-900 dark:text-white">Working Hours</p>
                            <p className="text-sm text-neutral-600 dark:text-neutral-400">
                                Mon\u2013Fri, 9:00 AM \u2013 6:00 PM IST
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
