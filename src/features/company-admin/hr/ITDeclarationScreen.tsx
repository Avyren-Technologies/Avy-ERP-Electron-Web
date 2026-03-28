import { useState } from "react";
import {
    FileCheck,
    Plus,
    Eye,
    X,
    Loader2,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    Lock,
    ShieldCheck,
    ChevronDown,
    ChevronRight,
    IndianRupee,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useITDeclarations } from "@/features/company-admin/api/use-ess-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateITDeclaration,
    useSubmitITDeclaration,
    useVerifyITDeclaration,
    useLockITDeclaration,
} from "@/features/company-admin/api/use-ess-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const FY_OPTIONS = ["2025-26", "2024-25", "2023-24"];
const REGIME_OPTIONS = [
    { value: "old", label: "Old Regime" },
    { value: "new", label: "New Regime" },
];

const STATUS_FILTERS = ["All", "Draft", "Submitted", "Verified", "Locked"];

interface DeclarationSection {
    key: string;
    title: string;
    description: string;
    maxLimit?: number;
    fields: Array<{ key: string; label: string; placeholder?: string }>;
}

const DECLARATION_SECTIONS: DeclarationSection[] = [
    {
        key: "section80C",
        title: "Section 80C (Max 1,50,000)",
        description: "Life Insurance, PPF, ELSS, NSC, Tuition Fees, etc.",
        maxLimit: 150000,
        fields: [
            { key: "lifeInsurance", label: "Life Insurance Premium" },
            { key: "ppf", label: "PPF Contribution" },
            { key: "elss", label: "ELSS / Tax Saving Mutual Funds" },
            { key: "nsc", label: "NSC (National Savings Certificate)" },
            { key: "tuitionFees", label: "Tuition Fees (max 2 children)" },
            { key: "homeLoanPrincipal", label: "Home Loan Principal Repayment" },
            { key: "sukanyaSamriddhi", label: "Sukanya Samriddhi Yojana" },
            { key: "fixedDeposit", label: "5-Year Bank Fixed Deposit" },
        ],
    },
    {
        key: "section80D",
        title: "Section 80D - Medical Insurance",
        description: "Health insurance premiums and preventive health check-up",
        fields: [
            { key: "selfFamilyPremium", label: "Self & Family Premium (Max 25,000)" },
            { key: "parentsPremium", label: "Parents Premium (Max 50,000 if senior)" },
            { key: "preventiveCheckup", label: "Preventive Health Check-up (Max 5,000)" },
        ],
    },
    {
        key: "section80E",
        title: "Section 80E - Education Loan Interest",
        description: "Interest on education loan (no upper limit)",
        fields: [
            { key: "educationLoanInterest", label: "Education Loan Interest Paid" },
        ],
    },
    {
        key: "section80G",
        title: "Section 80G - Donations",
        description: "Donations to approved charitable institutions",
        fields: [
            { key: "donations100Percent", label: "100% Deduction Donations" },
            { key: "donations50Percent", label: "50% Deduction Donations" },
        ],
    },
    {
        key: "hra",
        title: "HRA Exemption",
        description: "House Rent Allowance exemption under Section 10(13A)",
        fields: [
            { key: "monthlyRent", label: "Monthly Rent Paid" },
            { key: "landlordName", label: "Landlord Name", placeholder: "Name of landlord" },
            { key: "landlordPan", label: "Landlord PAN (if rent > 1L/year)", placeholder: "ABCDE1234F" },
        ],
    },
    {
        key: "lta",
        title: "LTA - Leave Travel Allowance",
        description: "Travel expenses for leave period",
        fields: [
            { key: "ltaAmount", label: "LTA Claimed Amount" },
        ],
    },
    {
        key: "homeLoan",
        title: "Home Loan Interest - Section 24(b)",
        description: "Interest on home loan (Max 2,00,000 for self-occupied)",
        fields: [
            { key: "homeLoanInterest", label: "Home Loan Interest (Annual)" },
            { key: "lenderName", label: "Lender Name", placeholder: "Bank / Institution name" },
            { key: "loanAccountNo", label: "Loan Account Number", placeholder: "Account number" },
        ],
    },
    {
        key: "otherIncome",
        title: "Other Income / Deductions",
        description: "NPS (80CCD), savings interest (80TTA), etc.",
        fields: [
            { key: "nps80CCD1B", label: "NPS - 80CCD(1B) (Max 50,000)" },
            { key: "savingsInterest80TTA", label: "Savings Interest - 80TTA (Max 10,000)" },
            { key: "otherIncome", label: "Any Other Taxable Income" },
        ],
    },
];

/* ── Helpers ── */

