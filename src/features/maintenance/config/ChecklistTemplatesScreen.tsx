import { useState } from "react";
import {
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    CheckCircle2,
    XCircle,
    ClipboardCheck,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCanPerform } from "@/hooks/useCanPerform";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";
import { useChecklistTemplates, useChecklistTemplate } from "@/features/maintenance/api/use-maintenance-queries";
import {
    useCreateChecklistTemplate,
    useUpdateChecklistTemplate,
    useDeleteChecklistTemplate,
} from "@/features/maintenance/api/use-maintenance-mutations";
import { maintenanceApi } from "@/features/maintenance/api/maintenance-api";

/* ── Constants ── */

const FIELD_TYPES = [
    { value: "YES_NO", label: "Yes / No" },
    { value: "PASS_FAIL", label: "Pass / Fail" },
    { value: "NUMERIC", label: "Numeric" },
    { value: "TEXT", label: "Text" },
    { value: "PHOTO", label: "Photo" },
    { value: "SIGNATURE", label: "Signature" },
    { value: "DROPDOWN", label: "Dropdown" },
    { value: "DATE_TIME", label: "Date & Time" },
    { value: "BARCODE_SCAN", label: "Barcode Scan" },
    { value: "RISK_RATING", label: "Risk Rating" },
];

/* ── Types ── */

interface FieldForm {
    label: string;
    fieldType: string;
    isMandatory: boolean;
    config: string;
}

interface SectionForm {
    name: string;
    isMandatory: boolean;
    passThreshold: string;
    description: string;
    fields: FieldForm[];
    collapsed: boolean;
}

function StatusBadge({ active }: { active: boolean }) {
    return active ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-success-50 text-success-700 border-success-100 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50">
            <CheckCircle2 size={10} /> Active
        </span>
    ) : (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded border bg-neutral-100 text-neutral-500 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">
            <XCircle size={10} /> Inactive
        </span>
    );
}

function newField(): FieldForm {
    return { label: "", fieldType: "YES_NO", isMandatory: false, config: "" };
}

function newSection(): SectionForm {
    return { name: "", isMandatory: false, passThreshold: "", description: "", fields: [newField()], collapsed: false };
}

/* ── Preview Modal ── */

