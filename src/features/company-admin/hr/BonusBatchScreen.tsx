import { useState, useMemo } from "react";
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
import { useDepartments, useDesignations, useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
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

type SelectionMode = "department" | "designation" | "employee";

interface PreviewItem {
    employeeId: string;
    employeeName: string;
    amount: number;
    remarks: string;
}

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
    const [selectionMode, setSelectionMode] = useState<SelectionMode>("employee");
    const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
    const [selectedDesignationId, setSelectedDesignationId] = useState("");
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [sameAmountForAll, setSameAmountForAll] = useState(true);
    const [bulkAmount, setBulkAmount] = useState("");
    const [individualAmounts, setIndividualAmounts] = useState<Record<string, string>>({});
    const [individualRemarks, setIndividualRemarks] = useState<Record<string, string>>({});
    const [showPreview, setShowPreview] = useState(false);

    const { data, isLoading, isError } = useBonusBatches();
    const { data: detailData, isLoading: detailLoading } = useBonusBatch(detailId);
    const createMutation = useCreateBonusBatch();
    const approveMutation = useApproveBonusBatch();
    const mergeMutation = useMergeBonusBatch();

    // HR data
    const { data: deptData } = useDepartments();
    const { data: desigData } = useDesignations();
    const deptFilterParams = useMemo(() => (selectedDepartmentId ? { departmentId: selectedDepartmentId } : undefined), [selectedDepartmentId]);
    const desigFilterParams = useMemo(() => (selectedDesignationId ? { designationId: selectedDesignationId } : undefined), [selectedDesignationId]);
    const { data: empByDept } = useEmployees(selectionMode === "department" && selectedDepartmentId ? deptFilterParams : undefined);
    const { data: empByDesig } = useEmployees(selectionMode === "designation" && selectedDesignationId ? desigFilterParams : undefined);
    const { data: allEmpData } = useEmployees();

    const departments: any[] = (deptData as any)?.data ?? deptData ?? [];
    const designations: any[] = (desigData as any)?.data ?? desigData ?? [];
    const allEmployees: any[] = (allEmpData as any)?.data ?? allEmpData ?? [];
    const deptEmployees: any[] = (empByDept as any)?.data ?? empByDept ?? [];
    const desigEmployees: any[] = (empByDesig as any)?.data ?? empByDesig ?? [];

    const batches: any[] = (data as any)?.data ?? [];
    const detail: any = (detailData as any)?.data ?? null;

    const filtered = batches.filter((b: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return b.name?.toLowerCase().includes(s) || b.type?.toLowerCase().includes(s) || b.status?.toLowerCase().includes(s);
    });

    // Build preview items based on selection mode
    const previewItems: PreviewItem[] = useMemo(() => {
        if (selectionMode === "department") {
            if (!selectedDepartmentId || !Array.isArray(deptEmployees)) return [];
            return deptEmployees.map((e: any) => ({
                employeeId: e.id,
                employeeName: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeId || e.id,
                amount: Number(bulkAmount) || 0,
                remarks: individualRemarks[e.id] ?? "",
            }));
        }
        if (selectionMode === "designation") {
            if (!selectedDesignationId || !Array.isArray(desigEmployees)) return [];
            return desigEmployees.map((e: any) => ({
                employeeId: e.id,
                employeeName: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeId || e.id,
                amount: Number(bulkAmount) || 0,
                remarks: individualRemarks[e.id] ?? "",
            }));
        }
        // employee mode
        if (selectedEmployeeIds.length === 0) return [];
        return selectedEmployeeIds.map((id) => {
            const e = allEmployees.find((emp: any) => emp.id === id);
            return {
                employeeId: id,
                employeeName: e ? `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.employeeId || id : id,
                amount: sameAmountForAll ? (Number(bulkAmount) || 0) : (Number(individualAmounts[id]) || 0),
                remarks: individualRemarks[id] ?? "",
            };
        });
    }, [selectionMode, selectedDepartmentId, selectedDesignationId, selectedEmployeeIds, deptEmployees, desigEmployees, allEmployees, bulkAmount, sameAmountForAll, individualAmounts, individualRemarks]);

    const totalAmount = previewItems.reduce((sum, i) => sum + i.amount, 0);

    const openCreate = () => {
        setFormName("");
        setFormType("");
        setSelectionMode("employee");
        setSelectedDepartmentId("");
        setSelectedDesignationId("");
        setSelectedEmployeeIds([]);
        setSameAmountForAll(true);
        setBulkAmount("");
        setIndividualAmounts({});
        setIndividualRemarks({});
        setShowPreview(false);
        setModalOpen(true);
    };

    const handleCreate = async () => {
        try {
            const items = previewItems.filter((i) => i.employeeId && i.amount > 0);
            await createMutation.mutateAsync({
                name: formName,
                type: formType,
                items,
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

    const departmentOptions = Array.isArray(departments) ? departments.map((d: any) => ({ value: d.id, label: d.name })) : [];
    const designationOptions = Array.isArray(designations) ? designations.map((d: any) => ({ value: d.id, label: d.name })) : [];
    const employeeOptions = Array.isArray(allEmployees) ? allEmployees.map((e: any) => ({
        value: e.id,
        label: `${e.firstName ?? ""} ${e.lastName ?? ""}`.trim() || e.id,
        sublabel: e.employeeId ?? e.id,
    })) : [];

    const resolvedEmployeeCount =
        selectionMode === "department" ? (Array.isArray(deptEmployees) ? deptEmployees.length : 0) :
        selectionMode === "designation" ? (Array.isArray(desigEmployees) ? desigEmployees.length : 0) :
        selectedEmployeeIds.length;

    const canSubmit = formName.trim() && formType && previewItems.some((i) => i.amount > 0);

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
                                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
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
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Create Bonus Batch</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {/* Batch Name & Type */}
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Batch Name *" value={formName} onChange={setFormName} placeholder="e.g. Q1 Performance Bonus" />
                                <SelectField label="Bonus Type *" value={formType} onChange={setFormType} options={BONUS_TYPES} placeholder="Select type" />
                            </div>

                            {/* Selection Mode Tabs */}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-2">Selection Mode</label>
                                <div className="flex gap-2">
                                    {([
                                        { key: "department" as const, label: "By Department" },
                                        { key: "designation" as const, label: "By Designation" },
                                        { key: "employee" as const, label: "By Employee" },
                                    ]).map((tab) => (
                                        <button
                                            key={tab.key}
                                            onClick={() => {
                                                setSelectionMode(tab.key);
                                                setSelectedDepartmentId("");
                                                setSelectedDesignationId("");
                                                setSelectedEmployeeIds([]);
                                                setBulkAmount("");
                                                setIndividualAmounts({});
                                                setIndividualRemarks({});
                                                setShowPreview(false);
                                            }}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-sm font-bold transition-all border",
                                                selectionMode === tab.key
                                                    ? "bg-primary-600 text-white border-primary-600 shadow-md shadow-primary-500/20"
                                                    : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                            )}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* By Department */}
                            {selectionMode === "department" && (
                                <div className="space-y-4">
                                    <SearchableSelect
                                        label="Department"
                                        value={selectedDepartmentId}
                                        onChange={setSelectedDepartmentId}
                                        options={departmentOptions}
                                        placeholder="Search department..."
                                        required
                                    />
                                    {selectedDepartmentId && (
                                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex items-center gap-2">
                                            <Users size={16} className="text-primary-600 dark:text-primary-400" />
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{Array.isArray(deptEmployees) ? deptEmployees.length : 0} employees found</span>
                                        </div>
                                    )}
                                    <FormField label="Bonus Amount (for all)" value={bulkAmount} onChange={setBulkAmount} placeholder="Enter amount" type="number" />
                                </div>
                            )}

                            {/* By Designation */}
                            {selectionMode === "designation" && (
                                <div className="space-y-4">
                                    <SearchableSelect
                                        label="Designation"
                                        value={selectedDesignationId}
                                        onChange={setSelectedDesignationId}
                                        options={designationOptions}
                                        placeholder="Search designation..."
                                        required
                                    />
                                    {selectedDesignationId && (
                                        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex items-center gap-2">
                                            <Users size={16} className="text-primary-600 dark:text-primary-400" />
                                            <span className="text-sm font-bold text-primary-700 dark:text-primary-300">{Array.isArray(desigEmployees) ? desigEmployees.length : 0} employees found</span>
                                        </div>
                                    )}
                                    <FormField label="Bonus Amount (for all)" value={bulkAmount} onChange={setBulkAmount} placeholder="Enter amount" type="number" />
                                </div>
                            )}

                            {/* By Employee */}
                            {selectionMode === "employee" && (
                                <div className="space-y-4">
                                    <SearchableSelect
                                        label="Employees"
                                        value=""
                                        onChange={() => {}}
                                        multiple
                                        selectedValues={selectedEmployeeIds}
                                        onMultiChange={setSelectedEmployeeIds}
                                        options={employeeOptions}
                                        placeholder="Search employees..."
                                        required
                                    />
                                    {/* Selected chips */}
                                    {selectedEmployeeIds.length > 0 && (
                                        <div className="flex flex-wrap gap-2">
                                            {selectedEmployeeIds.map((id) => {
                                                const emp = allEmployees.find((e: any) => e.id === id);
                                                const name = emp ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId : id;
                                                return (
                                                    <span key={id} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/20 text-xs font-bold text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800/50">
                                                        {name}
                                                        <button onClick={() => setSelectedEmployeeIds((p) => p.filter((v) => v !== id))} className="hover:text-danger-500 transition-colors">
                                                            <X size={12} />
                                                        </button>
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {selectedEmployeeIds.length > 0 && (
                                        <>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSameAmountForAll(true)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                                        sameAmountForAll
                                                            ? "bg-primary-600 text-white border-primary-600"
                                                            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                                                    )}
                                                >
                                                    Same Amount for All
                                                </button>
                                                <button
                                                    onClick={() => setSameAmountForAll(false)}
                                                    className={cn(
                                                        "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                                                        !sameAmountForAll
                                                            ? "bg-primary-600 text-white border-primary-600"
                                                            : "bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700"
                                                    )}
                                                >
                                                    Individual Amounts
                                                </button>
                                            </div>

                                            {sameAmountForAll ? (
                                                <FormField label="Bonus Amount (for all)" value={bulkAmount} onChange={setBulkAmount} placeholder="Enter amount" type="number" />
                                            ) : (
                                                <div className="space-y-2">
                                                    {selectedEmployeeIds.map((id) => {
                                                        const emp = allEmployees.find((e: any) => e.id === id);
                                                        const name = emp ? `${emp.firstName ?? ""} ${emp.lastName ?? ""}`.trim() || emp.employeeId : id;
                                                        return (
                                                            <div key={id} className="flex items-center gap-3 p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-100 dark:border-neutral-800">
                                                                <span className="text-sm font-semibold text-primary-950 dark:text-white flex-1 truncate">{name}</span>
                                                                <input
                                                                    type="number"
                                                                    value={individualAmounts[id] ?? ""}
                                                                    onChange={(e) => setIndividualAmounts((p) => ({ ...p, [id]: e.target.value }))}
                                                                    placeholder="Amount"
                                                                    className="w-32 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                                                />
                                                                <input
                                                                    value={individualRemarks[id] ?? ""}
                                                                    onChange={(e) => setIndividualRemarks((p) => ({ ...p, [id]: e.target.value }))}
                                                                    placeholder="Remarks"
                                                                    className="w-40 px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* Preview Section */}
                            {resolvedEmployeeCount > 0 && (
                                <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 transition-colors mb-3"
                                    >
                                        {showPreview ? "Hide Preview" : "Show Preview"}
                                    </button>

                                    {showPreview && (
                                        <div className="space-y-3">
                                            <div className="flex gap-4">
                                                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-3 flex-1">
                                                    <p className="text-[10px] text-neutral-500 uppercase font-semibold">Total Employees</p>
                                                    <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{previewItems.length}</p>
                                                </div>
                                                <div className="bg-success-50 dark:bg-success-900/20 rounded-xl p-3 flex-1">
                                                    <p className="text-[10px] text-neutral-500 uppercase font-semibold">Total Amount</p>
                                                    <p className="text-lg font-bold text-success-700 dark:text-success-300">{"\u20B9"}{totalAmount.toLocaleString("en-IN")}</p>
                                                </div>
                                            </div>
                                            <div className="overflow-x-auto border border-neutral-200 dark:border-neutral-800 rounded-xl max-h-48 overflow-y-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-neutral-50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-[10px] text-neutral-500 uppercase tracking-widest">
                                                            <th className="py-2 px-3 font-bold">Employee</th>
                                                            <th className="py-2 px-3 font-bold text-right">Amount</th>
                                                            <th className="py-2 px-3 font-bold">Remarks</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="text-xs">
                                                        {previewItems.map((item) => (
                                                            <tr key={item.employeeId} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0">
                                                                <td className="py-2 px-3 font-semibold text-primary-950 dark:text-white">{item.employeeName}</td>
                                                                <td className="py-2 px-3 text-right font-mono">{"\u20B9"}{item.amount.toLocaleString("en-IN")}</td>
                                                                <td className="py-2 px-3 text-neutral-500">{item.remarks || "—"}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreate} disabled={createMutation.isPending || !canSubmit} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : `Create Batch (${previewItems.length} employees)`}
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
                                                        <td className="py-3 px-4 text-xs text-neutral-500">{item.remarks || "—"}</td>
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
