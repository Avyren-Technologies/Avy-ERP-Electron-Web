import { useState } from "react";
import {
    Layers,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    PlusCircle,
    MinusCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalaryStructures, useSalaryComponents } from "@/features/company-admin/api/use-payroll-queries";
import { useGrades, useDesignations, useEmployeeTypes } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateSalaryStructure,
    useUpdateSalaryStructure,
    useDeleteSalaryStructure,
} from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

function FormField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
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

function MultiSelectField({ label, selected, onChange, options, showAllOption }: { label: string; selected: string[]; onChange: (v: string[]) => void; options: { value: string; label: string }[]; showAllOption?: boolean }) {
    const isAllSelected = showAllOption && selected.length === 0;
    const toggle = (val: string) => {
        if (isAllSelected) {
            // Switching from "All" to specific: select only the clicked one
            onChange([val]);
        } else {
            onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
        }
    };
    const handleAllClick = () => { onChange([]); };
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <div className="flex flex-wrap gap-2">
                {showAllOption && (
                    <button type="button" onClick={handleAllClick} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", isAllSelected ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300")}>
                        All (applies to everyone)
                    </button>
                )}
                {options.map((o) => (
                    <button key={o.value} type="button" onClick={() => toggle(o.value)} className={cn("px-3 py-1.5 rounded-lg text-xs font-bold border transition-all", !isAllSelected && selected.includes(o.value) ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700" : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300")}>
                        {o.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

/* ── Types ── */

interface StructureComponent {
    componentId: string;
    calculationMethod: string;
    value: number;
    formula?: string;
}

const CALC_METHODS = [
    { value: "FIXED", label: "Fixed" },
    { value: "PERCENT_OF_BASIC", label: "% of Basic" },
    { value: "PERCENT_OF_GROSS", label: "% of Gross" },
    { value: "FORMULA", label: "Formula" },
];

const CTC_BASIS_OPTIONS = [
    { value: "CTC", label: "Annual CTC" },
    { value: "TAKE_HOME", label: "Take Home" },
];

/* ── Empty form ── */

const EMPTY_STRUCTURE = {
    name: "",
    code: "",
    ctcBasis: "CTC",
    applicableGradeIds: [] as string[],
    applicableDesignationIds: [] as string[],
    applicableTypeIds: [] as string[],
    components: [] as StructureComponent[],
    isActive: true,
};

/* ── Screen ── */

export function SalaryStructureScreen() {
    const { data, isLoading, isError } = useSalaryStructures();
    const componentsQuery = useSalaryComponents();
    const gradesQuery = useGrades();
    const designationsQuery = useDesignations();
    const empTypesQuery = useEmployeeTypes();
    const createMutation = useCreateSalaryStructure();
    const updateMutation = useUpdateSalaryStructure();
    const deleteMutation = useDeleteSalaryStructure();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_STRUCTURE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const structures: any[] = data?.data ?? [];
    const salaryComponents: any[] = componentsQuery.data?.data ?? [];
    const grades: any[] = gradesQuery.data?.data ?? [];
    const designations: any[] = designationsQuery.data?.data ?? [];
    const empTypes: any[] = empTypesQuery.data?.data ?? [];

    const filtered = structures.filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return s.name?.toLowerCase().includes(q) || s.code?.toLowerCase().includes(q);
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_STRUCTURE, components: [] }); setModalOpen(true); };
    const openEdit = (s: any) => {
        setEditingId(s.id);
        setForm({
            name: s.name ?? "",
            code: s.code ?? "",
            ctcBasis: s.ctcBasis ?? "CTC",
            applicableGradeIds: s.applicableGradeIds ?? [],
            applicableDesignationIds: s.applicableDesignationIds ?? [],
            applicableTypeIds: s.applicableTypeIds ?? [],
            components: (s.components ?? []).map((c: any) => ({ componentId: c.componentId ?? "", calculationMethod: c.calculationMethod ?? "FIXED", value: c.value ?? 0, formula: c.formula ?? "" })),
            isActive: s.isActive ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code,
                ctcBasis: form.ctcBasis,
                applicableGradeIds: form.applicableGradeIds.length > 0 ? form.applicableGradeIds : undefined,
                applicableDesignationIds: form.applicableDesignationIds.length > 0 ? form.applicableDesignationIds : undefined,
                applicableTypeIds: form.applicableTypeIds.length > 0 ? form.applicableTypeIds : undefined,
                components: form.components.map((c) => ({
                    componentId: c.componentId,
                    calculationMethod: c.calculationMethod,
                    value: c.value || undefined,
                    formula: c.calculationMethod === "FORMULA" ? c.formula : undefined,
                })),
                isActive: form.isActive,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Structure Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Structure Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget.id);
            showSuccess("Structure Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const addComponentRow = () => { setForm((p) => ({ ...p, components: [...p.components, { componentId: "", calculationMethod: "FIXED", value: 0, formula: "" }] })); };
    const removeComponentRow = (i: number) => { setForm((p) => ({ ...p, components: p.components.filter((_, idx) => idx !== i) })); };
    const updateComponentRow = (i: number, key: string, value: any) => {
        setForm((p) => ({ ...p, components: p.components.map((c, idx) => idx === i ? { ...c, [key]: value } : c) }));
    };

    // Live preview computation
    const computePreview = () => {
        const basicRow = form.components.find((c) => {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            return comp?.code?.toLowerCase() === "basic";
        });
        const basicAmt = basicRow ? basicRow.value : 0;
        return form.components.map((c) => {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            let monthly = 0;
            if (c.calculationMethod === "FIXED") monthly = c.value;
            else if (c.calculationMethod === "PERCENT_OF_BASIC") monthly = (basicAmt * c.value) / 100;
            else if (c.calculationMethod === "PERCENT_OF_GROSS") monthly = c.value; // needs Gross context
            return { name: comp?.name ?? "Unknown", monthly };
        });
    };

    const getComponentName = (id: string) => salaryComponents.find((c: any) => c.id === id)?.name ?? id;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Salary Structures</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure compensation structures with component breakdowns</p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Add Structure
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search salary structures..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load salary structures. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={6} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Applicable Grades</th>
                                    <th className="py-4 px-6 font-bold">Applicable Designations</th>
                                    <th className="py-4 px-6 font-bold text-center">Components</th>
                                    <th className="py-4 px-6 font-bold">CTC Basis</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((s: any) => (
                                    <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                    <Layers className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{s.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{s.code || "—"}</td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {(s.applicableGradeIds ?? []).slice(0, 3).map((g: string) => (
                                                    <span key={g} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50">{grades.find((gr: any) => gr.id === g)?.name ?? g}</span>
                                                ))}
                                                {(s.applicableGradeIds ?? []).length > 3 && <span className="text-[10px] font-bold text-neutral-400">+{(s.applicableGradeIds ?? []).length - 3}</span>}
                                                {(s.applicableGradeIds ?? []).length === 0 && <span className="text-xs text-neutral-400">All</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex flex-wrap gap-1">
                                                {(s.applicableDesignationIds ?? []).slice(0, 3).map((d: string) => (
                                                    <span key={d} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-info-50 text-info-700 border border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50">{designations.find((ds: any) => ds.id === d)?.name ?? d}</span>
                                                ))}
                                                {(s.applicableDesignationIds ?? []).length > 3 && <span className="text-[10px] font-bold text-neutral-400">+{(s.applicableDesignationIds ?? []).length - 3}</span>}
                                                {(s.applicableDesignationIds ?? []).length === 0 && <span className="text-xs text-neutral-400">All</span>}
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{(s.components ?? []).length}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400 capitalize">{s.ctcBasis ?? "annual"}</td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                <button onClick={() => setDeleteTarget(s)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No salary structures found" message="Add your first salary structure to get started." action={{ label: "Add Structure", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal (Large) ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-4xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Salary Structure" : "Add Salary Structure"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SectionLabel title="Basic Information" />
                            <div className="grid grid-cols-3 gap-4">
                                <FormField label="Structure Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Standard CTC" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. STD-CTC" />
                                <SelectField label="CTC Basis" value={form.ctcBasis} onChange={(v) => updateField("ctcBasis", v)} options={CTC_BASIS_OPTIONS} />
                            </div>

                            <SectionLabel title="Applicability" />
                            <MultiSelectField label="Grades" selected={form.applicableGradeIds} onChange={(v) => updateField("applicableGradeIds", v)} options={grades.map((g: any) => ({ value: g.id ?? g.code, label: g.name }))} showAllOption />
                            <MultiSelectField label="Designations" selected={form.applicableDesignationIds} onChange={(v) => updateField("applicableDesignationIds", v)} options={designations.map((d: any) => ({ value: d.id ?? d.code, label: d.name }))} showAllOption />
                            <MultiSelectField label="Employee Types" selected={form.applicableTypeIds} onChange={(v) => updateField("applicableTypeIds", v)} options={empTypes.map((e: any) => ({ value: e.id ?? e.code, label: e.name }))} />

                            <SectionLabel title="Component Breakup" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-neutral-200 dark:border-neutral-700 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-3 px-4 font-bold">Component</th>
                                            <th className="py-3 px-4 font-bold">Method</th>
                                            <th className="py-3 px-4 font-bold">Value</th>
                                            <th className="py-3 px-4 font-bold text-right">Remove</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {form.components.map((row, i) => (
                                            <tr key={i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                <td className="py-2 px-4">
                                                    <select value={row.componentId} onChange={(e) => updateComponentRow(i, "componentId", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white">
                                                        <option value="">Select component...</option>
                                                        {salaryComponents.map((sc: any) => (<option key={sc.id} value={sc.id}>{sc.name}</option>))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <select value={row.calculationMethod} onChange={(e) => updateComponentRow(i, "calculationMethod", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white">
                                                        {CALC_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <input type="number" value={row.value} onChange={(e) => updateComponentRow(i, "value", Number(e.target.value))} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white" min={0} />
                                                </td>
                                                <td className="py-2 px-4 text-right">
                                                    <button onClick={() => removeComponentRow(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"><MinusCircle size={16} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="px-4 py-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <button onClick={addComponentRow} className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors">
                                        <PlusCircle size={14} /> Add Component Row
                                    </button>
                                </div>
                            </div>

                            {/* Live Preview */}
                            {form.components.length > 0 && (
                                <>
                                    <SectionLabel title="Monthly Breakup Preview" />
                                    <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
                                        {computePreview().map((p, i) => (
                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                <span className="text-neutral-700 dark:text-neutral-300">{p.name}</span>
                                                <span className="font-mono font-semibold text-primary-950 dark:text-white">{p.monthly > 0 ? `₹${p.monthly.toLocaleString("en-IN")}` : "—"}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-primary-200 dark:border-primary-800/50 mt-2 pt-2 flex justify-between text-sm font-bold">
                                            <span className="text-primary-950 dark:text-white">Total Monthly</span>
                                            <span className="font-mono text-primary-700 dark:text-primary-400">₹{computePreview().reduce((s, p) => s + p.monthly, 0).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
                                </>
                            )}
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Structure?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{deleteTarget.name}</strong>. Employees assigned to this structure may be affected.</p>
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
