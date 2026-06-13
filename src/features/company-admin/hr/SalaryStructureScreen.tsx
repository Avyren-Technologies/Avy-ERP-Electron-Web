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
import { useSalaryStructures, useSalaryComponents, usePFConfig, useESIConfig, useGratuityConfig, useStatutoryToggles } from "@/features/company-admin/api/use-payroll-queries";
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
    { value: "VARIABLE", label: "Variable" },
    { value: "BALANCE", label: "Balance (Auto)" },
];

const CTC_BASIS_OPTIONS = [
    { value: "CTC", label: "Annual CTC" },
    { value: "MONTHLY_CTC", label: "Monthly CTC" },
    { value: "TAKE_HOME", label: "Annual Take Home" },
    { value: "MONTHLY_TAKE_HOME", label: "Monthly Take Home" },
];

const SAMPLE_CTC_LABELS: Record<string, string> = {
    CTC: "Sample Annual CTC",
    MONTHLY_CTC: "Sample Monthly CTC",
    TAKE_HOME: "Sample Annual Take-Home",
    MONTHLY_TAKE_HOME: "Sample Monthly Take-Home",
};

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
    const { data: pfConfigData } = usePFConfig();
    const pfConfig = (pfConfigData as any)?.data;
    const { data: esiConfigData } = useESIConfig();
    const esiConfig = (esiConfigData as any)?.data;
    const { data: gratuityConfigData } = useGratuityConfig();
    const gratuityConfig = (gratuityConfigData as any)?.data;
    const { data: togglesData } = useStatutoryToggles();
    const toggles = ((togglesData as any)?.data ?? {}) as Record<string, boolean>;
    const pfEnabled = toggles.pfEnabled !== false;
    const esiEnabled = toggles.esiEnabled !== false;
    const gratuityEnabled = toggles.gratuityEnabled !== false;
    const ptEnabled = toggles.ptEnabled !== false;
    const lwfEnabled = toggles.lwfEnabled !== false;
    const bonusEnabled = toggles.bonusEnabled !== false;
    const disabledStatutoryNames: string[] = [];
    if (!pfEnabled) disabledStatutoryNames.push("PF");
    if (!esiEnabled) disabledStatutoryNames.push("ESI");
    if (!ptEnabled) disabledStatutoryNames.push("PT");
    if (!lwfEnabled) disabledStatutoryNames.push("LWF");
    if (!gratuityEnabled) disabledStatutoryNames.push("Gratuity");
    if (!bonusEnabled) disabledStatutoryNames.push("Bonus");
    const createMutation = useCreateSalaryStructure();
    const updateMutation = useUpdateSalaryStructure();
    const deleteMutation = useDeleteSalaryStructure();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_STRUCTURE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [sampleCTC, setSampleCTC] = useState("1000000");
    const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

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

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_STRUCTURE, components: [] }); setCodeManuallyEdited(false); setSampleCTC("1000000"); setModalOpen(true); };
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
        setCodeManuallyEdited(true);
        setModalOpen(true);
    };

    const generateCode = (name: string) => {
        return name.trim().split(/\s+/).map(w => w.substring(0, 3).toUpperCase()).join("-") || "";
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
                    value: c.calculationMethod === "VARIABLE" ? (Number(c.value) || 0) : (c.value || undefined),
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
    const sampleInput = Number(sampleCTC) || 0;
    // Convert sample input to annual CTC based on basis (TAKE_HOME variants treated like CTC variants for preview)
    const annualCtcNum = (form.ctcBasis === "MONTHLY_CTC" || form.ctcBasis === "MONTHLY_TAKE_HOME")
        ? sampleInput * 12
        : sampleInput;
    const monthlyGross = Math.round(annualCtcNum / 12);

    const computePreview = () => {
        // First pass: find basic amount (component code === 'BASIC' check preserved)
        let basicAmt = 0;
        for (const c of form.components) {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            const isBasic = comp?.code?.toLowerCase() === "basic" || comp?.name?.toLowerCase()?.includes("basic");
            if (isBasic) {
                if (c.calculationMethod === "FIXED") basicAmt = c.value;
                else if (c.calculationMethod === "PERCENT_OF_GROSS") basicAmt = Math.round(monthlyGross * (c.value / 100));
            }
        }
        if (!basicAmt) basicAmt = Math.round(monthlyGross * 0.4);

        // Order: FIXED → %_GROSS → %_BASIC → FORMULA → VARIABLE → BALANCE
        const rows = form.components.map((c) => {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            let monthly = 0;
            if (c.calculationMethod === "FIXED") monthly = c.value;
            else if (c.calculationMethod === "PERCENT_OF_GROSS") monthly = Math.round(monthlyGross * (c.value / 100));
            else if (c.calculationMethod === "PERCENT_OF_BASIC") monthly = Math.round(basicAmt * (c.value / 100));
            else if (c.calculationMethod === "FORMULA") {
                const formula = (c.formula ?? "").toString().toLowerCase();
                const match = formula.match(/([\d.]+)%?\s*of\s*(gross|basic)/);
                if (match) {
                    const pct = parseFloat(match[1]);
                    monthly = match[2] === "basic" ? Math.round(basicAmt * pct / 100) : Math.round(monthlyGross * pct / 100);
                }
            } else if (c.calculationMethod === "VARIABLE") {
                // Structure component's `value` is the monthly default amount
                monthly = Math.round(Number(c.value) || 0);
            }
            // BALANCE handled below
            const type: string = comp?.type ?? "EARNING";
            return { name: comp?.name ?? "Unknown", monthly, isBalance: c.calculationMethod === "BALANCE", type };
        });

        // Fill BALANCE components with the remainder (auto-shrinks as variables/etc. fill in)
        const totalBeforeBalance = rows.filter(r => !r.isBalance).reduce((s, r) => s + r.monthly, 0);
        let balanceFilled = false;
        for (const row of rows) {
            if (row.isBalance && !balanceFilled) {
                row.monthly = Math.max(0, Math.round(monthlyGross - totalBeforeBalance));
                balanceFilled = true;
            }
        }

        return rows;
    };

    // Filter only EARNING components for the dropdown
    const earningComponents = salaryComponents.filter((sc: any) => sc.type === "EARNING");

    // Statutory estimates based on inclusion flags
    const computeStatutoryEstimates = () => {
        const preview = computePreview();
        const estimates: { label: string; monthly: number; category: 'deduction' | 'employer' }[] = [];
        let pfWageBase = 0;
        let esiWageBase = 0;
        let gratuityWageBase = 0;
        const totalMonthly = preview.reduce((s, p) => s + p.monthly, 0);

        for (const c of form.components) {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            if (!comp) continue;
            const row = preview.find((p) => p.name === comp.name);
            const monthlyVal = row?.monthly ?? 0;
            if (comp.pfInclusion) pfWageBase += monthlyVal;
            if (comp.esiInclusion) esiWageBase += monthlyVal;
            if (comp.gratuityInclusion) gratuityWageBase += monthlyVal;
        }

        if (pfConfig && pfEnabled && pfWageBase > 0) {
            const capped = Math.min(pfWageBase, Number(pfConfig.wageCeiling ?? 15000));
            const pfEmp = Math.round(capped * Number(pfConfig.employeeRate ?? 12) / 100);
            const pfErEpf = Math.round(capped * Number(pfConfig.employerEpfRate ?? 3.67) / 100);
            const pfErEps = Math.round(capped * Number(pfConfig.employerEpsRate ?? 8.33) / 100);
            estimates.push({ label: "PF (Employee)", monthly: pfEmp, category: "deduction" as const });
            estimates.push({ label: "PF (Employer)", monthly: pfErEpf + pfErEps, category: "employer" as const });
        }

        if (esiConfig && esiEnabled) {
            const esiBase = esiWageBase > 0 ? esiWageBase : totalMonthly;
            if (esiBase <= Number(esiConfig.wageCeiling ?? 21000)) {
                const esiEmp = Math.round(esiBase * Number(esiConfig.employeeRate ?? 0.75) / 100);
                const esiEr = Math.round(esiBase * Number(esiConfig.employerRate ?? 3.25) / 100);
                estimates.push({ label: "ESI (Employee)", monthly: esiEmp, category: "deduction" as const });
                estimates.push({ label: "ESI (Employer)", monthly: esiEr, category: "employer" as const });
            }
        }

        if (gratuityConfig?.provisionMethod === "MONTHLY" && gratuityEnabled && gratuityWageBase > 0) {
            const annualGratuity = (gratuityWageBase * 15 * 1) / 26;
            const capped = Math.min(annualGratuity, Number(gratuityConfig.maxAmount ?? 2000000));
            estimates.push({ label: "Gratuity (Employer)", monthly: Math.round(capped / 12), category: "employer" as const });
        }

        // Summary lines
        const deductions = estimates.filter(e => e.category === "deduction");
        const employerContribs = estimates.filter(e => e.category === "employer");
        const totalDeductions = deductions.reduce((s, e) => s + e.monthly, 0);
        const totalEmployer = employerContribs.reduce((s, e) => s + e.monthly, 0);
        const netTakeHome = totalMonthly - totalDeductions;
        const totalCtc = totalMonthly + totalEmployer;

        return { items: estimates, totalDeductions, totalEmployer, netTakeHome, totalCtc, grossSalary: totalMonthly };
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
                                <FormField label="Structure Name" value={form.name} onChange={(v) => {
                                    updateField("name", v);
                                    if (!codeManuallyEdited) updateField("code", generateCode(v));
                                }} placeholder="e.g. Standard CTC" />
                                <FormField label="Code" value={form.code} onChange={(v) => { setCodeManuallyEdited(true); updateField("code", v); }} placeholder="e.g. STD-CTC" />
                                <SelectField label="CTC Basis" value={form.ctcBasis} onChange={(v) => updateField("ctcBasis", v)} options={CTC_BASIS_OPTIONS} />
                            </div>

                            <SectionLabel title="Applicability" />
                            <MultiSelectField label="Grades" selected={form.applicableGradeIds} onChange={(v) => updateField("applicableGradeIds", v)} options={grades.map((g: any) => ({ value: g.id ?? g.code, label: g.name }))} showAllOption />
                            <MultiSelectField label="Designations" selected={form.applicableDesignationIds} onChange={(v) => updateField("applicableDesignationIds", v)} options={designations.map((d: any) => ({ value: d.id ?? d.code, label: d.name }))} showAllOption />
                            <MultiSelectField label="Employee Types" selected={form.applicableTypeIds} onChange={(v) => updateField("applicableTypeIds", v)} options={empTypes.map((e: any) => ({ value: e.id ?? e.code, label: e.name }))} />

                            <SectionLabel title="Component Breakup" />
                            {disabledStatutoryNames.length > 0 && (
                                <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-lg px-3 py-2">
                                    {disabledStatutoryNames.join(", ")} {disabledStatutoryNames.length === 1 ? "is" : "are"} disabled in your Statutory Components settings &mdash; enable them there to use here. Disabled statutory contributions will not appear in the estimated breakup.
                                </div>
                            )}
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
                                                        {earningComponents.map((sc: any) => (<option key={sc.id} value={sc.id}>{sc.name}</option>))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4">
                                                    <select value={row.calculationMethod} onChange={(e) => updateComponentRow(i, "calculationMethod", e.target.value)} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white">
                                                        {CALC_METHODS.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
                                                    </select>
                                                </td>
                                                <td className="py-2 px-4">
                                                    {row.calculationMethod === "BALANCE" ? (
                                                        <span className="block w-full px-2 py-1.5 text-sm text-right font-mono text-neutral-400 dark:text-neutral-500 italic">Auto</span>
                                                    ) : (
                                                        <>
                                                            <input type="number" value={row.value} onChange={(e) => updateComponentRow(i, "value", Number(e.target.value))} className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm text-right font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white" min={0} />
                                                            {row.calculationMethod === "VARIABLE" && (
                                                                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 text-right">Per-employee default (editable when assigning)</p>
                                                            )}
                                                        </>
                                                    )}
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
                                    <div className="mb-3">
                                        <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{SAMPLE_CTC_LABELS[form.ctcBasis] ?? "Sample Annual CTC"}</label>
                                        <div className="relative max-w-xs">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">₹</span>
                                            <input type="number" value={sampleCTC} onChange={(e) => setSampleCTC(e.target.value)}
                                                className="w-full pl-7 pr-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white"
                                                placeholder="1000000" min={0} />
                                        </div>
                                    </div>
                                    {(() => {
                                        const preview = computePreview();
                                        const earnings = preview.filter(p => p.type === "EARNING");
                                        const deductions = preview.filter(p => p.type === "DEDUCTION");
                                        const employerContribs = preview.filter(p => p.type === "EMPLOYER_CONTRIBUTION");
                                        const grossSalary = earnings.reduce((s, p) => s + p.monthly, 0);
                                        const totalDeductions = deductions.reduce((s, p) => s + p.monthly, 0);
                                        const totalEmployer = employerContribs.reduce((s, p) => s + p.monthly, 0);
                                        const ctcMonthly = grossSalary + totalEmployer;
                                        return (
                                            <>
                                                <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
                                                    {earnings.map((p, i) => (
                                                        <div key={i} className="flex justify-between py-1.5 text-sm">
                                                            <span className="text-neutral-700 dark:text-neutral-300">{p.name}</span>
                                                            <span className="font-mono font-semibold text-primary-950 dark:text-white">{p.monthly > 0 ? `₹${p.monthly.toLocaleString("en-IN")}` : "—"}</span>
                                                        </div>
                                                    ))}
                                                    <div className="border-t border-primary-200 dark:border-primary-800/50 mt-2 pt-2 flex justify-between text-sm font-bold">
                                                        <span className="text-primary-950 dark:text-white">Gross Salary</span>
                                                        <span className="font-mono text-primary-700 dark:text-primary-400">₹{grossSalary.toLocaleString("en-IN")}</span>
                                                    </div>
                                                </div>
                                                {deductions.length > 0 && (
                                                    <div className="bg-red-50/50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-800/50 p-4 mt-3">
                                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2">Employee Deductions</p>
                                                        {deductions.map((p, i) => (
                                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                                <span className="text-red-800 dark:text-red-300">{p.name}</span>
                                                                <span className="font-mono font-semibold text-red-700 dark:text-red-400">₹{p.monthly.toLocaleString("en-IN")}</span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-red-200 dark:border-red-800/50 mt-2 pt-2 flex justify-between text-sm font-bold">
                                                            <span className="text-red-800 dark:text-red-300">Total Deductions</span>
                                                            <span className="font-mono text-red-700 dark:text-red-400">₹{totalDeductions.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {employerContribs.length > 0 && (
                                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-800/50 p-4 mt-3">
                                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Employer Contributions</p>
                                                        {employerContribs.map((p, i) => (
                                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                                <span className="text-blue-800 dark:text-blue-300">{p.name}</span>
                                                                <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">₹{p.monthly.toLocaleString("en-IN")}</span>
                                                            </div>
                                                        ))}
                                                        <div className="border-t border-blue-200 dark:border-blue-800/50 mt-2 pt-2 flex justify-between text-sm font-bold">
                                                            <span className="text-blue-800 dark:text-blue-300">Total Employer Cost</span>
                                                            <span className="font-mono text-blue-700 dark:text-blue-400">₹{totalEmployer.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {totalEmployer > 0 && (
                                                    <div className="bg-accent-50/50 dark:bg-accent-900/10 rounded-xl border border-accent-100 dark:border-accent-800/50 p-4 mt-3">
                                                        <div className="flex justify-between text-sm font-bold">
                                                            <span className="text-accent-900 dark:text-accent-200">CTC (Gross + Employer)</span>
                                                            <span className="font-mono text-accent-700 dark:text-accent-400">₹{ctcMonthly.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </>
                                        );
                                    })()}

                                    {/* Statutory Estimates */}
                                    {(() => {
                                        const stat = computeStatutoryEstimates();
                                        if (stat.items.length === 0) return null;
                                        const deductions = stat.items.filter(e => e.category === "deduction");
                                        const employer = stat.items.filter(e => e.category === "employer");
                                        return (
                                            <div className="space-y-3 mt-3">
                                                {/* Employee Deductions */}
                                                {deductions.length > 0 && (
                                                    <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
                                                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Employee Deductions (Estimated)</p>
                                                        {deductions.map((est, i) => (
                                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                                <span className="text-amber-800 dark:text-amber-300">{est.label}</span>
                                                                <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">₹{est.monthly.toLocaleString("en-IN")}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between pt-2 mt-2 border-t border-amber-200 dark:border-amber-800/50 text-sm font-bold">
                                                            <span className="text-amber-800 dark:text-amber-300">Est. Take-Home</span>
                                                            <span className="font-mono text-amber-700 dark:text-amber-400">₹{stat.netTakeHome.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {/* Employer Contributions */}
                                                {employer.length > 0 && (
                                                    <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
                                                        <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Employer Contributions (Estimated)</p>
                                                        {employer.map((est, i) => (
                                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                                <span className="text-blue-800 dark:text-blue-300">{est.label}</span>
                                                                <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">₹{est.monthly.toLocaleString("en-IN")}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex justify-between pt-2 mt-2 border-t border-blue-200 dark:border-blue-800/50 text-sm font-bold">
                                                            <span className="text-blue-800 dark:text-blue-300">Total CTC</span>
                                                            <span className="font-mono text-blue-700 dark:text-blue-400">₹{stat.totalCtc.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    </div>
                                                )}
                                                <p className="text-[10px] text-neutral-400 px-1">Based on current statutory config. Actual amounts vary with attendance and CTC.</p>
                                            </div>
                                        );
                                    })()}
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
