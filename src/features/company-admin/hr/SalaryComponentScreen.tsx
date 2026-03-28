import { useState } from "react";
import {
    Wallet,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Check,
    Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSalaryComponents } from "@/features/company-admin/api/use-payroll-queries";
import {
    useCreateSalaryComponent,
    useUpdateSalaryComponent,
    useDeleteSalaryComponent,
} from "@/features/company-admin/api/use-payroll-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Form atoms ── */

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

function NumberField({
    label,
    value,
    onChange,
    placeholder,
    min,
    max,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
    placeholder?: string;
    min?: number;
    max?: number;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <input
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                placeholder={placeholder}
                min={min}
                max={max}
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
                    <option key={o.value} value={o.value}>
                        {o.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

function ToggleSwitch({
    label,
    checked,
    onChange,
}: {
    label: string;
    checked: boolean;
    onChange: (v: boolean) => void;
}) {
    return (
        <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-primary-950 dark:text-white">{label}</span>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-10 h-6 rounded-full transition-colors relative",
                    checked ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700"
                )}
            >
                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", checked ? "left-5" : "left-1")} />
            </button>
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

function TypeBadge({ type }: { type: string }) {
    const colorMap: Record<string, string> = {
        earning: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        deduction: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[type?.toLowerCase()] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {type || "Other"}
        </span>
    );
}

function YesNoBadge({ enabled }: { enabled: boolean }) {
    return enabled ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-success-50 text-success-700 px-2 py-0.5 rounded-full border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <Check size={10} /> Yes
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700">
            <Minus size={10} /> No
        </span>
    );
}

/* ── Constants ── */

const COMPONENT_TYPES = [
    { value: "EARNING", label: "Earning" },
    { value: "DEDUCTION", label: "Deduction" },
    { value: "EMPLOYER_CONTRIBUTION", label: "Employer Contribution" },
];

const CALCULATION_METHODS = [
    { value: "FIXED", label: "Fixed Amount" },
    { value: "PERCENT_OF_BASIC", label: "% of Basic" },
    { value: "PERCENT_OF_GROSS", label: "% of Gross" },
    { value: "FORMULA", label: "Custom Formula" },
];

const TAX_TREATMENTS = [
    { value: "FULLY_TAXABLE", label: "Fully Taxable" },
    { value: "PARTIALLY_EXEMPT", label: "Partially Exempt" },
    { value: "FULLY_EXEMPT", label: "Fully Exempt" },
];

/* ── Empty form ── */

const EMPTY_COMPONENT = {
    name: "",
    code: "",
    type: "",
    calculationMethod: "FIXED",
    formulaValue: 0,
    formula: "",
    taxable: "FULLY_TAXABLE",
    exemptionLimit: 0,
    exemptionSection: "",
    pfInclusion: false,
    esiInclusion: false,
    bonusInclusion: false,
    gratuityInclusion: false,
    showOnPayslip: true,
    payslipOrder: 0,
    isActive: true,
};

/* ── Screen ── */

export function SalaryComponentScreen() {
    const { data, isLoading, isError } = useSalaryComponents();
    const createMutation = useCreateSalaryComponent();
    const updateMutation = useUpdateSalaryComponent();
    const deleteMutation = useDeleteSalaryComponent();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_COMPONENT });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const components: any[] = data?.data ?? [];

    const filtered = components.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            c.name?.toLowerCase().includes(s) ||
            c.code?.toLowerCase().includes(s) ||
            c.type?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_COMPONENT });
        setModalOpen(true);
    };

    const openEdit = (c: any) => {
        setEditingId(c.id);
        setForm({
            name: c.name ?? "",
            code: c.code ?? "",
            type: c.type ?? "",
            calculationMethod: c.calculationMethod ?? "FIXED",
            formulaValue: c.formulaValue ?? 0,
            formula: c.formula ?? "",
            taxable: c.taxable ?? "FULLY_TAXABLE",
            exemptionLimit: c.exemptionLimit ?? 0,
            exemptionSection: c.exemptionSection ?? "",
            pfInclusion: c.pfInclusion ?? false,
            esiInclusion: c.esiInclusion ?? false,
            bonusInclusion: c.bonusInclusion ?? false,
            gratuityInclusion: c.gratuityInclusion ?? false,
            showOnPayslip: c.showOnPayslip ?? true,
            payslipOrder: c.payslipOrder ?? 0,
            isActive: c.isActive ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code,
                type: form.type,
                calculationMethod: form.calculationMethod,
                formula: form.calculationMethod === "FORMULA" ? form.formula : undefined,
                formulaValue: form.calculationMethod !== "FORMULA" ? form.formulaValue : undefined,
                taxable: form.taxable,
                exemptionSection: form.taxable === "PARTIALLY_EXEMPT" ? form.exemptionSection : undefined,
                exemptionLimit: form.taxable === "PARTIALLY_EXEMPT" ? form.exemptionLimit : undefined,
                pfInclusion: form.pfInclusion,
                esiInclusion: form.esiInclusion,
                bonusInclusion: form.bonusInclusion,
                gratuityInclusion: form.gratuityInclusion,
                showOnPayslip: form.showOnPayslip,
                payslipOrder: form.payslipOrder || undefined,
                isActive: form.isActive,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Component Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Component Created", `${form.name} has been added.`);
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
            showSuccess("Component Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    const getCalcDisplay = (c: any) => {
        switch (c.calculationMethod) {
            case "FIXED": return `Fixed \u20B9${(c.formulaValue ?? 0).toLocaleString("en-IN")}`;
            case "PERCENT_OF_BASIC": return `${c.formulaValue ?? 0}% of Basic`;
            case "PERCENT_OF_GROSS": return `${c.formulaValue ?? 0}% of Gross`;
            case "FORMULA": return "Formula";
            default: return c.calculationMethod ?? "—";
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Salary Components</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Define earnings, deductions, tax treatment, and statutory inclusions</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Component
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search salary components..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load salary components. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={8} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Calculation</th>
                                    <th className="py-4 px-6 font-bold">Tax Treatment</th>
                                    <th className="py-4 px-6 font-bold text-center">PF / ESI</th>
                                    <th className="py-4 px-6 font-bold text-center">Payslip</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((c: any) => (
                                    <tr
                                        key={c.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <Wallet className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{c.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{c.code || "—"}</td>
                                        <td className="py-4 px-6"><TypeBadge type={c.type} /></td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{getCalcDisplay(c)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400 capitalize">{(c.taxable ?? "").replace(/_/g, " ").toLowerCase()}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <YesNoBadge enabled={c.pfInclusion} />
                                                <YesNoBadge enabled={c.esiInclusion} />
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={c.showOnPayslip} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={8}>
                                            <EmptyState icon="list" title="No salary components found" message="Add your first salary component to get started." action={{ label: "Add Component", onClick: openCreate }} />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Salary Component" : "Add Salary Component"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Basic */}
                            <SectionLabel title="Basic Information" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Component Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Basic Salary" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. BASIC" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField label="Type" value={form.type} onChange={(v) => updateField("type", v)} options={COMPONENT_TYPES} placeholder="Select type..." />
                                <SelectField label="Calculation Method" value={form.calculationMethod} onChange={(v) => updateField("calculationMethod", v)} options={CALCULATION_METHODS} />
                            </div>

                            {/* Conditional: Fixed/Percentage value or Formula */}
                            {form.calculationMethod !== "FORMULA" && (
                                <NumberField label={form.calculationMethod === "FIXED" ? "Fixed Amount (\u20B9)" : "Percentage (%)"} value={form.formulaValue} onChange={(v) => updateField("formulaValue", v)} min={0} />
                            )}
                            {form.calculationMethod === "FORMULA" && (
                                <FormField label="Formula Expression" value={form.formula} onChange={(v) => updateField("formula", v)} placeholder="e.g. basic * 0.4" />
                            )}

                            {/* Tax Treatment */}
                            <SectionLabel title="Tax Treatment" />
                            <SelectField label="Taxable" value={form.taxable} onChange={(v) => updateField("taxable", v)} options={TAX_TREATMENTS} />
                            {form.taxable === "PARTIALLY_EXEMPT" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <NumberField label="Exemption Limit (₹ / year)" value={form.exemptionLimit} onChange={(v) => updateField("exemptionLimit", v)} min={0} />
                                    <FormField label="Exemption Section" value={form.exemptionSection} onChange={(v) => updateField("exemptionSection", v)} placeholder="e.g. Section 10(5)" />
                                </div>
                            )}

                            {/* Statutory */}
                            <SectionLabel title="Statutory Inclusion" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-1 border border-neutral-200 dark:border-neutral-700">
                                <ToggleSwitch label="Include in PF Wages" checked={form.pfInclusion} onChange={(v) => updateField("pfInclusion", v)} />
                                <ToggleSwitch label="Include in ESI Wages" checked={form.esiInclusion} onChange={(v) => updateField("esiInclusion", v)} />
                                <ToggleSwitch label="Include in Bonus" checked={form.bonusInclusion} onChange={(v) => updateField("bonusInclusion", v)} />
                                <ToggleSwitch label="Include in Gratuity" checked={form.gratuityInclusion} onChange={(v) => updateField("gratuityInclusion", v)} />
                            </div>

                            {/* Payslip */}
                            <SectionLabel title="Payslip Settings" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 space-y-2 border border-neutral-200 dark:border-neutral-700">
                                <ToggleSwitch label="Show on Payslip" checked={form.showOnPayslip} onChange={(v) => updateField("showOnPayslip", v)} />
                                {form.showOnPayslip && (
                                    <NumberField label="Payslip Display Order" value={form.payslipOrder} onChange={(v) => updateField("payslipOrder", v)} min={0} placeholder="0" />
                                )}
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Component?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. Salary structures using this component may be affected.
                        </p>
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
