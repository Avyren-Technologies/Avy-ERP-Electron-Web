import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
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
    MessageSquare,
    BookOpen,
    Rocket,
    ArrowRight,
    Plus,
    Filter,
    Loader2,
    X,
    Ticket,
    Send,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    useSupportTickets,
    useCreateSupportTicket,
} from "@/features/company-admin/api";
import { showSuccess, showApiError } from "@/lib/toast";
import { useTicketSocket } from "@/hooks/useTicketSocket";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface SupportTicket {
    id: string;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdByName: string;
    metadata?: Record<string, unknown> | null;
    messages?: Array<{
        id: string;
        body: string;
        senderName: string;
        senderRole: string;
        isSystemMessage: boolean;
        createdAt: string;
    }>;
    createdAt: string;
    updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const STATUS_OPTIONS = [
    { value: "", label: "All" },
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "WAITING_ON_CUSTOMER", label: "Waiting" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
] as const;

const CATEGORY_OPTIONS = [
    { value: "", label: "All" },
    { value: "MODULE_CHANGE", label: "Module Change" },
    { value: "BILLING", label: "Billing" },
    { value: "TECHNICAL", label: "Technical" },
    { value: "GENERAL", label: "General" },
] as const;

const STATUS_BADGE_CLASSES: Record<string, string> = {
    OPEN: "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300",
    IN_PROGRESS: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    WAITING_ON_CUSTOMER: "bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300",
    RESOLVED: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
    CLOSED: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
};

const CATEGORY_CHIP_CLASSES: Record<string, string> = {
    MODULE_CHANGE: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
    BILLING: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
    TECHNICAL: "bg-danger-100 text-danger-700 dark:bg-danger-900/40 dark:text-danger-300",
    GENERAL: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
};

const STATUS_LABELS: Record<string, string> = {
    OPEN: "Open",
    IN_PROGRESS: "In Progress",
    WAITING_ON_CUSTOMER: "Waiting",
    RESOLVED: "Resolved",
    CLOSED: "Closed",
};

const CATEGORY_LABELS: Record<string, string> = {
    MODULE_CHANGE: "Module Change",
    BILLING: "Billing",
    TECHNICAL: "Technical",
    GENERAL: "General",
};

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
        description: "Set up your department hierarchy — e.g. Engineering, Finance, HR.",
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
        answer: "You can update the Number Series configuration at any time under Configuration \u2192 No. Series. However, already-generated employee IDs will not change — only new employees will use the updated format.",
    },
    {
        question: "What is the difference between a Location and a Department?",
        answer: "A Location represents a physical place — a factory, office, warehouse, or branch. A Department represents an organisational unit — like Engineering, HR, or Finance. Employees are assigned to both: a location (where they work) and a department (what team they belong to).",
    },
    {
        question: "How do I set up shifts for attendance tracking?",
        answer: "Go to Company \u2192 Shifts to define shift schedules with start time, end time, and break durations. Shifts are optional — if your company follows standard 9-to-5 hours, you can skip this step. Shifts become important when you enable attendance tracking or have multiple work schedules.",
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
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function relativeTime(dateStr: string, fmt: ReturnType<typeof useCompanyFormatter>): string {
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffMs = now - then;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 30) return `${diffDay}d ago`;
    return fmt.date(dateStr);
}

/* ------------------------------------------------------------------ */
/*  Sub-components — Setup Guide                                       */
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
/*  Sub-components — Tickets                                           */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: string }) {
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-bold uppercase rounded-full", STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.OPEN)}>
            {STATUS_LABELS[status] ?? status}
        </span>
    );
}

function CategoryChip({ category }: { category: string }) {
    return (
        <span className={cn("px-2 py-0.5 text-[10px] font-semibold rounded-md", CATEGORY_CHIP_CLASSES[category] ?? CATEGORY_CHIP_CLASSES.GENERAL)}>
            {CATEGORY_LABELS[category] ?? category}
        </span>
    );
}

function TicketCard({ ticket, onClick }: { ticket: SupportTicket; onClick: () => void }) {
    const fmt = useCompanyFormatter();
    const lastMessage = ticket.messages?.length
        ? ticket.messages[ticket.messages.length - 1]
        : null;

    return (
        <button
            onClick={onClick}
            className="w-full text-left bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 transition-all group"
        >
            <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {ticket.subject}
                </h3>
                <span className="text-[11px] text-neutral-400 whitespace-nowrap flex-shrink-0">
                    {relativeTime(ticket.updatedAt, fmt)}
                </span>
            </div>

            <div className="flex items-center gap-2 mb-3">
                <CategoryChip category={ticket.category} />
                <StatusBadge status={ticket.status} />
            </div>

            {lastMessage && !lastMessage.isSystemMessage && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1">
                    <span className="font-medium text-neutral-600 dark:text-neutral-300">{lastMessage.senderName}:</span>{" "}
                    {lastMessage.body}
                </p>
            )}
        </button>
    );
}

