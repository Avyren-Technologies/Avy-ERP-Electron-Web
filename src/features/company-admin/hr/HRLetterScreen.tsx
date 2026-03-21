import { useState } from "react";
import {
    FileSignature,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    FileText,
    Mail,
    Eye,
    Download,
    Copy,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    useLetterTemplates,
    useLetters,
} from "@/features/company-admin/api/use-recruitment-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateLetterTemplate,
    useUpdateLetterTemplate,
    useDeleteLetterTemplate,
    useCreateLetter,
    useGenerateLetterPdf,
} from "@/features/company-admin/api/use-recruitment-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const TEMPLATE_TYPES = [
    "Offer Letter", "Appointment Letter", "Confirmation Letter", "Promotion Letter",
    "Transfer Letter", "Warning Letter", "Increment Letter", "Experience Letter",
    "Relieving Letter", "Termination Letter", "Bonafide Certificate", "Custom",
];

const AVAILABLE_TOKENS = [
    { token: "{{employee_name}}", desc: "Full name" },
    { token: "{{employee_id}}", desc: "Employee ID" },
    { token: "{{designation}}", desc: "Designation" },
    { token: "{{department}}", desc: "Department" },
    { token: "{{joining_date}}", desc: "Date of joining" },
    { token: "{{salary}}", desc: "Current salary" },
    { token: "{{company_name}}", desc: "Company name" },
    { token: "{{today_date}}", desc: "Current date" },
    { token: "{{effective_date}}", desc: "Effective date" },
    { token: "{{manager_name}}", desc: "Reporting manager" },
];

const EMPTY_TEMPLATE = { name: "", type: "Offer Letter", subject: "", bodyTemplate: "", isActive: true };
const EMPTY_LETTER = { templateId: "", employeeId: "", effectiveDate: "", customFields: "{}" };

