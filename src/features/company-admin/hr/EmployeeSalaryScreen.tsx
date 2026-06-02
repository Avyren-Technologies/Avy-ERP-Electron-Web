import { useState, useMemo } from "react";
import {
    IndianRupee,
    Plus,
    Edit3,
    Loader2,
    X,
    Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useEmployeeSalaries, useSalaryStructures, useSalaryComponents, usePFConfig, useESIConfig, useGratuityConfig } from "@/features/company-admin/api/use-payroll-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useAssignEmployeeSalary,
    useUpdateEmployeeSalary,
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

function NumberField({ label, value, onChange, placeholder, min }: { label: string; value: number; onChange: (v: number) => void; placeholder?: string; min?: number }) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">{label}</label>
            <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} placeholder={placeholder} min={min} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
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

function SectionLabel({ title }: { title: string }) {
    return (
        <div className="pt-3 pb-1">
            <h3 className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">{title}</h3>
            <div className="h-px bg-primary-100 dark:bg-primary-900/30 mt-1.5" />
        </div>
    );
}

function CurrentBadge({ isCurrent }: { isCurrent: boolean }) {
    return isCurrent ? (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">Current</span>
    ) : (
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">Previous</span>
    );
}

/* ── Empty form ── */

const EMPTY_SALARY = {
    employeeId: "",
    structureId: "",
    annualCtc: 0,
    effectiveFrom: "",
};

/* ── Screen ── */