/* ------------------------------------------------------------------ */
/*  Create Ticket Modal                                                */
/* ------------------------------------------------------------------ */

function CreateTicketModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [subject, setSubject] = useState("");
    const [category, setCategory] = useState("GENERAL");
    const [message, setMessage] = useState("");
    const createMutation = useCreateSupportTicket();

    if (!open) return null;

    const canSubmit = subject.trim().length > 0 && message.trim().length > 0;

    function handleSubmit() {
        if (!canSubmit) return;
        createMutation.mutate(
            { subject: subject.trim(), category, message: message.trim() },
            {
                onSuccess: () => {
                    showSuccess("Ticket created", "Our support team will get back to you shortly.");
                    setSubject("");
                    setCategory("GENERAL");
                    setMessage("");
                    onClose();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200/60 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">New Support Ticket</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Subject */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                            Subject
                        </label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            placeholder="Brief description of your issue"
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        />
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                            Category
                        </label>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
                        >
                            <option value="GENERAL">General</option>
                            <option value="BILLING">Billing</option>
                            <option value="TECHNICAL">Technical</option>
                            <option value="MODULE_CHANGE">Module Change</option>
                        </select>
                    </div>

                    {/* Message */}
                    <div>
                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                            Message
                        </label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Describe your issue in detail..."
                            rows={4}
                            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200/60 dark:border-neutral-800">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || createMutation.isPending}
                        className={cn(
                            "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                            canSubmit && !createMutation.isPending
                                ? "bg-primary-600 text-white hover:bg-primary-700"
                                : "bg-neutral-200 text-neutral-400 cursor-not-allowed dark:bg-neutral-700 dark:text-neutral-500",
                        )}
                    >
                        {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        Submit Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tab: My Tickets                                                    */
/* ------------------------------------------------------------------ */

function MyTicketsTab() {
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [showCreateModal, setShowCreateModal] = useState(false);

    const { data, isLoading } = useSupportTickets({
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
    });

    const tickets: SupportTicket[] = data?.tickets ?? data?.data ?? (Array.isArray(data) ? data : []);

    return (
        <div className="space-y-5">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <Filter className="w-4 h-4 text-neutral-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {STATUS_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                        {CATEGORY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    New Ticket
                </button>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-primary-500 animate-spin" />
                </div>
            )}

            {/* Empty state */}
            {!isLoading && tickets.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4">
                        <Ticket className="w-8 h-8 text-neutral-300 dark:text-neutral-600" />
                    </div>
                    <h3 className="text-base font-bold text-neutral-700 dark:text-neutral-300 mb-1">No tickets yet</h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-xs">
                        Create a support ticket to get help from our team. We typically respond within a few hours.
                    </p>
                </div>
            )}

            {/* Ticket list */}
            {!isLoading && tickets.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tickets.map((ticket) => (
                        <TicketCard
                            key={ticket.id}
                            ticket={ticket}
                            onClick={() => navigate(`/app/help/ticket/${ticket.id}`)}
                        />
                    ))}
                </div>
            )}

            <CreateTicketModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Tab: Help Center                                                   */
/* ------------------------------------------------------------------ */

function HelpCenterTab() {
    return (
        <div className="space-y-8">
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
                        Complete the <span className="font-semibold">required</span> steps (1{"–"}5, 9, 11) before creating employees.
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
                        Once all required steps are complete, you can start onboarding employees from HR {"\u2192"} Employees.
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
                                Mon{"–"}Fri, 9:00 AM {"–"} 6:00 PM IST
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main Screen                                                        */
/* ------------------------------------------------------------------ */

export function HelpSupportScreen() {
    const fmt = useCompanyFormatter();
    const [activeTab, setActiveTab] = useState<"tickets" | "help">("tickets");

    useTicketSocket(undefined, undefined, false);

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl">
            {/* ---- Header ---- */}
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight flex items-center gap-3">
                    <HelpCircle className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    Help & Support
                </h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                    Manage support tickets and find answers to common questions.
                </p>
            </div>

            {/* ---- Tab Bar ---- */}
            <div className="flex items-center gap-2 bg-neutral-100 dark:bg-neutral-800/60 rounded-xl p-1 w-fit">
                <button
                    onClick={() => setActiveTab("tickets")}
                    className={cn(
                        "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                        activeTab === "tickets"
                            ? "bg-primary-600 text-white shadow-sm"
                            : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white",
                    )}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4" />
                        My Tickets
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab("help")}
                    className={cn(
                        "px-4 py-2 text-sm font-semibold rounded-lg transition-colors",
                        activeTab === "help"
                            ? "bg-primary-600 text-white shadow-sm"
                            : "text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white",
                    )}
                >
                    <span className="inline-flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4" />
                        Help Center
                    </span>
                </button>
            </div>

            {/* ---- Tab Content ---- */}
            {activeTab === "tickets" ? <MyTicketsTab /> : <HelpCenterTab />}
        </div>
    );
}