const formatDate = (d: string | null | undefined) => {
    if (!d) return "\u2014";
    return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/* ── Screen ── */

export function HRLetterScreen() {
    const [activeTab, setActiveTab] = useState<"templates" | "letters">("templates");
    const [search, setSearch] = useState("");
    const [showTokenRef, setShowTokenRef] = useState(false);

    const [tplModalOpen, setTplModalOpen] = useState(false);
    const [tplEditingId, setTplEditingId] = useState<string | null>(null);
    const [tplForm, setTplForm] = useState({ ...EMPTY_TEMPLATE });
    const [tplDeleteTarget, setTplDeleteTarget] = useState<any>(null);

    const [letterModalOpen, setLetterModalOpen] = useState(false);
    const [letterForm, setLetterForm] = useState({ ...EMPTY_LETTER });
    const [letterDetailTarget, setLetterDetailTarget] = useState<any>(null);

    const tplQuery = useLetterTemplates();
    const letterQuery = useLetters();
    const employeesQuery = useEmployees();

    const createTpl = useCreateLetterTemplate();
    const updateTpl = useUpdateLetterTemplate();
    const deleteTpl = useDeleteLetterTemplate();
    const createLetter = useCreateLetter();
    const generatePdf = useGenerateLetterPdf();

    const templates: any[] = tplQuery.data?.data ?? [];
    const letters: any[] = letterQuery.data?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];

    const templateName = (id: string) => templates.find((t: any) => t.id === id)?.name ?? id;
    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id;
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const filteredTpls = templates.filter((t: any) => !search || t.name?.toLowerCase().includes(search.toLowerCase()) || t.type?.toLowerCase().includes(search.toLowerCase()));
    const filteredLetters = letters.filter((l: any) => !search || templateName(l.templateId)?.toLowerCase().includes(search.toLowerCase()) || employeeName(l.employeeId)?.toLowerCase().includes(search.toLowerCase()));

    /* Template handlers */
    const openCreateTpl = () => { setTplEditingId(null); setTplForm({ ...EMPTY_TEMPLATE }); setTplModalOpen(true); };
    const openEditTpl = (t: any) => {
        setTplEditingId(t.id);
        setTplForm({ name: t.name ?? "", type: t.type ?? "Offer Letter", subject: t.subject ?? "", bodyTemplate: t.bodyTemplate ?? t.body ?? "", isActive: t.isActive ?? true });
        setTplModalOpen(true);
    };
    const handleSaveTpl = async () => {
        try {
            const payload: any = {
                type: tplForm.type,
                name: tplForm.name,
                bodyTemplate: tplForm.bodyTemplate,
                isActive: tplForm.isActive,
            };
            if (tplEditingId) { await updateTpl.mutateAsync({ id: tplEditingId, data: payload }); showSuccess("Template Updated", `${tplForm.name} updated.`); }
            else { await createTpl.mutateAsync(payload); showSuccess("Template Created", `${tplForm.name} created.`); }
            setTplModalOpen(false);
        } catch (err) { showApiError(err); }
    };
    const handleDeleteTpl = async () => {
        if (!tplDeleteTarget) return;
        try { await deleteTpl.mutateAsync(tplDeleteTarget.id); showSuccess("Template Deleted", `${tplDeleteTarget.name} removed.`); setTplDeleteTarget(null); }
        catch (err) { showApiError(err); }
    };

    /* Letter handlers */
    const openCreateLetter = () => { setLetterForm({ ...EMPTY_LETTER }); setLetterModalOpen(true); };
    const handleCreateLetter = async () => {
        try { await createLetter.mutateAsync(letterForm); showSuccess("Letter Generated", "HR letter has been generated."); setLetterModalOpen(false); }
        catch (err) { showApiError(err); }
    };
    const handleGeneratePdf = async (l: any) => {
        try { await generatePdf.mutateAsync(l.id); showSuccess("PDF Generated", "Letter PDF has been generated."); }
        catch (err) { showApiError(err); }
    };

    const savingTpl = createTpl.isPending || updateTpl.isPending;
    const savingLetter = createLetter.isPending;
    const updateTplField = (k: string, v: any) => setTplForm((p) => ({ ...p, [k]: v }));
    const updateLetterField = (k: string, v: any) => setLetterForm((p) => ({ ...p, [k]: v }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">HR Letters</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage letter templates and generate employee letters</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setShowTokenRef(!showTokenRef)} className="inline-flex items-center gap-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <Info className="w-4 h-4" /> Tokens
                    </button>
                    <button
                        onClick={() => activeTab === "templates" ? openCreateTpl() : openCreateLetter()}
                        className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"
                    >
                        <Plus className="w-5 h-5" />{activeTab === "templates" ? "New Template" : "Generate Letter"}
                    </button>
                </div>
            </div>

            {/* Token Reference */}
            {showTokenRef && (
                <div className="bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-800/50 p-5">
                    <h3 className="text-sm font-bold text-primary-700 dark:text-primary-400 mb-3">Available Template Tokens</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        {AVAILABLE_TOKENS.map((t) => (
                            <div key={t.token} className="bg-white dark:bg-neutral-900 rounded-lg p-2 border border-primary-100 dark:border-primary-800/30">
                                <code className="text-[10px] font-mono text-primary-600 dark:text-primary-400 block">{t.token}</code>
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{t.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl w-fit">
                <button onClick={() => { setActiveTab("templates"); setSearch(""); }} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "templates" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><FileText size={14} />Templates</span>
                </button>
                <button onClick={() => { setActiveTab("letters"); setSearch(""); }} className={cn("px-5 py-2 rounded-lg text-sm font-bold transition-all", activeTab === "letters" ? "bg-white dark:bg-neutral-700 text-primary-700 dark:text-primary-400 shadow-sm" : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300")}>
                    <span className="flex items-center gap-2"><Mail size={14} />Generated Letters</span>
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder={activeTab === "templates" ? "Search templates..." : "Search letters..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {/* ── Templates Tab ── */}
            {activeTab === "templates" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {tplQuery.isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Template</th>
                                        <th className="py-4 px-6 font-bold">Type</th>
                                        <th className="py-4 px-6 font-bold">Subject</th>
                                        <th className="py-4 px-6 font-bold text-center">Active</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredTpls.map((t: any) => (
                                        <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0"><FileSignature className="w-4 h-4 text-primary-600 dark:text-primary-400" /></div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6"><span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50">{t.type}</span></td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs truncate max-w-[200px]">{t.subject || "\u2014"}</td>
                                            <td className="py-4 px-6 text-center">
                                                {t.isActive !== false ? (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success-50 text-success-700 border border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">Active</span>
                                                ) : (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500">Inactive</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEditTpl(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                    <button onClick={() => setTplDeleteTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredTpls.length === 0 && !tplQuery.isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No templates found" message="Create letter templates to generate HR letters." action={{ label: "New Template", onClick: openCreateTpl }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Letters Tab ── */}
            {activeTab === "letters" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {letterQuery.isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Template</th>
                                        <th className="py-4 px-6 font-bold">Effective Date</th>
                                        <th className="py-4 px-6 font-bold">Generated</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredLetters.map((l: any) => (
                                        <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-accent-100 dark:bg-accent-900/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-700 dark:text-accent-400">{employeeName(l.employeeId).charAt(0)}</div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{employeeName(l.employeeId)}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400">{templateName(l.templateId)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(l.effectiveDate)}</td>
                                            <td className="py-4 px-6 text-xs text-neutral-600 dark:text-neutral-400">{formatDate(l.createdAt)}</td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => setLetterDetailTarget(l)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
                                                    <button onClick={() => handleGeneratePdf(l)} disabled={generatePdf.isPending} className="p-2 text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-900/30 rounded-lg transition-colors" title="Download PDF"><Download size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredLetters.length === 0 && !letterQuery.isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No letters generated" message="Generate an HR letter from a template." action={{ label: "Generate Letter", onClick: openCreateLetter }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Template Modal ── */}
            {tplModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{tplEditingId ? "Edit Template" : "New Template"}</h2>
                            <button onClick={() => setTplModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Name</label>
                                    <input type="text" value={tplForm.name} onChange={(e) => updateTplField("name", e.target.value)} placeholder="e.g., Standard Offer Letter" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Type</label>
                                    <select value={tplForm.type} onChange={(e) => updateTplField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {TEMPLATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Subject</label>
                                <input type="text" value={tplForm.subject} onChange={(e) => updateTplField("subject", e.target.value)} placeholder="Letter of Offer - {{employee_name}}" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Body (use tokens like {"{{employee_name}}"})</label>
                                <textarea value={tplForm.bodyTemplate} onChange={(e) => updateTplField("bodyTemplate", e.target.value)} rows={10} placeholder="Dear {{employee_name}},&#10;&#10;We are pleased to offer you the position of {{designation}} in the {{department}} department..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none font-mono text-xs leading-relaxed" />
                            </div>
                            <div className="flex items-center justify-between py-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl px-4 border border-neutral-200 dark:border-neutral-700">
                                <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                                <button type="button" onClick={() => updateTplField("isActive", !tplForm.isActive)} className={cn("w-10 h-6 rounded-full transition-colors relative", tplForm.isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                    <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", tplForm.isActive ? "left-5" : "left-1")} />
                                </button>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setTplModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveTpl} disabled={savingTpl} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingTpl && <Loader2 size={14} className="animate-spin" />}{savingTpl ? "Saving..." : tplEditingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Generate Letter Modal ── */}
            {letterModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Generate Letter</h2>
                            <button onClick={() => setLetterModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Template</label>
                                <select value={letterForm.templateId} onChange={(e) => updateLetterField("templateId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select template...</option>
                                    {templates.filter((t: any) => t.isActive !== false).map((t: any) => <option key={t.id} value={t.id}>{t.name} ({t.type})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={letterForm.employeeId} onChange={(e) => updateLetterField("employeeId", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.email}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Effective Date</label>
                                <input type="date" value={letterForm.effectiveDate} onChange={(e) => updateLetterField("effectiveDate", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setLetterModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleCreateLetter} disabled={savingLetter} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingLetter && <Loader2 size={14} className="animate-spin" />}{savingLetter ? "Generating..." : "Generate"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Letter Detail ── */}
            {letterDetailTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Letter Details</h2>
                            <button onClick={() => setLetterDetailTarget(null)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Employee</span><p className="font-bold text-primary-950 dark:text-white">{employeeName(letterDetailTarget.employeeId)}</p></div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Template</span><p className="font-bold text-primary-950 dark:text-white">{templateName(letterDetailTarget.templateId)}</p></div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Effective Date</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(letterDetailTarget.effectiveDate)}</p></div>
                            <div><span className="text-xs text-neutral-400 block mb-0.5">Generated On</span><p className="font-semibold text-primary-950 dark:text-white">{formatDate(letterDetailTarget.createdAt)}</p></div>
                            {letterDetailTarget.content && (
                                <div className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                    <span className="text-xs text-neutral-400 block mb-1">Content Preview</span>
                                    <pre className="text-xs font-mono text-neutral-600 dark:text-neutral-400 whitespace-pre-wrap">{letterDetailTarget.content}</pre>
                                </div>
                            )}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setLetterDetailTarget(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Template ── */}
            {tplDeleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Template?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">This will permanently delete <strong>{tplDeleteTarget.name}</strong>.</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setTplDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDeleteTpl} disabled={deleteTpl.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteTpl.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
