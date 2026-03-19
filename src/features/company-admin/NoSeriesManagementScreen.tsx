import { useState, useMemo } from "react";
import {
    Hash,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyNoSeries } from "@/features/company-admin/api/use-company-admin-queries";
import { useCreateNoSeries, useUpdateNoSeries, useDeleteNoSeries } from "@/features/company-admin/api/use-company-admin-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

function FormField({ label, value, onChange, placeholder, mono = false, type = "text" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean; type?: string;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={cn(
                    "w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all",
                    mono && "font-mono"
                )}
            />
        </div>
    );
}

function buildPreview(prefix: string, suffix: string, numberCount: number, startNumber: number): string {
    const digits = numberCount || 5;
    const start = startNumber || 1;
    return `${prefix}${suffix}${String(start).padStart(digits, "0")}`;
}

const EMPTY_SERIES = {
    code: "",
    description: "",
    linkedScreen: "",
    prefix: "",
    suffix: "",
    numberCount: "5",
    startNumber: "1",
};

export function NoSeriesManagementScreen() {
    const { data, isLoading, isError } = useCompanyNoSeries();
    const createMutation = useCreateNoSeries();
    const updateMutation = useUpdateNoSeries();
    const deleteMutation = useDeleteNoSeries();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_SERIES });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const series: any[] = data?.data ?? [];
    const filtered = series.filter((ns: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            ns.code?.toLowerCase().includes(s) ||
            ns.description?.toLowerCase().includes(s) ||
            ns.linkedScreen?.toLowerCase().includes(s)
        );
    });

    const livePreview = useMemo(
        () => buildPreview(form.prefix, form.suffix, parseInt(form.numberCount) || 5, parseInt(form.startNumber) || 1),
        [form.prefix, form.suffix, form.numberCount, form.startNumber]
    );

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_SERIES });
        setModalOpen(true);
    };

    const openEdit = (ns: any) => {
        setEditingId(ns.id);
        setForm({
            code: ns.code ?? "",
            description: ns.description ?? "",
            linkedScreen: ns.linkedScreen ?? "",
            prefix: ns.prefix ?? "",
            suffix: ns.suffix ?? "",
            numberCount: String(ns.numberCount ?? 5),
            startNumber: String(ns.startNumber ?? 1),
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        const payload = {
            ...form,
            numberCount: parseInt(form.numberCount) || 5,
            startNumber: parseInt(form.startNumber) || 1,
        };
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Series Updated", `${form.code} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Series Created", `${form.code} has been added.`);
            }
            setModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Series Deleted", `${deleteTarget.code} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Number Series</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure document numbering sequences</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Series
                </button>
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                        type="text"
                        placeholder="Search series..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load number series.
                </div>
            )}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[850px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Description</th>
                                    <th className="py-4 px-6 font-bold">Linked Screen</th>
                                    <th className="py-4 px-6 font-bold">Prefix</th>
                                    <th className="py-4 px-6 font-bold">Suffix</th>
                                    <th className="py-4 px-6 font-bold">Preview</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((ns: any) => {
                                    const preview = buildPreview(ns.prefix ?? "", ns.suffix ?? "", ns.numberCount ?? 5, ns.startNumber ?? 1);
                                    return (
                                        <tr key={ns.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-bold text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">{ns.code}</span>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300">{ns.description || "\u2014"}</td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{ns.linkedScreen || "\u2014"}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{ns.prefix || "\u2014"}</td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{ns.suffix || "\u2014"}</td>
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-semibold text-primary-950 dark:text-white bg-neutral-100 dark:bg-neutral-800 px-2.5 py-1 rounded-lg">{preview}</span>
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(ns)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(ns)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No series configured" message="Add your first number series." action={{ label: "Add Series", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal with Live Preview ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Series" : "Add Series"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. PO" mono />
                                <FormField label="Linked Screen" value={form.linkedScreen} onChange={(v) => updateField("linkedScreen", v)} placeholder="e.g. Purchase Order" />
                            </div>
                            <FormField label="Description" value={form.description} onChange={(v) => updateField("description", v)} placeholder="Series description" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Prefix" value={form.prefix} onChange={(v) => updateField("prefix", v)} placeholder="e.g. PO-" mono />
                                <FormField label="Suffix" value={form.suffix} onChange={(v) => updateField("suffix", v)} placeholder="e.g. /2026" mono />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Number Digits" value={form.numberCount} onChange={(v) => updateField("numberCount", v)} type="number" />
                                <FormField label="Start Number" value={form.startNumber} onChange={(v) => updateField("startNumber", v)} type="number" />
                            </div>

                            {/* Live Preview */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl px-4 py-3 border border-primary-100 dark:border-primary-800/50">
                                <div className="flex items-center gap-2 mb-1">
                                    <Eye size={13} className="text-primary-500" />
                                    <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">Live Preview</p>
                                </div>
                                <p className="text-lg font-mono font-bold text-primary-950 dark:text-white">{livePreview}</p>
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Series?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.code}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMutation.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
