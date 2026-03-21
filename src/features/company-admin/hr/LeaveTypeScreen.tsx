import { useState } from "react";
import {
    CalendarDays,
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
import { useLeaveTypes } from "@/features/company-admin/api/use-leave-queries";
import { useEmployeeTypes } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateLeaveType,
    useUpdateLeaveType,
    useDeleteLeaveType,
} from "@/features/company-admin/api/use-leave-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Shared form atoms ── */

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

function StatusBadge({ status }: { status: string }) {
    const active = status?.toLowerCase() === "active";
    return (
        <span
            className={cn(
                "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                active
                    ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                    : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
            )}
        >
            {status}
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

function CategoryBadge({ category }: { category: string }) {
    const colorMap: Record<string, string> = {
        earned: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        casual: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        sick: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        maternity: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        paternity: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        compensatory: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        lop: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50",
    };
    const cls = colorMap[category?.toLowerCase()] ?? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", cls)}>
            {category || "Other"}
        </span>
    );
}

function MultiSelectField({
    label,
    selected,
    onChange,
    options,
}: {
    label: string;
    selected: string[];
    onChange: (v: string[]) => void;
    options: { value: string; label: string }[];
}) {
    const toggle = (val: string) => {
        onChange(
            selected.includes(val)
                ? selected.filter((s) => s !== val)
                : [...selected, val]
        );
    };
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <div className="flex flex-wrap gap-2">
                {options.map((o) => (
                    <button
                        key={o.value}
                        type="button"
                        onClick={() => toggle(o.value)}
                        className={cn(
                            "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all",
                            selected.includes(o.value)
                                ? "bg-primary-50 text-primary-700 border-primary-300 dark:bg-primary-900/30 dark:text-primary-400 dark:border-primary-700"
                                : "bg-neutral-50 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-300"
                        )}
                    >
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

/* ── Constants ── */

const LEAVE_CATEGORIES = [
    { value: "PAID", label: "Paid (Earned / Casual / Sick)" },
    { value: "UNPAID", label: "Unpaid (LOP)" },
    { value: "COMPENSATORY", label: "Compensatory Off" },
    { value: "STATUTORY", label: "Statutory (Maternity / Paternity)" },
];

const ACCRUAL_FREQUENCIES = [
    { value: "MONTHLY", label: "Monthly" },
    { value: "QUARTERLY", label: "Quarterly" },
    { value: "ANNUAL", label: "Annual" },
    { value: "PRO_RATA", label: "Pro-Rata" },
    { value: "UPFRONT", label: "Upfront" },
];

const GENDER_OPTIONS = [
    { value: "", label: "All" },
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
];

/* ── Empty form ── */

const EMPTY_LEAVE_TYPE = {
    name: "",
    code: "",
    category: "",
    annualEntitlement: 0,
    accrualFrequency: "MONTHLY",
    accrualDay: 1,
    carryForwardAllowed: false,
    maxCarryForwardDays: 0,
    encashmentAllowed: false,
    maxEncashableDays: 0,
    encashmentRate: "",
    applicableTypeIds: [] as string[],
    applicableGender: "",
    probationRestricted: false,
    minAdvanceNotice: 0,
    minDaysPerApplication: 0.5,
    maxConsecutiveDays: 0,
    allowHalfDay: true,
    weekendSandwich: false,
    holidaySandwich: false,
    documentRequired: false,
    documentAfterDays: 0,
    lopOnExcess: true,
};

/* ── Screen ── */

export function LeaveTypeScreen() {
    const { data, isLoading, isError } = useLeaveTypes();
    const empTypesQuery = useEmployeeTypes();
    const createMutation = useCreateLeaveType();
    const updateMutation = useUpdateLeaveType();
    const deleteMutation = useDeleteLeaveType();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_LEAVE_TYPE });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    const leaveTypes: any[] = data?.data ?? [];
    const empTypes: any[] = empTypesQuery.data?.data ?? [];

    const filtered = leaveTypes.filter((lt: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return (
            lt.name?.toLowerCase().includes(s) ||
            lt.code?.toLowerCase().includes(s) ||
            lt.category?.toLowerCase().includes(s)
        );
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_LEAVE_TYPE });
        setModalOpen(true);
    };

    const openEdit = (lt: any) => {
        setEditingId(lt.id);
        setForm({
            name: lt.name ?? "",
            code: lt.code ?? "",
            category: lt.category ?? "",
            annualEntitlement: lt.annualEntitlement ?? 0,
            accrualFrequency: lt.accrualFrequency ?? "MONTHLY",
            accrualDay: lt.accrualDay ?? 1,
            carryForwardAllowed: lt.carryForwardAllowed ?? false,
            maxCarryForwardDays: lt.maxCarryForwardDays ?? 0,
            encashmentAllowed: lt.encashmentAllowed ?? false,
            maxEncashableDays: lt.maxEncashableDays ?? 0,
            encashmentRate: lt.encashmentRate ?? "",
            applicableTypeIds: lt.applicableTypeIds ?? [],
            applicableGender: lt.applicableGender ?? "",
            probationRestricted: lt.probationRestricted ?? false,
            minAdvanceNotice: lt.minAdvanceNotice ?? 0,
            minDaysPerApplication: lt.minDaysPerApplication ?? 0.5,
            maxConsecutiveDays: lt.maxConsecutiveDays ?? 0,
            allowHalfDay: lt.allowHalfDay ?? true,
            weekendSandwich: lt.weekendSandwich ?? false,
            holidaySandwich: lt.holidaySandwich ?? false,
            documentRequired: lt.documentRequired ?? false,
            documentAfterDays: lt.documentAfterDays ?? 0,
            lopOnExcess: lt.lopOnExcess ?? true,
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                code: form.code,
                category: form.category,
                annualEntitlement: form.annualEntitlement,
                accrualFrequency: form.accrualFrequency || undefined,
                accrualDay: form.accrualDay || undefined,
                carryForwardAllowed: form.carryForwardAllowed,
                maxCarryForwardDays: form.carryForwardAllowed ? form.maxCarryForwardDays : undefined,
                encashmentAllowed: form.encashmentAllowed,
                maxEncashableDays: form.encashmentAllowed ? form.maxEncashableDays : undefined,
                encashmentRate: form.encashmentAllowed && form.encashmentRate ? String(form.encashmentRate) : undefined,
                applicableTypeIds: form.applicableTypeIds.length > 0 ? form.applicableTypeIds : undefined,
                applicableGender: form.applicableGender || undefined,
                probationRestricted: form.probationRestricted,
                minAdvanceNotice: form.minAdvanceNotice || undefined,
                minDaysPerApplication: form.minDaysPerApplication || undefined,
                maxConsecutiveDays: form.maxConsecutiveDays || undefined,
                allowHalfDay: form.allowHalfDay,
                weekendSandwich: form.weekendSandwich,
                holidaySandwich: form.holidaySandwich,
                documentRequired: form.documentRequired,
                documentAfterDays: form.documentRequired ? form.documentAfterDays : undefined,
                lopOnExcess: form.lopOnExcess,
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Leave Type Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Leave Type Created", `${form.name} has been added.`);
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
            showSuccess("Leave Type Deleted", `${deleteTarget.name} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Leave Types</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure leave categories, accrual rules, and entitlements</p>
                </div>
                <button
                    onClick={openCreate}
                    className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                >
                    <Plus className="w-5 h-5" />
                    Add Leave Type
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder="Search leave types..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                    Failed to load leave types. Please try again.
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? (
                    <SkeletonTable rows={5} cols={10} />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[1100px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Code</th>
                                    <th className="py-4 px-6 font-bold">Category</th>
                                    <th className="py-4 px-6 font-bold text-center">Annual Days</th>
                                    <th className="py-4 px-6 font-bold">Accrual</th>
                                    <th className="py-4 px-6 font-bold text-center">Carry Fwd</th>
                                    <th className="py-4 px-6 font-bold text-center">Encashment</th>
                                    <th className="py-4 px-6 font-bold text-center">Half Day</th>
                                    <th className="py-4 px-6 font-bold text-center">Category</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((lt: any) => (
                                    <tr
                                        key={lt.id}
                                        className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors"
                                    >
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                    <CalendarDays className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                </div>
                                                <span className="font-bold text-primary-950 dark:text-white">{lt.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">{lt.code || "\u2014"}</td>
                                        <td className="py-4 px-6"><CategoryBadge category={lt.category} /></td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{lt.annualEntitlement ?? 0}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs capitalize">{lt.accrualFrequency || "monthly"}</td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={lt.carryForwardAllowed} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={lt.encashmentAllowed} /></td>
                                        <td className="py-4 px-6 text-center"><YesNoBadge enabled={lt.allowHalfDay} /></td>
                                        <td className="py-4 px-6 text-center"><CategoryBadge category={lt.category} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openEdit(lt)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit">
                                                    <Edit3 size={15} />
                                                </button>
                                                <button onClick={() => setDeleteTarget(lt)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr>
                                        <td colSpan={10}>
                                            <EmptyState icon="list" title="No leave types found" message="Add your first leave type to get started." action={{ label: "Add Leave Type", onClick: openCreate }} />
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
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Leave Type" : "Add Leave Type"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {/* Basic */}
                            <SectionLabel title="Basic Information" />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField label="Leave Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Casual Leave" />
                                <FormField label="Code" value={form.code} onChange={(v) => updateField("code", v)} placeholder="e.g. CL" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Category"
                                    value={form.category}
                                    onChange={(v) => updateField("category", v)}
                                    options={LEAVE_CATEGORIES}
                                    placeholder="Select category..."
                                />
                                <NumberField label="Annual Entitlement (Days)" value={form.annualEntitlement} onChange={(v) => updateField("annualEntitlement", v)} min={0} />
                            </div>

                            {/* Accrual */}
                            <SectionLabel title="Accrual" />
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Accrual Frequency"
                                    value={form.accrualFrequency}
                                    onChange={(v) => updateField("accrualFrequency", v)}
                                    options={ACCRUAL_FREQUENCIES}
                                />
                                <NumberField label="Accrual Day" value={form.accrualDay} onChange={(v) => updateField("accrualDay", v)} min={1} max={28} placeholder="1" />
                            </div>

                            {/* Carry Forward */}
                            <SectionLabel title="Carry Forward" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                <ToggleSwitch label="Enable Carry Forward" checked={form.carryForwardAllowed} onChange={(v) => updateField("carryForwardAllowed", v)} />
                                {form.carryForwardAllowed && (
                                    <NumberField label="Max Carry Forward Days" value={form.maxCarryForwardDays} onChange={(v) => updateField("maxCarryForwardDays", v)} min={0} />
                                )}
                            </div>

                            {/* Encashment */}
                            <SectionLabel title="Encashment" />
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                <ToggleSwitch label="Enable Encashment" checked={form.encashmentAllowed} onChange={(v) => updateField("encashmentAllowed", v)} />
                                {form.encashmentAllowed && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <NumberField label="Max Encashable Days" value={form.maxEncashableDays} onChange={(v) => updateField("maxEncashableDays", v)} min={0} />
                                        <FormField label="Encashment Rate" value={form.encashmentRate} onChange={(v) => updateField("encashmentRate", v)} placeholder="e.g. 100% or formula" />
                                    </div>
                                )}
                            </div>

                            {/* Applicability */}
                            <SectionLabel title="Applicability" />
                            <MultiSelectField
                                label="Employee Types"
                                selected={form.applicableTypeIds}
                                onChange={(v) => updateField("applicableTypeIds", v)}
                                options={empTypes.map((et: any) => ({ value: et.id ?? et.code, label: et.name }))}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField
                                    label="Applicable Gender"
                                    value={form.applicableGender}
                                    onChange={(v) => updateField("applicableGender", v)}
                                    options={GENDER_OPTIONS}
                                />
                                <div className="flex items-end pb-1">
                                    <ToggleSwitch label="Probation Restricted" checked={form.probationRestricted} onChange={(v) => updateField("probationRestricted", v)} />
                                </div>
                            </div>

                            {/* Rules */}
                            <SectionLabel title="Rules" />
                            <div className="grid grid-cols-3 gap-4">
                                <NumberField label="Advance Notice (Days)" value={form.minAdvanceNotice} onChange={(v) => updateField("minAdvanceNotice", v)} min={0} />
                                <NumberField label="Min Days / Application" value={form.minDaysPerApplication} onChange={(v) => updateField("minDaysPerApplication", v)} min={0} />
                                <NumberField label="Max Consecutive Days" value={form.maxConsecutiveDays} onChange={(v) => updateField("maxConsecutiveDays", v)} min={0} placeholder="0 = unlimited" />
                            </div>
                            <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700 space-y-1">
                                <ToggleSwitch label="Allow Half Day" checked={form.allowHalfDay} onChange={(v) => updateField("allowHalfDay", v)} />
                                <ToggleSwitch label="Weekend Sandwich Rule" checked={form.weekendSandwich} onChange={(v) => updateField("weekendSandwich", v)} />
                                <ToggleSwitch label="Holiday Sandwich Rule" checked={form.holidaySandwich} onChange={(v) => updateField("holidaySandwich", v)} />
                                <ToggleSwitch label="Document Required" checked={form.documentRequired} onChange={(v) => updateField("documentRequired", v)} />
                                {form.documentRequired && (
                                    <NumberField label="Document Required After (Days)" value={form.documentAfterDays} onChange={(v) => updateField("documentAfterDays", v)} min={1} />
                                )}
                                <ToggleSwitch label="LOP on Excess" checked={form.lopOnExcess} onChange={(v) => updateField("lopOnExcess", v)} />
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Leave Type?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. Any policies referencing this type may be affected.
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