function StatusBadge({ status }: { status: string }) {
    const s = status?.toLowerCase();
    const config: Record<string, { icon: typeof Clock; cls: string; label: string }> = {
        draft: { icon: Clock, cls: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700", label: "Draft" },
        submitted: { icon: CheckCircle2, cls: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50", label: "Submitted" },
        verified: { icon: ShieldCheck, cls: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50", label: "Verified" },
        locked: { icon: Lock, cls: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50", label: "Locked" },
    };
    const c = config[s] ?? config.draft;
    const Icon = c.icon;
    return (
        <span className={cn("inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border", c.cls)}>
            <Icon size={10} />
            {c.label}
        </span>
    );
}

function RegimeBadge({ regime }: { regime: string }) {
    const isOld = regime === "old";
    return (
        <span className={cn(
            "inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border",
            isOld
                ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
                : "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
        )}>
            {isOld ? "Old Regime" : "New Regime"}
        </span>
    );
}

const formatCurrency = (amount: number | string | undefined) => {
    const n = Number(amount ?? 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
};

/* ── Screen ── */

export function ITDeclarationScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [fyFilter, setFyFilter] = useState("");

    const { data, isLoading, isError } = useITDeclarations({
        status: statusFilter === "All" ? undefined : statusFilter.toLowerCase(),
        fy: fyFilter || undefined,
    });
    const employeesQuery = useEmployees();

    const createMutation = useCreateITDeclaration();
    const submitMutation = useSubmitITDeclaration();
    const verifyMutation = useVerifyITDeclaration();
    const lockMutation = useLockITDeclaration();

    const [modalOpen, setModalOpen] = useState(false);
    const [detailTarget, setDetailTarget] = useState<any>(null);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["section80C"]));

    const [form, setForm] = useState({
        employeeId: "",
        financialYear: FY_OPTIONS[0],
        regime: "old",
        declarations: {} as Record<string, any>,
    });

    const declarations: any[] = data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filtered = declarations.filter((d: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        const eName = employeeName(d.employeeId)?.toLowerCase();
        return eName?.includes(s);
    });

    const toggleSection = (key: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key); else next.add(key);
            return next;
        });
    };

    const updateDeclaration = (sectionKey: string, fieldKey: string, value: string) => {
        setForm((p) => ({
            ...p,
            declarations: {
                ...p.declarations,
                [sectionKey]: {
                    ...((p.declarations[sectionKey] as any) ?? {}),
                    [fieldKey]: value,
                },
            },
        }));
    };

    const runningTotal = DECLARATION_SECTIONS.reduce((total, section) => {
        const sectionData = (form.declarations[section.key] as any) ?? {};
        return total + section.fields.reduce((sum, field) => sum + (Number(sectionData[field.key]) || 0), 0);
    }, 0);

    const openCreate = () => {
        setForm({
            employeeId: "",
            financialYear: FY_OPTIONS[0],
            regime: "old",
            declarations: {},
        });
        setExpandedSections(new Set(["section80C"]));
        setModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Declaration Created", "IT Declaration has been saved as draft.");
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleSubmit = async (id: string) => {
        try {
            await submitMutation.mutateAsync(id);
            showSuccess("Declaration Submitted", "IT Declaration has been submitted for verification.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleVerify = async (id: string) => {
        try {
            await verifyMutation.mutateAsync(id);
            showSuccess("Declaration Verified", "IT Declaration has been verified.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleLock = async (id: string) => {
        try {
            await lockMutation.mutateAsync(id);
            showSuccess("Declaration Locked", "IT Declaration has been locked for payroll processing.");
        } catch (err) {
            showApiError(err);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">IT Declarations</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage employee income tax declarations (Form 12BB)</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    New Declaration
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search by employee..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
                <div className="flex items-center gap-4 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-2">
                        <Filter size={14} className="text-neutral-400 flex-shrink-0" />
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">Status:</span>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            {STATUS_FILTERS.map((f) => (<option key={f} value={f}>{f}</option>))}
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">FY:</span>
                        <select value={fyFilter} onChange={(e) => setFyFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            <option value="">All</option>
                            {FY_OPTIONS.map((fy) => (<option key={fy} value={fy}>{fy}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={6} />
                ) : isError ? (
                    <div className="p-8 text-center text-danger-600 dark:text-danger-400 font-medium">Failed to load declarations.</div>
                ) : filtered.length === 0 ? (
                    <EmptyState icon="list" title="No declarations found" message="Create a new IT declaration to get started." />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">FY</th>
                                    <th className="py-4 px-6 font-bold">Regime</th>
                                    <th className="py-4 px-6 font-bold text-right">Total Declared</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((d: any) => (
                                    <tr key={d.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">
                                                    {employeeName(d.employeeId).charAt(0)}
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{employeeName(d.employeeId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 font-mono text-xs">{d.financialYear ?? "—"}</td>
                                        <td className="py-4 px-6"><RegimeBadge regime={d.regime ?? "old"} /></td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(d.totalDeclared)}</td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={d.status ?? "Draft"} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailTarget(d)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View">
                                                    <Eye size={15} />
                                                </button>
                                                {d.status?.toLowerCase() === "draft" && (
                                                    <button onClick={() => handleSubmit(d.id)} disabled={submitMutation.isPending} className="px-2.5 py-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                                        Submit
                                                    </button>
                                                )}
                                                {d.status?.toLowerCase() === "submitted" && (
                                                    <button onClick={() => handleVerify(d.id)} disabled={verifyMutation.isPending} className="px-2.5 py-1.5 text-xs font-bold text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors">
                                                        Verify
                                                    </button>
                                                )}
                                                {d.status?.toLowerCase() === "verified" && (
                                                    <button onClick={() => handleLock(d.id)} disabled={lockMutation.isPending} className="px-2.5 py-1.5 text-xs font-bold text-warning-600 hover:bg-warning-50 dark:hover:bg-warning-900/20 rounded-lg transition-colors">
                                                        Lock
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── New Declaration Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New IT Declaration (Form 12BB)</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Top fields */}
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                    <select value={form.employeeId} onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        <option value="">Select employee...</option>
                                        {employees.map((e: any) => (<option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Financial Year</label>
                                    <select value={form.financialYear} onChange={(e) => setForm((p) => ({ ...p, financialYear: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {FY_OPTIONS.map((fy) => (<option key={fy} value={fy}>{fy}</option>))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Tax Regime</label>
                                    <select value={form.regime} onChange={(e) => setForm((p) => ({ ...p, regime: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {REGIME_OPTIONS.map((r) => (<option key={r.value} value={r.value}>{r.label}</option>))}
                                    </select>
                                </div>
                            </div>

                            {/* Running Total */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <IndianRupee size={16} className="text-primary-600 dark:text-primary-400" />
                                    <span className="text-sm font-bold text-primary-700 dark:text-primary-400">Total Declared</span>
                                </div>
                                <span className="text-xl font-bold text-primary-700 dark:text-primary-300 font-mono">{formatCurrency(runningTotal)}</span>
                            </div>

                            {/* Collapsible Sections */}
                            <div className="space-y-3">
                                {DECLARATION_SECTIONS.map((section) => {
                                    const isExpanded = expandedSections.has(section.key);
                                    const sectionData = (form.declarations[section.key] as any) ?? {};
                                    const sectionTotal = section.fields.reduce((sum, f) => sum + (Number(sectionData[f.key]) || 0), 0);

                                    return (
                                        <div key={section.key} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                            <button
                                                onClick={() => toggleSection(section.key)}
                                                className="w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? <ChevronDown size={16} className="text-neutral-400" /> : <ChevronRight size={16} className="text-neutral-400" />}
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-primary-950 dark:text-white">{section.title}</p>
                                                        <p className="text-[10px] text-neutral-400 dark:text-neutral-500">{section.description}</p>
                                                    </div>
                                                </div>
                                                {sectionTotal > 0 && (
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 font-mono">{formatCurrency(sectionTotal)}</span>
                                                )}
                                            </button>
                                            {isExpanded && (
                                                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-neutral-200 dark:border-neutral-700">
                                                    {section.fields.map((field) => (
                                                        <div key={field.key} className="flex items-center gap-3">
                                                            <label className="text-xs text-neutral-600 dark:text-neutral-400 w-1/2 truncate">{field.label}</label>
                                                            <input
                                                                type={field.placeholder ? "text" : "number"}
                                                                value={sectionData[field.key] ?? ""}
                                                                onChange={(e) => updateDeclaration(section.key, field.key, e.target.value)}
                                                                placeholder={field.placeholder ?? "0"}
                                                                className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all text-right"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Save as Draft
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Declaration Details</h2>
                            <button onClick={() => setDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs text-neutral-400 uppercase font-semibold">Status</span>
                                <StatusBadge status={detailTarget.status ?? "Draft"} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Employee</span>
                                    <p className="font-bold text-primary-950 dark:text-white">{employeeName(detailTarget.employeeId)}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Financial Year</span>
                                    <p className="font-bold text-primary-950 dark:text-white">{detailTarget.financialYear}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Regime</span>
                                    <RegimeBadge regime={detailTarget.regime ?? "old"} />
                                </div>
                                <div>
                                    <span className="text-xs text-neutral-400 block mb-0.5">Total Declared</span>
                                    <p className="font-bold text-primary-950 dark:text-white font-mono">{formatCurrency(detailTarget.totalDeclared)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