function PreviewModal({ templateId, onClose }: { templateId: string; onClose: () => void }) {
    const { data, isLoading } = useChecklistTemplate(templateId);
    const template = data?.data;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Preview: {template?.name ?? "..."}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-500" /></div>
                    ) : template ? (
                        <>
                            {template.description && <p className="text-sm text-neutral-500 dark:text-neutral-400">{template.description}</p>}
                            {(template.sections ?? []).map((sec: any, si: number) => (
                                <div key={si} className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                    <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 flex items-center justify-between">
                                        <div>
                                            <span className="text-sm font-bold text-primary-950 dark:text-white">{sec.name}</span>
                                            {sec.isMandatory && <span className="ml-2 text-[10px] font-bold text-danger-500">Required</span>}
                                            {sec.passThreshold != null && <span className="ml-2 text-[10px] text-neutral-400">Pass: {sec.passThreshold}%</span>}
                                        </div>
                                        <span className="text-xs text-neutral-400">{sec.fields?.length ?? 0} fields</span>
                                    </div>
                                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                                        {(sec.fields ?? []).map((f: any, fi: number) => (
                                            <div key={fi} className="px-4 py-2.5 flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-700 dark:text-neutral-300">{f.label}</span>
                                                    {f.isMandatory && <span className="text-[10px] font-bold text-danger-500">*</span>}
                                                </div>
                                                <span className="text-xs text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded">{f.fieldType.replace(/_/g, " ")}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    ) : <p className="text-sm text-neutral-500">Template not found.</p>}
                </div>
                <div className="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
}

/* ── Builder Modal ── */

function BuilderModal({
    editingId,
    initialName,
    initialDescription,
    initialSections,
    initialIsActive,
    onClose,
    onSave,
    saving,
}: {
    editingId: string | null;
    initialName: string;
    initialDescription: string;
    initialSections: SectionForm[];
    initialIsActive: boolean;
    onClose: () => void;
    onSave: (name: string, description: string, sections: SectionForm[], isActive: boolean) => void;
    saving: boolean;
}) {
    const [name, setName] = useState(initialName);
    const [description, setDescription] = useState(initialDescription);
    const [sections, setSections] = useState<SectionForm[]>(initialSections.length > 0 ? initialSections : [newSection()]);
    const [isActive, setIsActive] = useState(initialIsActive);

    const addSection = () => setSections((s) => [...s, newSection()]);

    const updateSection = (idx: number, updates: Partial<SectionForm>) => {
        setSections((s) => s.map((sec, i) => i === idx ? { ...sec, ...updates } : sec));
    };

    const removeSection = (idx: number) => {
        if (sections.length <= 1) { showApiError({ message: "At least one section is required" }); return; }
        setSections((s) => s.filter((_, i) => i !== idx));
    };

    const addField = (sIdx: number) => {
        setSections((s) => s.map((sec, i) => i === sIdx ? { ...sec, fields: [...sec.fields, newField()] } : sec));
    };

    const updateField = (sIdx: number, fIdx: number, updates: Partial<FieldForm>) => {
        setSections((s) => s.map((sec, i) => i === sIdx ? { ...sec, fields: sec.fields.map((f, j) => j === fIdx ? { ...f, ...updates } : f) } : sec));
    };

    const removeField = (sIdx: number, fIdx: number) => {
        setSections((s) => s.map((sec, i) => {
            if (i !== sIdx) return sec;
            if (sec.fields.length <= 1) { showApiError({ message: "At least one field per section" }); return sec; }
            return { ...sec, fields: sec.fields.filter((_, j) => j !== fIdx) };
        }));
    };

    const moveSectionUp = (idx: number) => {
        if (idx === 0) return;
        setSections((s) => { const n = [...s]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
    };

    const moveSectionDown = (idx: number) => {
        if (idx >= sections.length - 1) return;
        setSections((s) => { const n = [...s]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n; });
    };

    const handleSubmit = () => {
        if (!name.trim()) { showApiError({ message: "Template name is required" }); return; }
        for (const sec of sections) {
            if (!sec.name.trim()) { showApiError({ message: "All sections must have a name" }); return; }
            for (const f of sec.fields) {
                if (!f.label.trim()) { showApiError({ message: "All fields must have a label" }); return; }
            }
        }
        onSave(name, description, sections, isActive);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-3xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Checklist Template" : "Create Checklist Template"}</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Template info */}
                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Template Name<span className="text-danger-500 ml-0.5">*</span></label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Monthly Pump Inspection"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description"
                                className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                        </div>
                    </div>

                    {/* Sections */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Sections</p>
                            <button onClick={addSection} className="text-xs font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400">+ Add Section</button>
                        </div>

                        {sections.map((sec, si) => (
                            <div key={si} className="border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                                {/* Section header */}
                                <div className="bg-neutral-50 dark:bg-neutral-800 px-4 py-3 flex items-center gap-2">
                                    <GripVertical size={14} className="text-neutral-400 flex-shrink-0" />
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => moveSectionUp(si)} disabled={si === 0} className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronUp size={14} /></button>
                                        <button onClick={() => moveSectionDown(si)} disabled={si >= sections.length - 1} className="p-0.5 text-neutral-400 hover:text-neutral-600 disabled:opacity-30"><ChevronDown size={14} /></button>
                                    </div>
                                    <input type="text" value={sec.name} onChange={(e) => updateSection(si, { name: e.target.value })} placeholder="Section name"
                                        className="flex-1 px-2 py-1 bg-transparent border-none text-sm font-bold text-primary-950 dark:text-white focus:outline-none placeholder:text-neutral-400" />
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <label className="flex items-center gap-1 text-[10px] text-neutral-500">
                                            <input type="checkbox" checked={sec.isMandatory} onChange={(e) => updateSection(si, { isMandatory: e.target.checked })} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                            Required
                                        </label>
                                        <input type="number" value={sec.passThreshold} onChange={(e) => updateSection(si, { passThreshold: e.target.value })} placeholder="Pass %" min={0} max={100}
                                            className="w-16 px-1.5 py-0.5 text-[10px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-center focus:outline-none dark:text-white" />
                                        <button onClick={() => updateSection(si, { collapsed: !sec.collapsed })} className="p-1 text-neutral-400 hover:text-neutral-600">
                                            {sec.collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        </button>
                                        <button onClick={() => removeSection(si)} className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded"><Trash2 size={12} /></button>
                                    </div>
                                </div>

                                {/* Fields */}
                                {!sec.collapsed && (
                                    <div className="p-4 space-y-2">
                                        {sec.fields.map((f, fi) => (
                                            <div key={fi} className="bg-neutral-50/50 dark:bg-neutral-800/50 rounded-lg px-3 py-2 space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <GripVertical size={12} className="text-neutral-300 flex-shrink-0" />
                                                    <input type="text" value={f.label} onChange={(e) => updateField(si, fi, { label: e.target.value })} placeholder="Field label"
                                                        className="flex-1 px-2 py-1 bg-transparent border-none text-sm text-primary-950 dark:text-white focus:outline-none placeholder:text-neutral-400" />
                                                    <select value={f.fieldType} onChange={(e) => updateField(si, fi, { fieldType: e.target.value })}
                                                        className="px-2 py-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs focus:outline-none dark:text-white">
                                                        {FIELD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                                                    </select>
                                                    <label className="flex items-center gap-1 text-[10px] text-neutral-500 flex-shrink-0">
                                                        <input type="checkbox" checked={f.isMandatory} onChange={(e) => updateField(si, fi, { isMandatory: e.target.checked })} className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500" />
                                                        Req
                                                    </label>
                                                    <button onClick={() => removeField(si, fi)} className="p-1 text-danger-400 hover:text-danger-600"><X size={12} /></button>
                                                </div>
                                                {f.fieldType === "DROPDOWN" ? (
                                                    <input
                                                        type="text"
                                                        value={f.config}
                                                        onChange={(e) => updateField(si, fi, { config: e.target.value })}
                                                        placeholder="Options (comma separated)"
                                                        className="w-full px-2 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded text-xs focus:outline-none dark:text-white placeholder:text-neutral-400"
                                                    />
                                                ) : null}
                                            </div>
                                        ))}
                                        <button onClick={() => addField(si)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline pl-6">+ Add Field</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4">
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setIsActive(!isActive)}
                                className={cn("w-10 h-6 rounded-full transition-colors relative flex-shrink-0", isActive ? "bg-primary-600" : "bg-neutral-300 dark:bg-neutral-700")}>
                                <div className={cn("w-4 h-4 rounded-full bg-white absolute top-1 transition-all", isActive ? "left-5" : "left-1")} />
                            </button>
                            <span className="text-sm font-medium text-primary-950 dark:text-white">Active</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                    <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                    <button onClick={handleSubmit} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Saving..." : editingId ? "Update" : "Create"}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Main Screen ── */

export function ChecklistTemplatesScreen() {
    const canConfigure = useCanPerform("maintenance:configure");
    const [search, setSearch] = useState("");
    const { data, isLoading } = useChecklistTemplates({ search: search || undefined });
    const createMut = useCreateChecklistTemplate();
    const updateMut = useUpdateChecklistTemplate();
    const deleteMut = useDeleteChecklistTemplate();

    const [builderOpen, setBuilderOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editSections, setEditSections] = useState<SectionForm[]>([]);
    const [editIsActive, setEditIsActive] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [previewId, setPreviewId] = useState<string | null>(null);

    const templates: any[] = data?.data ?? [];

    const openCreate = () => {
        setEditingId(null);
        setEditName("");
        setEditDesc("");
        setEditSections([newSection()]);
        setEditIsActive(true);
        setBuilderOpen(true);
    };

    const openEdit = async (t: any) => {
        let source = t;
        try {
            const full = await maintenanceApi.getChecklistTemplate(t.id);
            source = full?.data ?? t;
        } catch {
            // Fallback to list data if detail fetch fails.
        }

        setEditingId(source.id);
        setEditName(source.name ?? "");
        setEditDesc(source.description ?? "");
        setEditIsActive(source.isActive ?? true);
        const sections: SectionForm[] = (source.sections ?? []).map((sec: any) => ({
            name: sec.name ?? "",
            isMandatory: sec.isMandatory ?? false,
            passThreshold: sec.passThreshold != null ? String(sec.passThreshold) : "",
            description: sec.description ?? "",
            collapsed: false,
            fields: (sec.fields ?? []).map((f: any) => {
                const dropdownOptions = Array.isArray(f?.config?.options)
                    ? f.config.options.join(", ")
                    : "";
                return {
                    label: f.label ?? "",
                    fieldType: f.fieldType ?? "YES_NO",
                    isMandatory: f.isMandatory ?? false,
                    config: f.fieldType === "DROPDOWN"
                        ? dropdownOptions
                        : (f.config ? JSON.stringify(f.config) : ""),
                };
            }),
        }));
        setEditSections(sections.length > 0 ? sections : [newSection()]);
        setBuilderOpen(true);
    };

    const parseFieldConfig = (field: FieldForm) => {
        const raw = field.config.trim();
        if (!raw) return undefined;
        if (field.fieldType === "DROPDOWN") {
            if (raw.startsWith("{") || raw.startsWith("[")) {
                try { return JSON.parse(raw); } catch { /* ignore parse */ }
            }
            const options = raw.split(",").map((v) => v.trim()).filter(Boolean);
            return options.length > 0 ? { options } : undefined;
        }
        try { return JSON.parse(raw); } catch { return undefined; }
    };

    const handleSave = async (name: string, description: string, sections: SectionForm[], isActive: boolean) => {
        const payload: any = {
            name: name.trim(),
            description: description || undefined,
            isActive,
            sections: sections.map((sec, si) => ({
                name: sec.name.trim(),
                sortOrder: si,
                isMandatory: sec.isMandatory,
                passThreshold: sec.passThreshold ? Number(sec.passThreshold) : undefined,
                description: sec.description || undefined,
                fields: sec.fields.map((f, fi) => ({
                    label: f.label.trim(),
                    fieldType: f.fieldType,
                    sortOrder: fi,
                    isMandatory: f.isMandatory,
                    config: parseFieldConfig(f),
                })),
            })),
        };
        try {
            if (editingId) {
                await updateMut.mutateAsync({ id: editingId, data: payload });
                showSuccess("Updated", `${name} updated.`);
            } else {
                await createMut.mutateAsync(payload);
                showSuccess("Created", `${name} created.`);
            }
            setBuilderOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMut.mutateAsync(deleteTarget.id); showSuccess("Deleted", `${deleteTarget.name} deleted.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const saving = createMut.isPending || updateMut.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Checklist Templates</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Build inspection checklists for maintenance tasks</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all">
                        <Plus className="w-5 h-5" /> Create Template
                    </button>
                )}
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={5} cols={5} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[700px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold text-center">Sections</th>
                                    <th className="py-4 px-6 font-bold">Status</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {templates.map((t: any) => (
                                    <tr key={t.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center shrink-0">
                                                    <ClipboardCheck className="w-4 h-4 text-success-600 dark:text-success-400" />
                                                </div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white">{t.name}</span>
                                                    {t.description && <p className="text-xs text-neutral-400 mt-0.5 line-clamp-1">{t.description}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center font-semibold text-primary-950 dark:text-white">{t.sections?.length ?? t._count?.sections ?? 0}</td>
                                        <td className="py-4 px-6"><StatusBadge active={t.isActive ?? true} /></td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => setPreviewId(t.id)} className="p-2 text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800 rounded-lg transition-colors" title="Preview"><Eye size={15} /></button>
                                                {canConfigure && (
                                                    <>
                                                        <button onClick={() => openEdit(t)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => setDeleteTarget(t)} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {templates.length === 0 && !isLoading && (
                                    <tr><td colSpan={4}><EmptyState icon="list" title="No checklist templates" message="Build your first checklist template." action={canConfigure ? { label: "Create Template", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Builder Modal */}
            {builderOpen && (
                <BuilderModal
                    editingId={editingId}
                    initialName={editName}
                    initialDescription={editDesc}
                    initialSections={editSections}
                    initialIsActive={editIsActive}
                    onClose={() => setBuilderOpen(false)}
                    onSave={handleSave}
                    saving={saving}
                />
            )}

            {/* Preview Modal */}
            {previewId && <PreviewModal templateId={previewId} onClose={() => setPreviewId(null)} />}

            {/* Delete Confirm */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete Template?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            This will permanently delete <strong>{deleteTarget.name}</strong>. This action cannot be undone.
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMut.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {deleteMut.isPending ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
