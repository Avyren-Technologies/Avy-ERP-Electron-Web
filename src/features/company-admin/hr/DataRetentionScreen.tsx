import { useState } from "react";
import {
    Shield,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileSearch,
    ToggleLeft,
    Database,
    UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useRetentionPolicies,
    useRetentionDataRequests,
    useRetentionCheckDue,
    useRetentionConsents,
} from "@/features/company-admin/api/use-retention-queries";
import {
    useCreateRetentionPolicy,
    useDeleteRetentionPolicy,
    useCreateRetentionDataRequest,
    useUpdateRetentionDataRequest,
    useCreateRetentionConsent,
} from "@/features/company-admin/api/use-retention-mutations";
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

function StatusBadge({ status }: { status: string }) {
    const s = status?.toUpperCase();
    const cls =
        s === "PENDING"
            ? "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50"
            : s === "APPROVED" || s === "COMPLETED"
            ? "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50"
            : s === "REJECTED"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {status}
        </span>
    );
}

function TypeBadge({ type }: { type: string }) {
    const t = type?.toUpperCase();
    const cls =
        t === "ACCESS"
            ? "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50"
            : t === "PORTABILITY"
            ? "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50"
            : t === "ERASURE"
            ? "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/20 dark:text-danger-400 dark:border-danger-800/50"
            : "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700";
    return (
        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase", cls)}>
            {type}
        </span>
    );
}

/* ── Constants ── */

const TABS = [
    { id: "policies", label: "Policies", icon: Database },
    { id: "requests", label: "Access Requests", icon: FileSearch },
    { id: "consent", label: "Consent", icon: UserCheck },
] as const;

type TabId = typeof TABS[number]["id"];

const DATA_CATEGORIES = [
    { value: "PERSONAL_INFO", label: "Personal Information" },
    { value: "FINANCIAL_DATA", label: "Financial Data" },
    { value: "MEDICAL_RECORDS", label: "Medical Records" },
    { value: "ATTENDANCE_DATA", label: "Attendance Data" },
    { value: "PERFORMANCE_DATA", label: "Performance Data" },
    { value: "COMMUNICATION_LOGS", label: "Communication Logs" },
    { value: "EXIT_DATA", label: "Exit Data" },
];

const REQUEST_TYPES = [
    { value: "ACCESS", label: "Data Access" },
    { value: "PORTABILITY", label: "Data Portability" },
    { value: "ERASURE", label: "Data Erasure" },
];

const RETENTION_ACTIONS = [
    { value: "ARCHIVE", label: "Archive" },
    { value: "DELETE", label: "Delete" },
    { value: "ANONYMIZE", label: "Anonymize" },
];

/* ── Screen ── */

