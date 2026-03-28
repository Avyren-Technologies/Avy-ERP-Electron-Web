import { useState } from "react";
import {
    FileText,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLoanPolicies } from "@/features/company-admin/api/use-payroll-queries";
import {
    useCreateLoanPolicy,
    useUpdateLoanPolicy,
    useDeleteLoanPolicy,
} from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function NumberField({ label, value, onChange, placeholder, min, max, step }: { label: string; value: number; onChange: (v: number) => void; placeholder?: string; min?: number; max?: number; step?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder={placeholder} min={min} max={max} step={step} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
        </div>
    );
}

function SelectField({ label, value, onChange, options, placeholder }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
            </select>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const active = status?.toLowerCase() === "active";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", active ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50" : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700")}>
            {status}
        </span>
    );
}

/* ── Empty form ── */

const EMPTY_POLICY = {
    name: "",
    code: "",
    maxAmount: 0,
    maxTenureMonths: 0,
    interestRate: 0,
    emiCapPercent: 0,
    isActive: true,
};

/* ── Screen ── */

export function LoanPolicyScreen() {
    const { data, isLoading, isError } = useLoanPolicies();
    const createMutation = useCreateLoanPolicy();
    const updateMutation = useUpdateLoanPolicy();
    const deleteMutation = useDeleteLoanPolicy();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_POLICY });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const policies: any[] = data?.data ?? [];

    const filtered = policies.filter((p: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return p.name?.toLowerCase().includes(s) || p.code?.toLowerCase().includes(s);
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_POLICY }); setModalOpen(true); };
    const openEdit = (p: any) => {
        setEditingId(p.id);
        setForm({
            name: p.name ?? "",
            code: p.code ?? "",
            maxAmount: p.maxAmount ?? 0,
            maxTenureMonths: p.maxTenureMonths ?? 0,
            interestRate: p.interestRate ?? 0,
            emiCapPercent: p.emiCapPercent ?? 0,
            isActive: p.isActive ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code,
                maxAmount: form.maxAmount || undefined,
                maxTenureMonths: form.maxTenureMonths || undefined,
                interestRate: form.interestRate,
                emiCapPercent: form.emiCapPercent || undefined,
                isActive: form.isActive,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Policy Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Policy Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Policy Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Loan Policies</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define loan types, limits, interest rates, and EMI caps</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Policy
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search loan policies..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load loan policies. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold text-right">Max Amount (₹)</th>
                                    <th className="py-4 px-6 font-bold text-center">Max Tenure</th>
                                    <th className="py-4 px-6 font-bold text-center">Interest Rate</th>
                                    <th className="py-4 px-6 font-bold text-center">EMI Cap</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((p: any) => (
                                    <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-info-50 dark:bg-info-900/30 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4 text-info-600 dark:text-info-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{p.code || "—"}</td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">₹{(p.maxAmount ?? 0).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">{p.maxTenureMonths ?? 0} mo</td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">{p.interestRate ?? 0}%</td>
                                        <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400">{p.emiCapPercent ?? 0}%</td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={p.isActive !== false ? "Active" : "Inactive"} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                <button onClick={() => setDeleteTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={8}><EmptyState icon="list" title="No loan policies found" message="Add your first loan policy to get started." action={{ label: "Add Policy", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Loan Policy" : "Add Loan Policy"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Policy Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Personal Loan" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. PL" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Max Amount (₹)" value={form.maxAmount} onChange={(v) => updateField("maxAmount", v)} min={0} />
                                <NumberField label="Max Tenure (months)" value={form.maxTenureMonths} onChange={(v) => updateField("maxTenureMonths", v)} min={0} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <NumberField label="Interest Rate (%)" value={form.interestRate} onChange={(v) => updateField("interestRate", v)} min={0} max={100} step="0.01" />
                                <NumberField label="EMI Cap (% of Gross)" value={form.emiCapPercent} onChange={(v) => updateField("emiCapPercent", v)} min={0} max={100} />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                                <button
                                    type="button"
                                    onClick={() => updateField("isActive", !form.isActive)}
                                    className={cn("w-10 h-6 rounded-full transition-colors relative", form.isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}
                                >
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", form.isActive ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Loan Policy?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.name}</strong>. Existing loans under this policy will not be affected.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMutation.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
