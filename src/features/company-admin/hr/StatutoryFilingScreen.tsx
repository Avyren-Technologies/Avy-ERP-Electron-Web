import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    Stamp,
    Plus,
    Loader2,
    X,
    Search,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileCheck2,
    ArrowRightCircle,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useStatutoryFilings,
    useStatutoryDashboard,
} from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useCreateStatutoryFiling,
    useUpdateStatutoryFiling,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { SkeletonTable, SkeletonKPIGrid } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN")}`;
// formatDate moved inside component

const FILING_TYPES = [
    { value: "PF", label: "PF" },
    { value: "ESI", label: "ESI" },
    { value: "PT", label: "Professional Tax" },
    { value: "TDS", label: "TDS" },
    { value: "LWF", label: "LWF" },
];

function FilingTypeBadge({ type }: { type: string }) {
    const colorMap: Record<string, string> = {
        pf: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        esi: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        pt: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        tds: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        lwf: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    const cls = colorMap[type?.toLowerCase()] ?? colorMap.pf;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {type}
        </span>
    );
}

function FilingStatusBadge({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        pending: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        in_progress: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        filed: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        overdue: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        rejected: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[status?.toLowerCase()] ?? colorMap.pending;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {status?.replace(/_/g, " ") || "Pending"}
        </span>
    );
}

/* ── KPI Card ── */

interface KpiProps {
    label: string;
    value: number | string;
    icon: React.ComponentType<{ className?: string; size?: number }>;
    color: "success" | "warning" | "danger";
}

const kpiColorMap = {
    success: {
        bg: "bg-success-50 dark:bg-success-900/20",
        border: "border-success-100 dark:border-success-800/50",
        icon: "text-success-600 dark:text-success-400",
        value: "text-success-700 dark:text-success-400",
    },
    warning: {
        bg: "bg-warning-50 dark:bg-warning-900/20",
        border: "border-warning-100 dark:border-warning-800/50",
        icon: "text-warning-600 dark:text-warning-400",
        value: "text-warning-700 dark:text-warning-400",
    },
    danger: {
        bg: "bg-danger-50 dark:bg-danger-900/20",
        border: "border-danger-100 dark:border-danger-800/50",
        icon: "text-danger-600 dark:text-danger-400",
        value: "text-danger-700 dark:text-danger-400",
    },
};

function KpiCard({ label, value, icon: Icon, color }: KpiProps) {
    const c = kpiColorMap[color];
    return (
        <div className={cn("rounded-2xl border p-5", c.bg, c.border)}>
            <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{label}</span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", c.bg)}>
                    <Icon size={16} className={c.icon} />
                </div>
            </div>
            <p className={cn("text-3xl font-extrabold", c.value)}>{value}</p>
        </div>
    );
}

const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "in_progress", label: "In Progress" },
    { value: "filed", label: "Filed" },
    { value: "overdue", label: "Overdue" },
];

const EMPTY_FILING = {
    type: "PF",
    period: "",
    amount: 0,
    dueDate: "",
    notes: "",
};

/* ── Screen ── */

export function StatutoryFilingScreen() {
    const fmt = useCompanyFormatter();
    const formatDate = (d: string | null | undefined) => d ? fmt.date(d) : "—";
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_FILING });

    const dashboardQuery = useStatutoryDashboard();
    const filingsQuery = useStatutoryFilings({ status: statusFilter || undefined });
    const createMutation = useCreateStatutoryFiling();
    const updateMutation = useUpdateStatutoryFiling();

    const dashboard: any = dashboardQuery.data?.data ?? {};
    const filings: any[] = filingsQuery.data?.data ?? [];

    const filtered = filings.filter((f: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return f.type?.toLowerCase().includes(q) || f.period?.toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_FILING }); setModalOpen(true); };
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync(form);
            showSuccess("Filing Created", "Statutory filing has been created.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            await updateMutation.mutateAsync({ id, data: { status: newStatus } });
            showSuccess("Status Updated", `Filing status changed to ${newStatus.replace(/_/g, " ")}.`);
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Statutory Filings</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Track and manage statutory compliance filings</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    New Filing
                </button>
            </div>

            {/* KPI Row */}
            {dashboardQuery.isLoading ? (
                <SkeletonKPIGrid count={3} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <KpiCard label="Filed %" value={`${dashboard.filedPercent ?? 0}%`} icon={CheckCircle2} color="success" />
                    <KpiCard label="Due This Week" value={dashboard.dueThisWeek ?? 0} icon={Clock} color="warning" />
                    <KpiCard label="Overdue" value={dashboard.overdue ?? 0} icon={AlertTriangle} color="danger" />
                </div>
            )}

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search by type or period..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_FILTERS.map((sf) => (
                            <button
                                key={sf.value}
                                onClick={() => setStatusFilter(sf.value)}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                    statusFilter === sf.value
                                        ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                        : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                                )}
                            >
                                {sf.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {filingsQuery.isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load statutory filings. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {filingsQuery.isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold">Period</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Amount (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold">Due Date</th>
                                    <th className="py-4 px-6 font-bold">Filed Date</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((f: any) => {
                                    const status = (f.status ?? "pending").toLowerCase();
                                    return (
                                        <tr key={f.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 text-center"><FilingTypeBadge type={f.type ?? "PF"} /></td>
                                            <td className="py-4 px-6 font-semibold text-primary-950 dark:text-white">{f.period || "—"}</td>
                                            <td className="py-4 px-6 text-center"><FilingStatusBadge status={f.status ?? "pending"} /></td>
                                            <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(f.amount ?? 0)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(f.dueDate)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(f.filedDate)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {status === "pending" && (
                                                        <button onClick={() => handleStatusUpdate(f.id, "in_progress")} disabled={updateMutation.isPending} className="p-1.5 text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors" title="Start Processing">
                                                            <ArrowRightCircle size={15} />
                                                        </button>
                                                    )}
                                                    {status === "in_progress" && (
                                                        <button onClick={() => handleStatusUpdate(f.id, "filed")} disabled={updateMutation.isPending} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Mark as Filed">
                                                            <FileCheck2 size={15} />
                                                        </button>
                                                    )}
                                                    {(status === "pending" || status === "in_progress") && (
                                                        <button onClick={() => handleStatusUpdate(f.id, "overdue")} disabled={updateMutation.isPending} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Mark Overdue">
                                                            <XCircle size={15} />
                                                        </button>
                                                    )}
                                                    {status === "overdue" && (
                                                        <button onClick={() => handleStatusUpdate(f.id, "filed")} disabled={updateMutation.isPending} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Mark as Filed">
                                                            <FileCheck2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !filingsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No filings found" message="Create a new filing to track statutory compliance." action={{ label: "New Filing", onClick: openCreate }} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Statutory Filing</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Filing Type</label>
                                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {FILING_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Period</label>
                                <input type="month" value={form.period} onChange={(e) => updateField("period", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Amount (\u20B9)</label>
                                <input type="number" value={form.amount} onChange={(e) => updateField("amount", Number(e.target.value))} min={0} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Due Date</label>
                                <input type="date" value={form.dueDate} onChange={(e) => updateField("dueDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} placeholder="Additional notes..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Filing"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
