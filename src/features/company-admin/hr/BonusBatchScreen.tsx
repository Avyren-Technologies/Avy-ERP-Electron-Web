import { useState } from "react";
import {
    Gift,
    Plus,
    Eye,
    Loader2,
    X,
    Search,
    CheckCircle2,
    ArrowRightLeft,
    Trash2,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useBonusBatches, useBonusBatch } from "@/features/company-admin/api/use-bonus-batch-queries";
import { useCreateBonusBatch, useApproveBonusBatch, useMergeBonusBatch } from "@/features/company-admin/api/use-bonus-batch-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Atoms ── */

function FormField({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
            />
        </div>
    );
}

function SelectField({
    label,
    value,
    onChange,
    options,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all"
            >
                <option value="">{placeholder ?? "Select..."}</option>
                {options.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                ))}
            </select>
        </div>
    );
}

function TypeBadge({ type }: { type: string }) {
    const t = type?.toUpperCase();
    const cls =
        t === "PERFORMANCE"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : t === "FESTIVE"
            ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
            : t === "SPOT"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : t === "REFERRAL"
            ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50"
            : t === "RETENTION"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {type}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "DRAFT"
            ? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
            : s === "APPROVED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "MERGED"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

/* ── Constants ── */

const BONUS_TYPES = [
    { value: "PERFORMANCE", label: "Performance" },
    { value: "FESTIVE", label: "Festive" },
    { value: "SPOT", label: "Spot" },
    { value: "REFERRAL", label: "Referral" },
    { value: "RETENTION", label: "Retention" },
    { value: "STATUTORY", label: "Statutory" },
];

interface BonusItem {
    employeeId: string;
    employeeName: string;
    amount: number;
    remarks: string;
}

const EMPTY_ITEM: BonusItem = { employeeId: "", employeeName: "", amount: 0, remarks: "" };

/* ── Screen ── */

export function BonusBatchScreen() {
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [detailId, setDetailId] = useState<string | null>(null);
    const [mergeModalOpen, setMergeModalOpen] = useState(false);
    const [mergeTarget, setMergeTarget] = useState<any>(null);
    const [payrollRunId, setPayrollRunId] = useState("");

    // Create form state
    const [formName, setFormName] = useState("");
    const [formType, setFormType] = useState("");
    const [formItems, setFormItems] = useState<BonusItem[]>([{ ...EMPTY_ITEM }]);

    const { data, isLoading, isError } = useBonusBatches();
    const { data: detailData, isLoading: detailLoading } = useBonusBatch(detailId);
    const createMutation = useCreateBonusBatch();
    const approveMutation = useApproveBonusBatch();
    const mergeMutation = useMergeBonusBatch();

    const batches: any[] = (data as any)?.data ?? [];
    const detail: any = (detailData as any)?.data ?? null;

    const filtered = batches.filter((b: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return b.name?.toLowerCase().includes(s) || b.type?.toLowerCase().includes(s) || b.status?.toLowerCase().includes(s);
    });

    const openCreate = () => {
        setFormName("");
        setFormType("");
        setFormItems([{ ...EMPTY_ITEM }]);
        setModalOpen(true);
    };

    const addItem = () => setFormItems((p) => [...p, { ...EMPTY_ITEM }]);
    const removeItem = (idx: number) => setFormItems((p) => p.filter((_, i) => i !== idx));
    const updateItem = (idx: number, key: keyof BonusItem, val: any) =>
        setFormItems((p) => p.map((item, i) => (i === idx ? { ...item, [key]: val } : item)));

    const handleCreate = async () => {
        try {
            await createMutation.mutateAsync({
                name: formName,
                type: formType,
                items: formItems.filter((i) => i.employeeId && i.amount > 0),
            } as any);
            showSuccess("Batch Created", `${formName} has been created.`);
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await approveMutation.mutateAsync({ id } as any);
            showSuccess("Batch Approved", "The bonus batch has been approved.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleMerge = async () => {
        if (!mergeTarget || !payrollRunId) return;
        try {
            await mergeMutation.mutateAsync({ id: mergeTarget.id, payrollRunId } as any);
            showSuccess("Merged to Payroll", "The bonus batch has been merged to the selected payroll run.");
            setMergeModalOpen(false);
            setMergeTarget(null);
            setPayrollRunId("");
        } catch (err) {
            showApiError(err);
        }
    };

    const openMerge = (batch: any) => {
        setMergeTarget(batch);
        setPayrollRunId("");
        setMergeModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Bonus Batches</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage performance, festive & spot bonuses</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Create Batch
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search batches..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load bonus batches. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={6} cols={7} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold text-center">Type</th>
                                    <th className="py-4 px-6 font-bold text-center">Employees</th>
                                    <th className="py-4 px-6 font-bold text-right">Total Amount</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold">Date</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((b: any) => (
                                    <tr
                                        key={b.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Gift className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{b.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center"><TypeBadge type={b.type ?? "PERFORMANCE"} /></td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1 text-neutral-600 dark:text-neutral-400">
                                                <Users className="w-3.5 h-3.5" />
                                                <span className="font-mono text-xs">{b.employeeCount ?? b.items?.length ?? 0}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-xs text-neutral-700 dark:text-neutral-300">
                                            {"\u20B9"}{(b.totalAmount ?? 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="py-4 px-6 text-center"><StatusBadge status={b.status ?? "DRAFT"} /></td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "\u2014"}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setDetailId(b.id)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View Details">
                                                    <Eye size={15} />
                                                </button>
                                                {b.status === "DRAFT" && (
                                                    <button onClick={() => handleApprove(b.id)} disabled={approveMutation.isPending} className="p-2 text-success-600 dark:text-success-400 hover:bg-success-50 dark:hover:bg-success-900/20 rounded-lg transition-colors" title="Approve">
                                                        <CheckCircle2 size={15} />
                                                    </button>
                                                )}
                                                {b.status === "APPROVED" && (
                                                    <button onClick={() => openMerge(b)} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-lg transition-colors" title="Merge to Payroll">
                                                        <ArrowRightLeft size={15} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={7}>
                                            <EmptyState icon="list" title="No bonus batches" message="Create a bonus batch to get started." action={{ label: "Create Batch", onClick: openCreate }} />
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
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Create Bonus Batch</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Batch Name" value={formName} onChange={setFormName} placeholder="e.g. Q1 Performance Bonus" />
                                <SelectField label="Bonus Type" value={formType} onChange={setFormType} options={BONUS_TYPES} placeholder="Select type" />
                            </div>

                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 mt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Bonus Items</label>
                                    <button onClick={addItem} className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                        <Plus size={14} /> Add Row
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {formItems.map((item, idx) => (
                                        <div key={idx} className="flex items-start gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                            <div className="flex-1 space-y-2">
                                                <input
                                                    value={item.employeeId}
                                                    onChange={(e) => updateItem(idx, "employeeId", e.target.value)}
                                                    placeholder="Employee ID"
                                                    className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        type="number"
                                                        value={item.amount || ""}
                                                        onChange={(e) => updateItem(idx, "amount", Number(e.target.value))}
                                                        placeholder="Amount"
                                                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                                    />
                                                    <input
                                                        value={item.remarks}
                                                        onChange={(e) => updateItem(idx, "remarks", e.target.value)}
                                                        placeholder="Remarks"
                                                        className="flex-1 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            {formItems.length > 1 && (
                                                <button onClick={() => removeItem(idx)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors mt-1">
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !formName || !formType} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Batch"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Detail Modal ── */}
            {detailId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Batch Details</h2>
                            <button onClick={() => setDetailId(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {detailLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
                            ) : detail ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Batch Name</p>
                                            <p className="font-bold text-primary-950 dark:text-white mt-1">{detail.name}</p>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Type</p>
                                            <div className="mt-1"><TypeBadge type={detail.type} /></div>
                                        </div>
                                        <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4">
                                            <p className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">Status</p>
                                            <div className="mt-1"><StatusBadge status={detail.status} /></div>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-neutral-50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                                    <th className="py-3 px-4 font-bold">Employee</th>
                                                    <th className="py-3 px-4 font-bold text-right">Amount</th>
                                                    <th className="py-3 px-4 font-bold text-right">TDS</th>
                                                    <th className="py-3 px-4 font-bold text-right">Net Amount</th>
                                                    <th className="py-3 px-4 font-bold">Remarks</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {(detail.items ?? []).map((item: any, idx: number) => (
                                                    <tr key={idx} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                        <td className="py-3 px-4 font-semibold text-primary-950 dark:text-white">{item.employeeName ?? item.employeeId}</td>
                                                        <td className="py-3 px-4 text-right font-mono text-xs">{"\u20B9"}{(item.amount ?? 0).toLocaleString("en-IN")}</td>
                                                        <td className="py-3 px-4 text-right font-mono text-xs text-danger-600">{"\u20B9"}{(item.tds ?? 0).toLocaleString("en-IN")}</td>
                                                        <td className="py-3 px-4 text-right font-mono text-xs font-bold text-success-700 dark:text-success-400">{"\u20B9"}{(item.netAmount ?? item.amount ?? 0).toLocaleString("en-IN")}</td>
                                                        <td className="py-3 px-4 text-xs text-neutral-500">{item.remarks || "\u2014"}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-neutral-500 text-center py-8">No details available.</p>
                            )}
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDetailId(null)} className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Merge to Payroll Modal ── */}
            {mergeModalOpen && mergeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Merge to Payroll</h2>
                            <button onClick={() => setMergeModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                Merge <strong>{mergeTarget.name}</strong> into a payroll run. This action cannot be undone.
                            </p>
                            <FormField label="Payroll Run ID" value={payrollRunId} onChange={setPayrollRunId} placeholder="Enter payroll run ID" />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setMergeModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleMerge} disabled={mergeMutation.isPending || !payrollRunId} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {mergeMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {mergeMutation.isPending ? "Merging..." : "Merge"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