export function EmployeeSalaryScreen() {
    const fmt = useCompanyFormatter();
    const [page, setPage] = useState(1);
    const limit = 25;
    const { data, isLoading, isError } = useEmployeeSalaries({ page, limit });
    const structuresQuery = useSalaryStructures();
    const employeesQuery = useEmployees();
    const componentsQuery = useSalaryComponents();
    const pfConfigQuery = usePFConfig();
    const esiConfigQuery = useESIConfig();
    const gratuityConfigQuery = useGratuityConfig();
    const assignMutation = useAssignEmployeeSalary();
    const updateMutation = useUpdateEmployeeSalary();

    const pfConfig: any = pfConfigQuery.data?.data ?? null;
    const esiConfig: any = esiConfigQuery.data?.data ?? null;
    const gratuityConfig: any = gratuityConfigQuery.data?.data ?? null;

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_SALARY });

    const salaries: any[] = data?.data ?? [];
    const meta = (data as { meta?: { page: number; limit: number; total: number; totalPages: number } })?.meta;
    const total = meta?.total ?? salaries.length;
    const structures: any[] = structuresQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const salaryComponents: any[] = componentsQuery.data?.data ?? [];

    /** Extract employee display name from nested employee object or fallback to separate list */
    const getEmployeeName = (s: any) => {
        const emp = s.employee ?? employees.find((e: any) => e.id === s.employeeId);
        if (!emp) return s.employeeId;
        return `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId || s.employeeId;
    };
    const getEmployeeCode = (s: any) => s.employee?.employeeId ?? "";
    const getStructureName = (s: any) => s.structure?.name ?? structures.find((st: any) => st.id === s.structureId)?.name ?? s.structureId;

    const filtered = salaries.filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            getEmployeeName(s).toLowerCase().includes(q) ||
            getEmployeeCode(s).toLowerCase().includes(q) ||
            getStructureName(s).toLowerCase().includes(q)
        );
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_SALARY }); setModalOpen(true); };
    const openEdit = (s: any) => {
        setEditingId(s.id);
        setForm({
            employeeId: s.employeeId ?? "",
            structureId: s.structureId ?? "",
            annualCtc: s.annualCtc ?? 0,
            effectiveFrom: s.effectiveFrom ?? "",
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: form });
                showSuccess("Salary Updated", "Employee salary has been updated.");
            } else {
                await assignMutation.mutateAsync(form);
                showSuccess("Salary Assigned", "Employee salary has been assigned.");
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const saving = assignMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    // Compute breakup preview based on selected structure & CTC
    const breakupPreview = useMemo(() => {
        if (!form.structureId || !form.annualCtc) return [];
        const structure = structures.find((s: any) => s.id === form.structureId);
        if (!structure?.components) return [];
        const comps = structure.components as any[];
        const monthlyGross = form.annualCtc / 12;

        // Resolve component details — enriched structures have `component` sub-object, fallback to separate lookup
        const resolveComp = (c: any) => c.component ?? salaryComponents.find((sc: any) => sc.id === c.componentId);
        const resolveName = (c: any) => resolveComp(c)?.name ?? "Unknown";
        const resolveCode = (c: any) => (resolveComp(c)?.code ?? "").toUpperCase();
        const getMethod = (c: any) => (c.calculationMethod ?? c.method ?? "").toUpperCase();

        // First pass: find basic amount
        const basicRow = comps.find((c: any) => resolveCode(c) === "BASIC");
        let basicAmt = 0;
        if (basicRow) {
            const m = getMethod(basicRow);
            if (m === "FIXED") basicAmt = Number(basicRow.value) || 0;
            else if (m === "PERCENT_OF_GROSS" || m === "PERCENTAGE_OF_CTC") basicAmt = (monthlyGross * (Number(basicRow.value) || 0)) / 100;
        }

        // Second pass: compute all non-BALANCE components
        const rows = comps.map((c: any) => {
            const m = getMethod(c);
            const val = Number(c.value) || 0;
            const isBalance = m === "BALANCE";
            let amt = 0;
            if (m === "FIXED") amt = val;
            else if (m === "PERCENT_OF_GROSS" || m === "PERCENTAGE_OF_CTC") amt = (monthlyGross * val) / 100;
            else if (m === "PERCENT_OF_BASIC" || m === "PERCENTAGE_OF_BASIC") amt = (basicAmt * val) / 100;
            else if (m === "FORMULA") {
                const formula = (c.formula ?? c.formulaValue ?? "").toString().toLowerCase();
                const match = formula.match(/([\d.]+)%?\s*of\s*(gross|basic)/);
                if (match) {
                    const pct = parseFloat(match[1]);
                    amt = match[2] === "basic" ? (basicAmt * pct) / 100 : (monthlyGross * pct) / 100;
                }
            }
            return { name: resolveName(c), monthly: Math.round(amt), isBalance, componentId: c.componentId };
        });

        // Third pass: fill BALANCE components with remainder
        const totalBeforeBalance = rows.filter(r => !r.isBalance).reduce((s, r) => s + r.monthly, 0);
        let balanceFilled = false;
        for (const row of rows) {
            if (row.isBalance && !balanceFilled) {
                row.monthly = Math.max(0, Math.round(monthlyGross - totalBeforeBalance));
                balanceFilled = true;
            }
        }

        return rows;
    }, [form.structureId, form.annualCtc, structures, salaryComponents]);

    // Compute statutory estimates
    const statutoryEstimates = useMemo(() => {
        if (breakupPreview.length === 0) return null;
        const estimates: { label: string; monthly: number; category: "deduction" | "employer" }[] = [];
        const grossSalary = breakupPreview.reduce((s, p) => s + p.monthly, 0);

        let pfWageBase = 0;
        let esiWageBase = 0;
        let gratuityWageBase = 0;

        for (const row of breakupPreview) {
            const comp = salaryComponents.find((sc: any) => sc.id === row.componentId);
            if (!comp) continue;
            if (comp.pfInclusion) pfWageBase += row.monthly;
            if (comp.esiInclusion) esiWageBase += row.monthly;
            if (comp.gratuityInclusion) gratuityWageBase += row.monthly;
        }

        if (pfConfig && pfWageBase > 0) {
            const capped = Math.min(pfWageBase, Number(pfConfig.wageCeiling ?? 15000));
            const pfEmp = Math.round(capped * Number(pfConfig.employeeRate ?? 12) / 100);
            const pfErEpf = Math.round(capped * Number(pfConfig.employerEpfRate ?? 3.67) / 100);
            const pfErEps = Math.round(capped * Number(pfConfig.employerEpsRate ?? 8.33) / 100);
            estimates.push({ label: "PF (Employee)", monthly: pfEmp, category: "deduction" });
            estimates.push({ label: "PF (Employer)", monthly: pfErEpf + pfErEps, category: "employer" });
        }

        if (esiConfig) {
            const esiBase = esiWageBase > 0 ? esiWageBase : grossSalary;
            if (esiBase <= Number(esiConfig.wageCeiling ?? 21000)) {
                const esiEmp = Math.round(esiBase * Number(esiConfig.employeeRate ?? 0.75) / 100);
                const esiEr = Math.round(esiBase * Number(esiConfig.employerRate ?? 3.25) / 100);
                estimates.push({ label: "ESI (Employee)", monthly: esiEmp, category: "deduction" });
                estimates.push({ label: "ESI (Employer)", monthly: esiEr, category: "employer" });
            }
        }

        if (gratuityConfig?.provisionMethod === "MONTHLY" && gratuityWageBase > 0) {
            const annualGratuity = (gratuityWageBase * 15 * 1) / 26;
            const capped = Math.min(annualGratuity, Number(gratuityConfig.maxAmount ?? 2000000));
            estimates.push({ label: "Gratuity (Employer)", monthly: Math.round(capped / 12), category: "employer" });
        }

        if (estimates.length === 0) return null;

        const deductions = estimates.filter(e => e.category === "deduction");
        const employer = estimates.filter(e => e.category === "employer");
        const totalDeductions = deductions.reduce((s, e) => s + e.monthly, 0);
        const totalEmployer = employer.reduce((s, e) => s + e.monthly, 0);
        const netTakeHome = grossSalary - totalDeductions;
        const totalCtc = grossSalary + totalEmployer;

        return { items: estimates, deductions, employer, totalDeductions, totalEmployer, netTakeHome, totalCtc, grossSalary };
    }, [breakupPreview, salaryComponents, pfConfig, esiConfig, gratuityConfig]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Employee Salary</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                        {total > 0
                            ? `${total} assignment${total !== 1 ? "s" : ""} — assign and manage salary structures for employees`
                            : "Assign and manage salary structures for employees"}
                    </p>
                </div>
                <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                    <Plus className="w-5 h-5" />
                    Assign Salary
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder="Search by employee name, ID, or structure..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load employee salaries. Please try again.
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
                                    <th className="py-4 px-6 font-bold">Employee</th>
                                    <th className="py-4 px-6 font-bold text-right">Annual CTC (₹)</th>
                                    <th className="py-4 px-6 font-bold text-right">Monthly Gross (₹)</th>
                                    <th className="py-4 px-6 font-bold">Structure</th>
                                    <th className="py-4 px-6 font-bold">Effective From</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((s: any) => (
                                    <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <IndianRupee className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{getEmployeeName(s)}</span>
                                                    {getEmployeeCode(s) && <span className="block text-[11px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5">{getEmployeeCode(s)}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">₹{(s.annualCtc ?? 0).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{Math.round((s.annualCtc ?? 0) / 12).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{getStructureName(s)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{s.effectiveFrom ? fmt.date(s.effectiveFrom) : "—"}</td>
                                        <td className="py-4 px-6 text-center"><CurrentBadge isCurrent={s.isCurrent !== false} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <button onClick={() => openEdit(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No employee salaries found" message="Assign salary to your first employee." action={{ label: "Assign Salary", onClick: openCreate }} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {!isLoading && total > 0 && (
                    <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
                        <span className="font-medium">
                            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} entries
                        </span>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                disabled={page <= 1}
                            >
                                Previous
                            </button>
                            <button
                                type="button"
                                onClick={() => setPage((p) => p + 1)}
                                className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50"
                                disabled={!meta || page >= (meta.totalPages ?? 1)}
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Create/Edit Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Employee Salary" : "Assign Salary"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField label="Employee" value={form.employeeId} onChange={(v) => updateField("employeeId", v)} options={employees.map((e: any) => ({ value: e.id, label: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id }))} placeholder="Select employee..." />
                            <SelectField label="Salary Structure" value={form.structureId} onChange={(v) => updateField("structureId", v)} options={structures.map((s: any) => ({ value: s.id, label: s.name }))} placeholder="Select structure..." />
                            <NumberField label="Annual CTC (₹)" value={form.annualCtc} onChange={(v) => updateField("annualCtc", v)} min={0} />
                            <FormField label="Effective From" value={form.effectiveFrom} onChange={(v) => updateField("effectiveFrom", v)} type="date" />

                            {/* Breakup Preview */}
                            {breakupPreview.length > 0 && (
                                <>
                                    <SectionLabel title="Auto-Computed Monthly Breakup" />
                                    <div className="bg-primary-50/50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-800/50 p-4">
                                        {breakupPreview.map((p, i) => (
                                            <div key={i} className="flex justify-between py-1.5 text-sm">
                                                <span className="text-neutral-700 dark:text-neutral-300">{p.name}</span>
                                                <span className="font-mono font-semibold text-primary-950 dark:text-white">₹{p.monthly.toLocaleString("en-IN")}</span>
                                            </div>
                                        ))}
                                        <div className="border-t border-primary-200 dark:border-primary-800/50 mt-2 pt-2 flex justify-between text-sm font-bold">
                                            <span className="text-primary-950 dark:text-white">Gross Salary</span>
                                            <span className="font-mono text-primary-700 dark:text-primary-400">₹{breakupPreview.reduce((s, p) => s + p.monthly, 0).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>

                                    {/* Statutory Estimates */}
                                    {statutoryEstimates && (
                                        <div className="space-y-3">
                                            {/* Employee Deductions */}
                                            {statutoryEstimates.deductions.length > 0 && (
                                                <div className="bg-amber-50/50 dark:bg-amber-900/10 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4">
                                                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">Employee Deductions (Estimated)</p>
                                                    {statutoryEstimates.deductions.map((est, i) => (
                                                        <div key={i} className="flex justify-between py-1.5 text-sm">
                                                            <span className="text-amber-800 dark:text-amber-300">{est.label}</span>
                                                            <span className="font-mono font-semibold text-amber-700 dark:text-amber-400">₹{est.monthly.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between pt-2 mt-2 border-t border-amber-200 dark:border-amber-800/50 text-sm font-bold">
                                                        <span className="text-amber-800 dark:text-amber-300">Est. Take-Home</span>
                                                        <span className="font-mono text-amber-700 dark:text-amber-400">₹{statutoryEstimates.netTakeHome.toLocaleString("en-IN")}</span>
                                                    </div>
                                                </div>
                                            )}
                                            {/* Employer Contributions */}
                                            {statutoryEstimates.employer.length > 0 && (
                                                <div className="bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800/50 p-4">
                                                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Employer Contributions (Estimated)</p>
                                                    {statutoryEstimates.employer.map((est, i) => (
                                                        <div key={i} className="flex justify-between py-1.5 text-sm">
                                                            <span className="text-blue-800 dark:text-blue-300">{est.label}</span>
                                                            <span className="font-mono font-semibold text-blue-700 dark:text-blue-400">₹{est.monthly.toLocaleString("en-IN")}</span>
                                                        </div>
                                                    ))}
                                                    <div className="flex justify-between pt-2 mt-2 border-t border-blue-200 dark:border-blue-800/50 text-sm font-bold">
                                                        <span className="text-blue-800 dark:text-blue-300">Total CTC</span>
                                                        <span className="font-mono text-blue-700 dark:text-blue-400">₹{statutoryEstimates.totalCtc.toLocaleString("en-IN")}</span>
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[10px] text-neutral-400 px-1">Based on current statutory config. Actual amounts vary with attendance and CTC.</p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Assign"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
