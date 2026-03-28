import { useState } from "react";
import {
    TrendingUp,
    Plus,
    Loader2,
    X,
    Search,
    Eye,
    CheckCircle,
    ArrowRightCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useSalaryRevisions,
    useSalaryRevision,
    useArrearEntries,
} from "@/features/company-admin/api/use-payroll-run-queries";
import {
    useCreateSalaryRevision,
    useApproveSalaryRevision,
    useApplySalaryRevision,
} from "@/features/company-admin/api/use-payroll-run-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: number) => `\u20B9${(v ?? 0).toLocaleString("en-IN")}`;
const formatDate = (d: string | null | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

function RevisionStatusBadge({ status }: { status: string }) {
    const colorMap: Record<string, string> = {
        draft: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
        pending: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        approved: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        applied: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        rejected: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[status?.toLowerCase()] ?? colorMap.draft;
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {status || "Draft"}
        </span>
    );
}

const STATUS_FILTERS = [
    { value: "", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "applied", label: "Applied" },
    { value: "rejected", label: "Rejected" },
];

const EMPTY_REVISION = {
    employeeId: "",
    oldCTC: 0,
    newCtc: 0,
    effectiveDate: "",
    reason: "",
};

/* ── Screen ── */

export function SalaryRevisionScreen() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_REVISION });
    const [detailId, setDetailId] = useState<string | null>(null);

    const revisionsQuery = useSalaryRevisions({ status: statusFilter || undefined });
    const employeesQuery = useEmployees();
    const detailQuery = useSalaryRevision(detailId ?? "");
    const arrearsQuery = useArrearEntries(detailId ? { employeeId: detailQuery.data?.data?.employeeId } : undefined);

    const createMutation = useCreateSalaryRevision();
    const approveMutation = useApproveSalaryRevision();
    const applyMutation = useApplySalaryRevision();

    const revisions: any[] = revisionsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const detail: any = detailQuery.data?.data ?? null;
    const arrears: any[] = arrearsQuery.data?.data ?? [];

    const getEmployeeName = (id: string) => {
        const e = employees.find((emp: any) => emp.id === id);
        return e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.email || id : id;
    };

    const filtered = revisions.filter((r: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return getEmployeeName(r.employeeId).toLowerCase().includes(q) || r.employeeName?.toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_REVISION }); setModalOpen(true); };
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const incrementPercent = form.oldCTC > 0 ? (((form.newCtc - form.oldCTC) / form.oldCTC) * 100).toFixed(1) : "0.0";

    const handleCreate = async () => {
        try {
            const incrementPct = form.oldCTC > 0 ? ((form.newCtc - form.oldCTC) / form.oldCTC) * 100 : 0;
            const payload = {
                employeeId: form.employeeId,
                newCtc: form.newCtc,
                effectiveDate: form.effectiveDate,
                incrementPercent: Math.round(incrementPct * 10) / 10,
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Revision Created", "Salary revision has been submitted for approval.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync(id);
            showSuccess("Revision Approved", "Salary revision has been approved.");
        } catch (err) { showApiError(err); }
    };

    const handleApply = async (id: string) => {
        try {
            await applyMutation.mutateAsync(id);
            showSuccess("Revision Applied", "Salary revision has been applied with arrears calculated.");
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Salary Revisions</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage employee salary revisions, approvals, and arrears</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    New Revision
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                        <input type="text" placeholder="Search employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                    </div>
                    <div className="flex gap-2">
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

            {revisionsQuery.isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load salary revisions. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {revisionsQuery.isLoading ? (
                    <SkeletonTable rows={5} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold text-right">Old CTC (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-right">New CTC (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-right">Increment %</th>
                                    <th className="py-4 px-6 font-bold">Effective Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Arrears (\u20B9)</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((r: any) => {
                                    const status = (r.status ?? "pending").toLowerCase();
                                    const incr = r.oldCTC > 0 ? (((r.newCTC - r.oldCTC) / r.oldCTC) * 100).toFixed(1) : "0.0";
                                    return (
                                        <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                        <TrendingUp className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{r.employeeName || getEmployeeName(r.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">{formatCurrency(r.oldCTC ?? 0)}</td>
                                            <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(r.newCTC ?? 0)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <span className={cn("text-xs font-bold", Number(incr) > 0 ? "text-success-600 dark:text-success-400" : "text-neutral-500")}>
                                                    {Number(incr) > 0 ? "+" : ""}{incr}%
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(r.effectiveDate)}</td>
                                            <td className="py-4 px-6 text-center"><RevisionStatusBadge status={r.status ?? "pending"} /></td>
                                            <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">{r.arrearsAmount ? formatCurrency(r.arrearsAmount) : "—"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setDetailId(r.id)} className="p-1.5 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View Details">
                                                        <Eye size={15} />
                                                    </button>
                                                    {status === "pending" && (
                                                        <button onClick={() => handleApprove(r.id)} disabled={approveMutation.isPending} className="p-1.5 text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve">
                                                            <CheckCircle size={15} />
                                                        </button>
                                                    )}
                                                    {status === "approved" && (
                                                        <button onClick={() => handleApply(r.id)} disabled={applyMutation.isPending} className="p-1.5 text-info-600 hover:bg-info-50 dark:hover:bg-info-900/20 rounded-lg transition-colors" title="Apply">
                                                            <ArrowRightCircle size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !revisionsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No salary revisions" message="Create a new revision to get started." action={{ label: "New Revision", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Salary Revision</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => (
                                        <option key={e.id} value={e.id}>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Old CTC (\u20B9)</label>
                                    <input type="number" value={form.oldCTC} onChange={(e) => updateField("oldCTC", Number(e.target.value))} min={0} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">New CTC (\u20B9)</label>
                                    <input type="number" value={form.newCtc} onChange={(e) => updateField("newCtc", Number(e.target.value))} min={0} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                                </div>
                            </div>
                            {form.oldCTC > 0 && form.newCtc > 0 && (
                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 border border-primary-200 dark:border-primary-800/50 text-center">
                                    <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase">Increment</span>
                                    <p className="text-2xl font-bold text-primary-700 dark:text-primary-300 mt-1">
                                        {Number(incrementPercent) > 0 ? "+" : ""}{incrementPercent}%
                                    </p>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Effective Date</label>
                                <input type="date" value={form.effectiveDate} onChange={(e) => updateField("effectiveDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="Reason for revision..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Submit Revision"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Revision Details</h2>
                            <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {detailQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 size={24} className="animate-spin text-primary-500" />
                                </div>
                            ) : detail ? (
                                <>
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold text-primary-950 dark:text-white text-lg">{detail.employeeName || getEmployeeName(detail.employeeId)}</p>
                                        <RevisionStatusBadge status={detail.status ?? "pending"} />
                                    </div>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
                                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Old CTC</span>
                                            <p className="text-lg font-bold font-mono text-primary-950 dark:text-white mt-1">{formatCurrency(detail.oldCTC ?? 0)}</p>
                                        </div>
                                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
                                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">New CTC</span>
                                            <p className="text-lg font-bold font-mono text-success-700 dark:text-success-400 mt-1">{formatCurrency(detail.newCTC ?? 0)}</p>
                                        </div>
                                        <div className="rounded-xl border border-neutral-200 dark:border-neutral-700 p-3 text-center">
                                            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Increment</span>
                                            <p className="text-lg font-bold text-accent-700 dark:text-accent-400 mt-1">
                                                {detail.oldCTC > 0 ? `+${(((detail.newCTC - detail.oldCTC) / detail.oldCTC) * 100).toFixed(1)}%` : "—"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-sm">
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Effective Date</p>
                                        <p className="font-bold text-primary-950 dark:text-white">{formatDate(detail.effectiveDate)}</p>
                                    </div>
                                    {detail.reason && (
                                        <div className="text-sm">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-0.5">Reason</p>
                                            <p className="text-neutral-600 dark:text-neutral-400 italic">"{detail.reason}"</p>
                                        </div>
                                    )}

                                    {/* Arrears Breakdown */}
                                    {arrears.length > 0 && (
                                        <div>
                                            <h4 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">Month-by-Month Arrears</h4>
                                            <div className="bg-primary-50/30 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/50 divide-y divide-primary-100 dark:divide-primary-800/50">
                                                {arrears.map((a: any, i: number) => (
                                                    <div key={i} className="flex justify-between px-4 py-2.5 text-sm">
                                                        <span className="text-neutral-700 dark:text-neutral-300">
                                                            {a.month && a.year ? `${MONTHS[(a.month ?? 1) - 1]} ${a.year}` : a.period ?? `Month ${i + 1}`}
                                                        </span>
                                                        <span className="font-mono font-semibold text-primary-950 dark:text-white">{formatCurrency(a.amount ?? a.arrearAmount ?? 0)}</span>
                                                    </div>
                                                ))}
                                                <div className="flex justify-between px-4 py-2.5 text-sm font-bold bg-primary-50 dark:bg-primary-900/20">
                                                    <span className="text-primary-700 dark:text-primary-400">Total Arrears</span>
                                                    <span className="font-mono text-primary-700 dark:text-primary-400">{formatCurrency(arrears.reduce((s: number, a: any) => s + (a.amount ?? a.arrearAmount ?? 0), 0))}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-neutral-400 text-center py-8">Revision not found</p>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailId(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
