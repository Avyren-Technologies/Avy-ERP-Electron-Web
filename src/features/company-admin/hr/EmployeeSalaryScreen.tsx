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
import { useEmployeeSalaries, useSalaryStructures, useSalaryComponents } from "@/features/company-admin/api/use-payroll-queries";
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
    const { data, isLoading, isError } = useEmployeeSalaries();
    const structuresQuery = useSalaryStructures();
    const employeesQuery = useEmployees();
    const componentsQuery = useSalaryComponents();
    const assignMutation = useAssignEmployeeSalary();
    const updateMutation = useUpdateEmployeeSalary();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_SALARY });

    const salaries: any[] = data?.data ?? [];
    const structures: any[] = structuresQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const salaryComponents: any[] = componentsQuery.data?.data ?? [];

    const getEmployeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        return emp ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() : id;
    };
    const getStructureName = (id: string) => structures.find((s: any) => s.id === id)?.name ?? id;

    const filtered = salaries.filter((s: any) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return getEmployeeName(s.employeeId).toLowerCase().includes(q) || getStructureName(s.structureId).toLowerCase().includes(q);
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
        const monthly = form.annualCtc / 12;
        const basicRow = (structure.components as any[]).find((c: any) => {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            return comp?.code?.toLowerCase() === "basic";
        });
        const basicAmt = basicRow ? (basicRow.method === "percentage_of_ctc" ? (monthly * basicRow.value) / 100 : basicRow.value) : 0;
        return (structure.components as any[]).map((c: any) => {
            const comp = salaryComponents.find((sc: any) => sc.id === c.componentId);
            let amt = 0;
            if (c.method === "fixed") amt = c.value;
            else if (c.method === "percentage_of_ctc") amt = (monthly * c.value) / 100;
            else if (c.method === "percentage_of_basic") amt = (basicAmt * c.value) / 100;
            return { name: comp?.name ?? "Unknown", monthly: Math.round(amt) };
        });
    }, [form.structureId, form.annualCtc, structures, salaryComponents]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Employee Salary</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Assign and manage salary structures for employees</p>
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
                    <input type="text" placeholder="Search by employee name..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
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
                                                <span className="font-bold text-primary-950 dark:text-white">{getEmployeeName(s.employeeId)}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono font-semibold text-primary-950 dark:text-white">₹{(s.annualCtc ?? 0).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-right font-mono text-neutral-600 dark:text-neutral-400">₹{Math.round((s.annualCtc ?? 0) / 12).toLocaleString("en-IN")}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{getStructureName(s.structureId)}</td>
                                        <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{s.effectiveFrom || "—"}</td>
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
                                            <span className="text-primary-950 dark:text-white">Total Monthly</span>
                                            <span className="font-mono text-primary-700 dark:text-primary-400">₹{breakupPreview.reduce((s, p) => s + p.monthly, 0).toLocaleString("en-IN")}</span>
                                        </div>
                                    </div>
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
