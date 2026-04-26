import { useState } from "react";
import { Users, Plus, Loader2, X, Search, LogIn, LogOut, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGroupVisits, useGates } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateGroupVisit, useBatchCheckInGroupVisit, useBatchCheckOutGroupVisit, useUpdateGroupVisit } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useCompanyFormatter } from "@/hooks/useCompanyFormatter";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import { useCompanyLocations } from "@/features/company-admin/api/use-company-admin-queries";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const EMPTY_MEMBER = { visitorName: "", visitorMobile: "", visitorEmail: "", visitorCompany: "" };
const EMPTY_FORM = { groupName: "", hostEmployeeId: "", purpose: "", expectedDate: "", expectedTime: "", plantId: "", gateId: "", members: [{ ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }] };

export function GroupVisitScreen() {
    const fmt = useCompanyFormatter();
    const canCreate = useCanPerform("visitors:create");
    const { data, isLoading, isError } = useGroupVisits();
    const createMutation = useCreateGroupVisit();
    const batchCheckInMutation = useBatchCheckInGroupVisit();
    const batchCheckOutMutation = useBatchCheckOutGroupVisit();
    const updateGroupMutation = useUpdateGroupVisit();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ groupName: "", purpose: "", expectedDate: "", expectedTime: "" });
    const [form, setForm] = useState({ ...EMPTY_FORM, members: [{ ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }] });
    const [actionId, setActionId] = useState<string | null>(null);

    const employeesQuery = useEmployees({ limit: 500 });
    const employees: any[] = employeesQuery.data?.data ?? [];
    const locationsQuery = useCompanyLocations();
    const locations: any[] = (locationsQuery.data as any)?.data ?? [];
    const gatesQuery = useGates();
    const gates: any[] = gatesQuery.data?.data ?? [];

    const filteredGates = gates.filter((g: any) => !form.plantId || g.plantId === form.plantId);

    const groups: any[] = data?.data ?? [];
    const filtered = groups.filter((g: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return g.groupName?.toLowerCase().includes(s) || g.visitCode?.toLowerCase().includes(s) || g.purpose?.toLowerCase().includes(s);
    });

    const handleSave = async () => {
        try {
            const payload = {
                groupName: form.groupName,
                hostEmployeeId: form.hostEmployeeId,
                purpose: form.purpose,
                expectedDate: form.expectedDate,
                ...(form.expectedTime ? { expectedTime: form.expectedTime } : {}),
                plantId: form.plantId,
                ...(form.gateId ? { gateId: form.gateId } : {}),
                members: form.members.filter(m => m.visitorName.trim() && m.visitorMobile.trim()).map(m => ({
                    visitorName: m.visitorName.trim(),
                    visitorMobile: m.visitorMobile.trim(),
                    ...(m.visitorEmail?.trim() ? { visitorEmail: m.visitorEmail.trim() } : {}),
                    ...(m.visitorCompany?.trim() ? { visitorCompany: m.visitorCompany.trim() } : {}),
                })),
            };
            await createMutation.mutateAsync(payload);
            showSuccess("Group Visit Created", `${form.groupName} has been registered.`);
            setModalOpen(false);
            setForm({ ...EMPTY_FORM, members: [{ ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }] });
        } catch (err) { showApiError(err); }
    };

    const handleBatchCheckIn = async (id: string) => {
        try { setActionId(id); await batchCheckInMutation.mutateAsync({ id }); showSuccess("Batch Check-In", "All group visitors checked in."); } catch (err) { showApiError(err); } finally { setActionId(null); }
    };

    const handleBatchCheckOut = async (id: string) => {
        try { setActionId(id); await batchCheckOutMutation.mutateAsync({ id }); showSuccess("Batch Check-Out", "All group visitors checked out."); } catch (err) { showApiError(err); } finally { setActionId(null); }
    };

    const openEditGroup = (g: any) => {
        setEditId(g.id);
        setEditForm({
            groupName: g.groupName || "",
            purpose: g.purpose || "",
            expectedDate: g.expectedDate ? g.expectedDate.slice(0, 10) : "",
            expectedTime: g.expectedTime || "",
        });
        setEditModalOpen(true);
    };

    const handleEditSave = async () => {
        if (!editId) return;
        try {
            const payload: Record<string, string> = {};
            if (editForm.groupName) payload.groupName = editForm.groupName;
            if (editForm.purpose) payload.purpose = editForm.purpose;
            if (editForm.expectedDate) payload.expectedDate = editForm.expectedDate;
            if (editForm.expectedTime) payload.expectedTime = editForm.expectedTime;
            await updateGroupMutation.mutateAsync({ id: editId, data: payload });
            showSuccess("Group Updated", `${editForm.groupName} has been updated.`);
            setEditModalOpen(false);
            setEditId(null);
        } catch (err) { showApiError(err); }
    };

    const updateField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Group Visits</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage group visitor registrations and batch operations</p>
                </div>
                {canCreate && (
                    <button onClick={() => { setForm({ ...EMPTY_FORM, members: [{ ...EMPTY_MEMBER }, { ...EMPTY_MEMBER }] }); setModalOpen(true); }} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> New Group Visit
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load group visits.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={7} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Group</th>
                                    <th className="py-4 px-6 font-bold">Visit Code</th>
                                    <th className="py-4 px-6 font-bold">Purpose</th>
                                    <th className="py-4 px-6 font-bold text-center">Members</th>
                                    <th className="py-4 px-6 font-bold">Expected Date</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((g: any) => (
                                    <tr key={g.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center shrink-0"><Users className="w-4 h-4 text-accent-600" /></div>
                                                <span className="font-bold text-primary-950 dark:text-white">{g.groupName}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs font-mono">{g.visitCode || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{g.purpose || "---"}</td>
                                        <td className="py-4 px-6 text-center font-bold text-primary-950 dark:text-white">{g.totalMembers ?? g.members?.length ?? 0}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{g.expectedDate ? fmt.date(g.expectedDate) : "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", g.status === "IN_PROGRESS" ? "bg-warning-50 text-warning-700 border-warning-200" : g.status === "COMPLETED" ? "bg-success-50 text-success-700 border-success-200" : g.status === "CANCELLED" ? "bg-neutral-100 text-neutral-600 border-neutral-200" : "bg-info-50 text-info-700 border-info-200")}>{(g.status || "PLANNED").replace(/_/g, " ")}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                {g.status === "PLANNED" && canCreate && (
                                                    <>
                                                        <button onClick={() => openEditGroup(g)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100 transition-colors">
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                        <button onClick={() => handleBatchCheckIn(g.id)} disabled={actionId === g.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-success-50 text-success-700 border border-success-200 hover:bg-success-100 transition-colors disabled:opacity-50">
                                                            {actionId === g.id ? <Loader2 size={12} className="animate-spin" /> : <LogIn size={12} />} All In
                                                        </button>
                                                    </>
                                                )}
                                                {g.status === "IN_PROGRESS" && canCreate && (
                                                    <button onClick={() => handleBatchCheckOut(g.id)} disabled={actionId === g.id} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200 hover:bg-neutral-200 transition-colors disabled:opacity-50">
                                                        {actionId === g.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />} All Out
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No group visits" message="Register a group visit for delegations or tours." /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">New Group Visit</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4 overflow-y-auto max-h-[60vh]">
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Group Name *</label><input type="text" value={form.groupName} onChange={(e) => updateField("groupName", e.target.value)} placeholder="e.g. Client Delegation" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                                <div>
                                    <SearchableSelect
                                        label="Host Employee"
                                        value={form.hostEmployeeId}
                                        onChange={(v) => updateField("hostEmployeeId", v)}
                                        options={employees.map((e: any) => ({
                                            value: e.id,
                                            label: `${e.firstName} ${e.lastName}`,
                                            sublabel: e.designation?.name ?? e.department?.name ?? e.employeeCode ?? "",
                                        }))}
                                        placeholder="Search employee..."
                                    />
                                </div>
                            </div>
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purpose *</label><input type="text" value={form.purpose} onChange={(e) => updateField("purpose", e.target.value)} placeholder="Factory tour, audit, etc." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Date *</label><input type="date" value={form.expectedDate} onChange={(e) => updateField("expectedDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Time</label><input type="time" value={form.expectedTime} onChange={(e) => updateField("expectedTime", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <SearchableSelect
                                        label="Location (Plant)"
                                        value={form.plantId}
                                        onChange={(v) => { updateField("plantId", v); updateField("gateId", ""); }}
                                        options={locations.map((l: any) => ({
                                            value: l.id,
                                            label: l.name,
                                            sublabel: l.city ? `${l.city}, ${l.state ?? ""}` : undefined,
                                        }))}
                                        placeholder="Select location..."
                                        required
                                    />
                                </div>
                                <div>
                                    <SearchableSelect
                                        label="Gate"
                                        value={form.gateId}
                                        onChange={(v) => updateField("gateId", v)}
                                        options={filteredGates.map((g: any) => ({
                                            value: g.id,
                                            label: `${g.name} (${g.code})`,
                                        }))}
                                        placeholder="Select gate..."
                                    />
                                </div>
                            </div>
                            <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider">Members * (min 2)</label>
                                    <button type="button" onClick={() => setForm(p => ({ ...p, members: [...p.members, { ...EMPTY_MEMBER }] }))} className="text-xs font-bold text-primary-600 hover:text-primary-700">+ Add Member</button>
                                </div>
                                {form.members.map((m, i) => (
                                    <div key={i} className="grid grid-cols-4 gap-2 mb-2">
                                        <input type="text" value={m.visitorName} onChange={(e) => { const ms = [...form.members]; ms[i] = { ...ms[i], visitorName: e.target.value }; setForm(p => ({ ...p, members: ms })); }} placeholder="Name *" className="px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white placeholder:text-neutral-400" />
                                        <input type="text" value={m.visitorMobile} onChange={(e) => { const ms = [...form.members]; ms[i] = { ...ms[i], visitorMobile: e.target.value }; setForm(p => ({ ...p, members: ms })); }} placeholder="Mobile *" className="px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white placeholder:text-neutral-400" />
                                        <input type="email" value={m.visitorEmail} onChange={(e) => { const ms = [...form.members]; ms[i] = { ...ms[i], visitorEmail: e.target.value }; setForm(p => ({ ...p, members: ms })); }} placeholder="Email" className="px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white placeholder:text-neutral-400" />
                                        <div className="flex gap-1">
                                            <input type="text" value={m.visitorCompany} onChange={(e) => { const ms = [...form.members]; ms[i] = { ...ms[i], visitorCompany: e.target.value }; setForm(p => ({ ...p, members: ms })); }} placeholder="Company" className="flex-1 px-2.5 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs dark:text-white placeholder:text-neutral-400" />
                                            {form.members.length > 2 && <button type="button" onClick={() => setForm(p => ({ ...p, members: p.members.filter((_, j) => j !== i) }))} className="px-1.5 text-danger-500 hover:text-danger-700 text-xs font-bold"><X size={14} /></button>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={createMutation.isPending || !form.groupName} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {createMutation.isPending ? "Creating..." : "Create Group"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Group Visit Modal */}
            {editModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Edit Group Visit</h2>
                            <button onClick={() => setEditModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Group Name *</label>
                                <input type="text" value={editForm.groupName} onChange={(e) => setEditForm((p) => ({ ...p, groupName: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Purpose</label>
                                <input type="text" value={editForm.purpose} onChange={(e) => setEditForm((p) => ({ ...p, purpose: e.target.value }))} placeholder="Factory tour, audit, etc." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Date</label>
                                    <input type="date" value={editForm.expectedDate} onChange={(e) => setEditForm((p) => ({ ...p, expectedDate: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Expected Time</label>
                                    <input type="time" value={editForm.expectedTime} onChange={(e) => setEditForm((p) => ({ ...p, expectedTime: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setEditModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleEditSave} disabled={updateGroupMutation.isPending || !editForm.groupName} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {updateGroupMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                                {updateGroupMutation.isPending ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
