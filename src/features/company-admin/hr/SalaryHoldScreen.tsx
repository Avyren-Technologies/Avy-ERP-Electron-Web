import { useState } from "react";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import {
    PauseCircle,
    Plus,
    Loader2,
    X,
    Search,
    PlayCircle,
    CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalaryHolds, usePayrollRuns } from "@/features/company-admin/api/use-payroll-run-queries";
import { useCreateSalaryHold, useReleaseSalaryHold } from "@/features/company-admin/api/use-payroll-run-mutations";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Helpers ── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const formatCurrency = (v: number) => `₹${(v ?? 0).toLocaleString("en-IN")}`;

const HOLD_TYPES = [
    { value: "FULL", label: "Full Salary" },
    { value: "PARTIAL", label: "Partial" },
];

function HoldTypeBadge({ type }: { type: string }) {
    const t = type?.toUpperCase();
    const colorMap: Record<string, string> = {
        FULL: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
        PARTIAL: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
    };
    const cls = colorMap[t] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {type || "Full"}
        </span>
    );
}

const EMPTY_HOLD = {
    payrollRunId: "",
    employeeId: "",
    holdType: "FULL",
    reason: "",
    heldComponents: "",
};

/* ── Screen ── */

/** Extract employee name from nested object */
function holdEmpName(h: any, employees: any[]) {
    const emp = h.employee ?? employees.find((e: any) => e.id === h.employeeId);
    if (!emp) return h.employeeId;
    return `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId || h.employeeId;
}
function holdEmpCode(h: any) { return h.employee?.employeeId ?? ""; }
function holdEmpDept(h: any) { return h.employee?.department?.name ?? ""; }

export function SalaryHoldScreen() {
    const fmt = useCompanyFormatter();
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState({ ...EMPTY_HOLD });
    const [releaseTarget, setReleaseTarget] = useState<any>(null);

    const holdsQuery = useSalaryHolds();
    const employeesQuery = useEmployees();
    const payrollRunsQuery = usePayrollRuns();
    const createMutation = useCreateSalaryHold();
    const releaseMutation = useReleaseSalaryHold();

    const holds: any[] = holdsQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const payrollRuns: any[] = payrollRunsQuery.data?.data ?? [];

    const filtered = holds.filter((h: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return holdEmpName(h, employees).toLowerCase().includes(q) || holdEmpCode(h).toLowerCase().includes(q) || h.reason?.toLowerCase().includes(q);
    });

    const openCreate = () => { setForm({ ...EMPTY_HOLD }); setModalOpen(true); };
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync({
                payrollRunId: form.payrollRunId,
                employeeId: form.employeeId,
                holdType: form.holdType,
                reason: form.reason,
                heldComponents: form.holdType === "PARTIAL" && form.heldComponents
                    ? form.heldComponents.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : undefined,
            });
            showSuccess("Hold Created", "Salary hold has been created.");
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleRelease = async () => {
        if (!releaseTarget) return;
        try {
            await releaseMutation.mutateAsync(releaseTarget.id);
            showSuccess("Hold Released", "Salary hold has been released.");
            setReleaseTarget(null);
        } catch (err) { showApiError(err); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Salary Holds</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage salary holds and releases for employees</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    New Hold
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search by employee or reason..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {holdsQuery.isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load salary holds. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {holdsQuery.isLoading ? (
                    <SkeletonTable rows={5} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1000px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold">Created</th>
                                    <th className="py-4 px-6 font-bold text-center">Hold Type</th>
                                    <th className="py-4 px-6 font-bold">Reason</th>
                                    <th className="py-4 px-6 font-bold">Components</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((h: any) => {
                                    const isReleased = !!h.releasedAt;
                                    return (
                                        <tr key={h.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-warning-50 dark:bg-warning-900/30 flex items-center justify-center shrink-0">
                                                        <PauseCircle className="w-4 h-4 text-warning-600 dark:text-warning-400" />
                                                    </div>
                                                    <div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{holdEmpName(h, employees)}</span>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            {holdEmpCode(h) && <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">{holdEmpCode(h)}</span>}
                                                            {holdEmpDept(h) && <span className="text-[10px] text-neutral-400 dark:text-neutral-500">· {holdEmpDept(h)}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">
                                                {h.createdAt ? fmt.date(h.createdAt) : "—"}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                <HoldTypeBadge type={h.holdType ?? "full"} />
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 max-w-[200px] truncate">{h.reason || "—"}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">
                                                {h.heldComponents && h.heldComponents.length > 0 ? h.heldComponents.join(", ") : "—"}
                                            </td>
                                            <td className="py-4 px-6 text-center">
                                                {isReleased ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
                                                        <CheckCircle size={10} />
                                                        Released
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50">
                                                        <PauseCircle size={10} />
                                                        Active
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                {!isReleased && (
                                                    <button
                                                        onClick={() => setReleaseTarget(h)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success-50 text-success-700 dark:bg-success-900/20 dark:text-success-400 text-xs font-bold hover:bg-success-100 dark:hover:bg-success-900/40 transition-colors"
                                                    >
                                                        <PlayCircle size={12} />
                                                        Release
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !holdsQuery.isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No salary holds" message="No salary holds found. Create one to get started." action={{ label: "New Hold", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Salary Hold</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Payroll Run</label>
                                <select value={form.payrollRunId} onChange={(e) => updateField("payrollRunId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select payroll run...</option>
                                    {payrollRuns.map((r: any) => (
                                        <option key={r.id} value={r.id}>{r.month && r.year ? `${MONTHS[(r.month ?? 1) - 1]} ${r.year}` : r.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={form.employeeId} onChange={(e) => updateField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => (
                                        <option key={e.id} value={e.id}>{`${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Hold Type</label>
                                <select value={form.holdType} onChange={(e) => updateField("holdType", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {HOLD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                </select>
                            </div>
                            {form.holdType === "PARTIAL" && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Held Components (comma-separated codes)</label>
                                    <input type="text" value={form.heldComponents} onChange={(e) => updateField("heldComponents", e.target.value)} placeholder="e.g. BASIC, HRA, DA" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Reason</label>
                                <textarea value={form.reason} onChange={(e) => updateField("reason", e.target.value)} placeholder="Reason for salary hold..." rows={3} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Hold"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Release Confirmation ── */}
            {releaseTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-success-700 dark:text-success-400 mb-2">Release Salary Hold?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will release the salary hold for <strong>{holdEmpName(releaseTarget, employees)}</strong>.
                            The held salary components will be included in the next payroll run.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setReleaseTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleRelease} disabled={releaseMutation.isPending} className="flex-1 py-3 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {releaseMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                Release
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