export function DataRetentionScreen() {
    const [activeTab, setActiveTab] = useState<TabId>("policies");
    const [search, setSearch] = useState("");
    const [policyModalOpen, setPolicyModalOpen] = useState(false);
    const [editingPolicy, setEditingPolicy] = useState<any>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [dueModalOpen, setDueModalOpen] = useState(false);

    // Policy form
    const [pCategory, setPCategory] = useState("");
    const [pYears, setPYears] = useState("");
    const [pAction, setPAction] = useState("");
    const [pDescription, setPDescription] = useState("");

    // Consent search
    const [consentEmployee, setConsentEmployee] = useState("");

    // Hooks
    const { data: policiesData, isLoading: policiesLoading } = useRetentionPolicies();
    const { data: requestsData, isLoading: requestsLoading } = useRetentionDataRequests();
    const { data: dueData, isLoading: dueLoading, refetch: refetchDue } = useRetentionCheckDue();
    const { data: consentsData, isLoading: consentsLoading } = useRetentionConsents(consentEmployee || "");

    const upsertPolicy = useCreateRetentionPolicy();
    const deletePolicy = useDeleteRetentionPolicy();
    const processRequest = useUpdateRetentionDataRequest();
    const recordConsent = useCreateRetentionConsent();

    const policies: any[] = (policiesData as any)?.data ?? [];
    const requests: any[] = (requestsData as any)?.data ?? [];
    const dueItems: any[] = (dueData as any)?.data ?? [];
    const consents: any[] = (consentsData as any)?.data ?? [];

    // Filtered
    const filteredPolicies = policies.filter((p: any) => {
        if (!search) return true;
        return p.category?.toLowerCase().includes(search.toLowerCase());
    });
    const filteredRequests = requests.filter((r: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return r.employeeName?.toLowerCase().includes(s) || r.type?.toLowerCase().includes(s);
    });

    // Policy modal
    const openCreatePolicy = () => {
        setEditingPolicy(null);
        setPCategory("");
        setPYears("");
        setPAction("");
        setPDescription("");
        setPolicyModalOpen(true);
    };

    const openEditPolicy = (p: any) => {
        setEditingPolicy(p);
        setPCategory(p.category ?? "");
        setPYears(String(p.retentionYears ?? ""));
        setPAction(p.action ?? "");
        setPDescription(p.description ?? "");
        setPolicyModalOpen(true);
    };

    const handleSavePolicy = async () => {
        try {
            await upsertPolicy.mutateAsync({
                dataCategory: pCategory,
                retentionYears: Number(pYears),
                actionAfter: pAction,
            } as any);
            showSuccess(editingPolicy ? "Policy Updated" : "Policy Created", "Retention policy saved.");
            setPolicyModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleDeletePolicy = async () => {
        if (!deleteTarget) return;
        try {
            await deletePolicy.mutateAsync(deleteTarget.id);
            showSuccess("Policy Deleted", `${deleteTarget.category} policy removed.`);
            setDeleteTarget(null);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleProcessRequest = async (id: string, action: string) => {
        try {
            await processRequest.mutateAsync({ id, action } as any);
            showSuccess("Request Processed", `Request has been ${action.toLowerCase()}.`);
        } catch (err) {
            showApiError(err);
        }
    };

    const handleToggleConsent = async (consent: any) => {
        try {
            await recordConsent.mutateAsync({
                employeeId: consent.employeeId,
                consentType: consent.consentType,
                granted: !consent.granted,
            } as any);
            showSuccess("Consent Updated", "Consent record updated.");
        } catch (err) {
            showApiError(err);
        }
    };

    const handleCheckDue = () => {
        refetchDue();
        setDueModalOpen(true);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Data Retention & GDPR</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage retention policies, access requests & consent</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleCheckDue}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-warning-200 dark:border-warning-800 text-sm font-bold text-warning-700 dark:text-warning-400 hover:bg-warning-50 dark:hover:bg-warning-900/20 transition-colors"
                    >
                        <AlertTriangle className="w-4 h-4" />
                        Check Retention Due
                    </button>
                    {activeTab === "policies" && (
                        <button
                            onClick={openCreatePolicy}
                            className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                        >
                            <Plus className="w-5 h-5" />
                            Add Policy
                        </button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSearch(""); }}
                        className={cn(
                            "inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === tab.id
                                ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm"
                                : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input
                        type="text"
                        placeholder={activeTab === "consent" ? "Search employee for consent..." : "Search..."}
                        value={activeTab === "consent" ? consentEmployee : search}
                        onChange={(e) => activeTab === "consent" ? setConsentEmployee(e.target.value) : setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                    />
                </div>
            </div>

            {/* ── Policies Tab ── */}
            {activeTab === "policies" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {policiesLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Data Category</th>
                                        <th className="py-4 px-6 font-bold text-center">Retention (Years)</th>
                                        <th className="py-4 px-6 font-bold text-center">Action</th>
                                        <th className="py-4 px-6 font-bold">Description</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredPolicies.map((p: any) => (
                                        <tr key={p.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                        <Shield className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                    </div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{p.category?.replace(/_/g, " ")}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-center font-mono text-xs font-bold text-neutral-700 dark:text-neutral-300">{p.retentionYears ?? "—"}</td>
                                            <td className="py-4 px-6 text-center">
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700 uppercase">
                                                    {p.action}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{p.description || "—"}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditPolicy(p)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors">
                                                        <Edit3 size={15} />
                                                    </button>
                                                    <button onClick={() => setDeleteTarget(p)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors">
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredPolicies.length === 0 && !policiesLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No policies" message="Add retention policies to get started." action={{ label: "Add Policy", onClick: openCreatePolicy }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Access Requests Tab ── */}
            {activeTab === "requests" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {requestsLoading ? (
                        <SkeletonTable rows={5} cols={5} />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold text-center">Type</th>
                                        <th className="py-4 px-6 font-bold">Submitted</th>
                                        <th className="py-4 px-6 font-bold text-center">Status</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredRequests.map((r: any) => (
                                        <tr key={r.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6 font-bold text-primary-950 dark:text-white">{r.employeeName ?? "—"}</td>
                                            <td className="py-4 px-6 text-center"><TypeBadge type={r.type ?? "ACCESS"} /></td>
                                            <td className="py-4 px-6 font-mono text-xs text-neutral-600 dark:text-neutral-400">
                                                {r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                                            </td>
                                            <td className="py-4 px-6 text-center"><StatusBadge status={r.status ?? "PENDING"} /></td>
                                            <td className="py-4 px-6 text-right">
                                                {r.status === "PENDING" && (
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleProcessRequest(r.id, "APPROVED")} disabled={processRequest.isPending} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20 transition-colors">
                                                            <CheckCircle2 size={13} /> Approve
                                                        </button>
                                                        <button onClick={() => handleProcessRequest(r.id, "REJECTED")} disabled={processRequest.isPending} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-danger-600 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors">
                                                            <X size={13} /> Reject
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredRequests.length === 0 && !requestsLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No access requests" message="No data access requests found." /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Consent Tab ── */}
            {activeTab === "consent" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {consentsLoading ? (
                        <SkeletonTable rows={4} cols={4} />
                    ) : consents.length === 0 ? (
                        <div className="p-8">
                            <EmptyState icon="list" title="No consent records" message={consentEmployee ? `No consent records for "${consentEmployee}".` : "Search for an employee to view consent records."} />
                        </div>
                    ) : (
                        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                            {consents.map((c: any) => (
                                <div key={c.id ?? `${c.employeeId}-${c.consentType}`} className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                    <div>
                                        <p className="font-bold text-sm text-primary-950 dark:text-white">{c.consentType?.replace(/_/g, " ")}</p>
                                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{c.employeeName ?? c.employeeId}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={cn("text-xs font-bold", c.granted ? "text-success-600 dark:text-success-400" : "text-neutral-400")}>
                                            {c.granted ? "Granted" : "Not Granted"}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleToggleConsent(c)}
                                            disabled={recordConsent.isPending}
                                            className={cn(
                                                "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                                                c.granted ? "bg-success-500" : "bg-neutral-300 dark:bg-neutral-700"
                                            )}
                                        >
                                            <div className={cn("w-[18px] h-[18px] rounded-full bg-white absolute top-[3px] transition-all shadow-sm", c.granted ? "left-[22px]" : "left-[3px]")} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Policy Create/Edit Modal ── */}
            {policyModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingPolicy ? "Edit Policy" : "Add Policy"}</h2>
                            <button onClick={() => setPolicyModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <SelectField label="Data Category" value={pCategory} onChange={setPCategory} options={DATA_CATEGORIES} placeholder="Select category" />
                            <FormField label="Retention Years" value={pYears} onChange={setPYears} type="number" placeholder="e.g. 7" />
                            <SelectField label="Action After Retention" value={pAction} onChange={setPAction} options={RETENTION_ACTIONS} placeholder="Select action" />
                            <FormField label="Description" value={pDescription} onChange={setPDescription} placeholder="Optional description" />
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setPolicyModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSavePolicy} disabled={upsertPolicy.isPending || !pCategory || !pYears || !pAction} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {upsertPolicy.isPending && <Loader2 size={14} className="animate-spin" />}
                                {upsertPolicy.isPending ? "Saving..." : editingPolicy ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Policy?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete the <strong>{deleteTarget.category?.replace(/_/g, " ")}</strong> retention policy.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeletePolicy} disabled={deletePolicy.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deletePolicy.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Retention Due Modal ── */}
            {dueModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Retention Check</h2>
                            <button onClick={() => setDueModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            {dueLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-primary-500 animate-spin" /></div>
                            ) : dueItems.length === 0 ? (
                                <div className="text-center py-8">
                                    <CheckCircle2 className="w-12 h-12 text-success-500 mx-auto mb-3" />
                                    <p className="font-bold text-primary-950 dark:text-white">All Clear</p>
                                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">No overdue retention records found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {dueItems.map((d: any, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800/50">
                                            <div>
                                                <p className="font-bold text-sm text-warning-800 dark:text-warning-300">{d.category?.replace(/_/g, " ")}</p>
                                                <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">Action: {d.action}</p>
                                            </div>
                                            <div className="bg-warning-100 dark:bg-warning-900/40 px-3 py-1 rounded-full">
                                                <span className="font-bold text-sm text-warning-700 dark:text-warning-300">{d.overdueCount ?? 0}</span>
                                                <span className="text-xs text-warning-600 dark:text-warning-400 ml-1">records</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex justify-end px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setDueModalOpen(false)} className="px-6 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
