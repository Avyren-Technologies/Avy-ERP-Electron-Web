import { useState } from "react";
import {
    TrendingUp,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    Calculator,
    Merge,
    Settings2,
    FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useProductionIncentiveConfigs,
    useProductionIncentiveRecords,
} from "@/features/company-admin/api/use-production-incentive-queries";
import { useDepartments } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateProductionIncentiveConfig,
    useUpdateProductionIncentiveConfig,
    useDeleteProductionIncentiveConfig,
    useComputeProductionIncentive,
    useMergeProductionIncentive,
} from "@/features/company-admin/api/use-production-incentive-mutations";
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
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
}) {
    return (
        <div>
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label} {required && <span className="text-danger-500">*</span>}
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
    searchable,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    searchable?: boolean;
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    if (!searchable) {
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

    const filtered = options.filter((o) => o.label.toLowerCase().includes(searchTerm.toLowerCase()));
    const selected = options.find((o) => o.value === value);

    return (
        <div className="relative">
            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">
                {label}
            </label>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm text-left focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all flex items-center justify-between"
            >
                <span className={selected ? "" : "text-neutral-400"}>{selected?.label ?? placeholder ?? "Select..."}</span>
                <Search size={14} className="text-neutral-400" />
            </button>
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-neutral-100 dark:border-neutral-700">
                        <input
                            type="text"
                            autoFocus
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search..."
                            className="w-full px-2.5 py-1.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary-500/20 dark:text-white"
                        />
                    </div>
                    <div className="overflow-y-auto max-h-48">
                        <button
                            type="button"
                            onClick={() => { onChange(""); setIsOpen(false); setSearchTerm(""); }}
                            className="w-full text-left px-3 py-2 text-sm text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                        >
                            {placeholder ?? "None"}
                        </button>
                        {filtered.map((o) => (
                            <button
                                key={o.value}
                                type="button"
                                onClick={() => { onChange(o.value); setIsOpen(false); setSearchTerm(""); }}
                                className={cn(
                                    "w-full text-left px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 dark:text-white",
                                    o.value === value && "bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 font-semibold"
                                )}
                            >
                                {o.label}
                            </button>
                        ))}
                        {filtered.length === 0 && (
                            <div className="px-3 py-2 text-sm text-neutral-400 text-center">No results</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

function BasisBadge({ basis }: { basis: string }) {
    const b = basis?.toUpperCase();
    const cls =
        b === "PIECE_RATE" || b === "PIECE"
            ? "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50"
            : b === "TARGET"
            ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
            : b === "SLAB"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {basis}
        </span>
    );
}

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "COMPUTED"
            ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50"
            : s === "MERGED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "DRAFT"
            ? "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700"
            : s === "PENDING"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", cls)}>
            {status}
        </span>
    );
}

function ActiveBadge({ active }: { active: boolean }) {
    return (
        <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            active
                ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
                : "bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700"
        )}>
            {active ? "Active" : "Inactive"}
        </span>
    );
}

/* ── Constants ── */

const BASES = [
    { value: "PIECE_RATE", label: "Piece Rate" },
    { value: "TARGET", label: "Target" },
    { value: "SLAB", label: "Slab" },
];

const CYCLES = [
    { value: "DAILY", label: "Daily" },
    { value: "WEEKLY", label: "Weekly" },
    { value: "MONTHLY", label: "Monthly" },
];

const MONTHS = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: new Date(2026, i, 1).toLocaleString("en", { month: "long" }),
}));

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((y) => ({ value: String(y), label: String(y) }));

function displayRef(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        const v = value as { name?: unknown; title?: unknown; code?: unknown; id?: unknown };
        if (typeof v.name === "string") return v.name;
        if (typeof v.title === "string") return v.title;
        if (typeof v.code === "string") return v.code;
        if (typeof v.id === "string") return v.id;
    }
    return String(value);
}

function idRef(value: unknown): string {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") {
        const v = value as { id?: unknown };
        if (typeof v.id === "string") return v.id;
    }
    return "";
}

const EMPTY_CONFIG = {
    name: "",
    basis: "SLAB",
    cycle: "MONTHLY",
    department: "",
    isActive: true,
    slabs: [] as { minOutput: string; maxOutput: string; amount: string }[],
};

/* ── Screen ── */

export function ProductionIncentiveScreen() {
    const [tab, setTab] = useState<"configs" | "records">("configs");
    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_CONFIG });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);

    // Record filters
    const [filterConfig, setFilterConfig] = useState("");
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1));
    const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR));

    const { data: deptData } = useDepartments();
    const departments: any[] = (deptData as any)?.data ?? [];

    const { data: configData, isLoading: configLoading, isError: configError } = useProductionIncentiveConfigs();
    const { data: recordData, isLoading: recordLoading, isError: recordError } = useProductionIncentiveRecords({
        configId: filterConfig || undefined,
        employeeId: filterEmployee || undefined,
        status: filterStatus || undefined,
        month: filterMonth ? Number(filterMonth) : undefined,
        year: filterYear ? Number(filterYear) : undefined,
    } as any);
    const createMutation = useCreateProductionIncentiveConfig();
    const updateMutation = useUpdateProductionIncentiveConfig();
    const deleteMutation = useDeleteProductionIncentiveConfig();
    const computeMutation = useComputeProductionIncentive();
    const mergeMutation = useMergeProductionIncentive();

    const configs: any[] = (configData as any)?.data ?? [];
    const records: any[] = (recordData as any)?.data ?? [];

    const filteredConfigs = configs.filter((c: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return displayRef(c.name).toLowerCase().includes(s) || displayRef(c.basis).toLowerCase().includes(s);
    });

    const openCreate = () => {
        setEditingId(null);
        setForm({ ...EMPTY_CONFIG, slabs: [] });
        setModalOpen(true);
    };

    const openEdit = (config: any) => {
        setEditingId(config.id);
        setForm({
            name: displayRef(config.name) ?? "",
            basis: config.basis ?? "SLAB",
            cycle: config.cycle ?? "MONTHLY",
            department: config.departmentId ?? idRef(config.department),
            isActive: config.isActive ?? true,
            slabs: (config.slabs ?? []).map((s: any) => ({
                minOutput: String(s.minOutput ?? ""),
                maxOutput: String(s.maxOutput ?? ""),
                amount: String(s.amount ?? ""),
            })),
        });
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                name: form.name,
                basis: form.basis,
                cycle: form.cycle,
                departmentId: form.department || undefined,
                isActive: form.isActive,
                slabs: form.slabs.map((s) => ({
                    minOutput: Number(s.minOutput),
                    maxOutput: Number(s.maxOutput),
                    amount: Number(s.amount),
                })),
            };
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Config Updated", `${displayRef(form.name)} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Config Created", `${displayRef(form.name)} has been added.`);
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
            showSuccess("Config Deleted", `${displayRef(deleteTarget.name)} has been removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleCompute = async () => {
        if (!filterConfig) {
            showApiError({ message: "Please select a configuration first before computing incentives." });
            return;
        }
        try {
            await computeMutation.mutateAsync(filterConfig);
            showSuccess("Incentives Computed", "Production incentives have been computed.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleMerge = async () => {
        if (!filterConfig) {
            showApiError({ message: "Please select a configuration first before merging to payroll." });
            return;
        }
        try {
            await mergeMutation.mutateAsync(filterConfig);
            showSuccess("Merged to Payroll", "Production incentives have been merged to payroll.");
        } catch (err) {
            showApiError(err);
        }
    };

    const addSlab = () => {
        setForm((p) => ({ ...p, slabs: [...p.slabs, { minOutput: "", maxOutput: "", amount: "" }] }));
    };

    const removeSlab = (index: number) => {
        setForm((p) => ({ ...p, slabs: p.slabs.filter((_, i) => i !== index) }));
    };

    const updateSlab = (index: number, field: string, value: string) => {
        setForm((p) => ({
            ...p,
            slabs: p.slabs.map((s, i) => (i === index ? { ...s, [field]: value } : s)),
        }));
    };

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Production Incentives</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Configure and manage production-based incentives</p>
                </div>
                {tab === "configs" && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />
                        Add Config
                    </button>
                )}
            </div>

            {/* Tab Switcher */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {([{ key: "configs", label: "Configurations", icon: Settings2 }, { key: "records", label: "Records", icon: FileText }] as const).map((t) => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={cn(
                            "inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all",
                            tab === t.key
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        <t.icon className="w-4 h-4" />
                        {t.label}
                    </button>
                ))}
            </div>

            {/* ── CONFIGS TAB ── */}
            {tab === "configs" && (
                <>
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                        <div className="relative max-w-md w-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                            <input
                                type="text"
                                placeholder="Search configs..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                            />
                        </div>
                    </div>

                    {configError && (
                        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                            Failed to load configurations. Please try again.
                        </div>
                    )}

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {configLoading ? (
                            <SkeletonTable rows={5} cols={6} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[850px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Name</th>
                                            <th className="py-4 px-6 font-bold text-center">Basis</th>
                                            <th className="py-4 px-6 font-bold text-center">Cycle</th>
                                            <th className="py-4 px-6 font-bold text-center">Slabs</th>
                                            <th className="py-4 px-6 font-bold">Department</th>
                                            <th className="py-4 px-6 font-bold text-center">Status</th>
                                            <th className="py-4 px-6 font-bold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filteredConfigs.map((c: any) => (
                                            <tr key={c.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0">
                                                            <TrendingUp className="w-4 h-4 text-accent-600 dark:text-accent-400" />
                                                        </div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{displayRef(c.name) || "—"}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-center"><BasisBadge basis={c.basis ?? "SLAB"} /></td>
                                                <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400 text-xs font-bold">{c.cycle ?? "MONTHLY"}</td>
                                                <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400 font-bold">{c.slabs?.length ?? 0}</td>
                                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{displayRef(c.department) || "—"}</td>
                                                <td className="py-4 px-6 text-center"><ActiveBadge active={c.isActive ?? true} /></td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEdit(c)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setDeleteTarget(c)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredConfigs.length === 0 && !configLoading && (
                                            <tr>
                                                <td colSpan={7}>
                                                    <EmptyState icon="list" title="No configs found" message="Create an incentive configuration to get started." action={{ label: "Add Config", onClick: openCreate }} />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── RECORDS TAB ── */}
            {tab === "records" && (
                <>
                    {/* Filters */}
                    <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            <SelectField label="Config" value={filterConfig} onChange={setFilterConfig} options={configs.map((c: any) => ({ value: c.id, label: displayRef(c.name) || c.id }))} placeholder="All configs" />
                            <FormField label="Employee ID" value={filterEmployee} onChange={setFilterEmployee} placeholder="Filter by employee" />
                            <SelectField label="Status" value={filterStatus} onChange={setFilterStatus} options={[{ value: "DRAFT", label: "Draft" }, { value: "COMPUTED", label: "Computed" }, { value: "MERGED", label: "Merged" }]} placeholder="All" />
                            <SelectField label="Month" value={filterMonth} onChange={setFilterMonth} options={MONTHS} />
                            <SelectField label="Year" value={filterYear} onChange={setFilterYear} options={YEARS} />
                        </div>
                        <div className="flex gap-3 mt-4">
                            <button
                                onClick={handleCompute}
                                disabled={computeMutation.isPending || !filterConfig}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-accent-600 hover:bg-accent-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                            >
                                {computeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Calculator className="w-4 h-4" />}
                                {computeMutation.isPending ? "Computing..." : "Compute"}
                            </button>
                            <button
                                onClick={handleMerge}
                                disabled={mergeMutation.isPending || !filterConfig}
                                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success-600 hover:bg-success-700 text-white text-sm font-bold transition-all disabled:opacity-50"
                            >
                                {mergeMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Merge className="w-4 h-4" />}
                                {mergeMutation.isPending ? "Merging..." : "Merge to Payroll"}
                            </button>
                        </div>
                    </div>

                    {recordError && (
                        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">
                            Failed to load records. Please try again.
                        </div>
                    )}

                    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                        {recordLoading ? (
                            <SkeletonTable rows={6} cols={5} />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[700px]">
                                    <thead>
                                        <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                            <th className="py-4 px-6 font-bold">Employee</th>
                                            <th className="py-4 px-6 font-bold text-center">Output Units</th>
                                            <th className="py-4 px-6 font-bold text-right">Incentive Amount</th>
                                            <th className="py-4 px-6 font-bold text-center">Status</th>
                                            <th className="py-4 px-6 font-bold">Config</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {records.map((r: any, i: number) => (
                                            <tr key={r.id ?? i} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{r.employeeName ?? r.employeeId ?? "—"}</td>
                                                <td className="py-4 px-6 text-center text-neutral-600 dark:text-neutral-400 font-mono">{r.outputUnits ?? r.output ?? 0}</td>
                                                <td className="py-4 px-6 text-right font-bold text-success-700 dark:text-success-400">{"₹"}{Number(r.amount ?? r.incentiveAmount ?? 0).toLocaleString("en-IN")}</td>
                                                <td className="py-4 px-6 text-center"><StatusBadge status={r.status ?? "DRAFT"} /></td>
                                                <td className="py-4 px-6 text-xs text-neutral-500 dark:text-neutral-400">{r.configName ?? r.configId ?? "—"}</td>
                                            </tr>
                                        ))}
                                        {records.length === 0 && !recordLoading && (
                                            <tr>
                                                <td colSpan={5}>
                                                    <EmptyState icon="list" title="No records found" message="Compute incentives to generate records." />
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ── Create/Edit Config Modal ── */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Config" : "Add Config"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <FormField label="Name" value={form.name} onChange={(v) => updateField("name", v)} placeholder="e.g. Assembly Line Incentive" required />
                            <div className="grid grid-cols-2 gap-4">
                                <SelectField label="Basis" value={form.basis} onChange={(v) => updateField("basis", v)} options={BASES} />
                                <SelectField label="Cycle" value={form.cycle} onChange={(v) => updateField("cycle", v)} options={CYCLES} />
                            </div>
                            <SelectField label="Department" value={form.department} onChange={(v) => updateField("department", v)} options={departments.map((d: any) => ({ value: d.id, label: d.name }))} placeholder="Select department (optional)" searchable />
                            <div className="flex items-center justify-between px-1">
                                <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Active</label>
                                <button
                                    type="button"
                                    onClick={() => updateField("isActive", !form.isActive)}
                                    className={cn(
                                        "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                                        form.isActive ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                    )}
                                >
                                    <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", form.isActive ? "left-[22px]" : "left-[3px]")} />
                                </button>
                            </div>
                            {/* Slabs */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Slabs</label>
                                    <button onClick={addSlab} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline">+ Add Slab</button>
                                </div>
                                {form.slabs.length > 0 && (
                                    <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">
                                        <span>Min Output</span><span>Max Output</span><span>Amount ({"₹"})</span><span></span>
                                    </div>
                                )}
                                {form.slabs.map((slab, i) => (
                                    <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2">
                                        <input value={slab.minOutput} onChange={(e) => updateSlab(i, "minOutput", e.target.value)} placeholder="0" type="number" className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white placeholder:text-neutral-400" />
                                        <input value={slab.maxOutput} onChange={(e) => updateSlab(i, "maxOutput", e.target.value)} placeholder="100" type="number" className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white placeholder:text-neutral-400" />
                                        <input value={slab.amount} onChange={(e) => updateSlab(i, "amount", e.target.value)} placeholder="500" type="number" className="px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white placeholder:text-neutral-400" />
                                        <button onClick={() => removeSlab(i)} className="p-1.5 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg self-center"><X size={14} /></button>
                                    </div>
                                ))}
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
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Config?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{displayRef(deleteTarget.name) || "this config"}</strong>. This action cannot be undone.
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
