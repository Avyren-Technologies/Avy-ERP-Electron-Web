import { useState } from "react";
import {
    Brain,
    Plus,
    Edit3,
    Trash2,
    Loader2,
    X,
    Search,
    BookOpen,
    Link2,
    BarChart3,
    User,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkills, useSkillMappings, useSkillGapAnalysis } from "@/features/company-admin/api/use-performance-queries";
import { useEmployees } from "@/features/company-admin/api/use-hr-queries";
import {
    useCreateSkill,
    useUpdateSkill,
    useDeleteSkill,
    useCreateSkillMapping,
    useUpdateSkillMapping,
    useDeleteSkillMapping,
} from "@/features/company-admin/api/use-performance-mutations";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

/* ── Constants ── */

const SKILL_CATEGORIES = [
    { value: "TECHNICAL", label: "Technical" },
    { value: "SOFT_SKILL", label: "Soft Skill" },
    { value: "LEADERSHIP", label: "Leadership" },
    { value: "DOMAIN", label: "Domain" },
    { value: "TOOL", label: "Tool / Software" },
    { value: "LANGUAGE", label: "Language" },
    { value: "OTHER", label: "Other" },
];

const PROFICIENCY_LEVELS = [
    { value: 1, label: "Beginner", color: "bg-neutral-400" },
    { value: 2, label: "Elementary", color: "bg-info-400" },
    { value: 3, label: "Intermediate", color: "bg-primary-400" },
    { value: 4, label: "Advanced", color: "bg-accent-400" },
    { value: 5, label: "Expert", color: "bg-success-400" },
];

const EMPTY_SKILL_FORM = {
    name: "",
    category: "TECHNICAL",
    description: "",
};

const EMPTY_MAPPING_FORM = {
    employeeId: "",
    skillId: "",
    proficiencyLevel: 3,
    requiredLevel: 3,
    notes: "",
};

/* ── Helpers ── */

function CategoryBadge({ category }: { category: string }) {
    const map: Record<string, string> = {
        technical: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-800/50",
        soft_skill: "bg-accent-50 text-accent-700 border-accent-200 dark:bg-accent-900/20 dark:text-accent-400 dark:border-accent-800/50",
        leadership: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/20 dark:text-warning-400 dark:border-warning-800/50",
        domain: "bg-info-50 text-info-700 border-info-200 dark:bg-info-900/20 dark:text-info-400 dark:border-info-800/50",
        tool: "bg-success-50 text-success-700 border-success-200 dark:bg-success-900/20 dark:text-success-400 dark:border-success-800/50",
        language: "bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700",
    };
    return <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize", map[category?.toLowerCase()] ?? map.technical)}>{category?.replace("_", " ")}</span>;
}

function ProficiencyBar({ level, required, compact = false }: { level: number; required?: number; compact?: boolean }) {
    const config = PROFICIENCY_LEVELS.find((p) => p.value === level) ?? PROFICIENCY_LEVELS[2];
    return (
        <div className={cn("flex items-center gap-2", compact ? "" : "min-w-[120px]")}>
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div
                        key={i}
                        className={cn(
                            "rounded-sm transition-colors",
                            compact ? "w-3 h-3" : "w-4 h-4",
                            i <= level ? config.color : "bg-neutral-200 dark:bg-neutral-700",
                            required && i <= required && i > level ? "bg-danger-300 dark:bg-danger-600" : ""
                        )}
                    />
                ))}
            </div>
            <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{config.label}</span>
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

/* ── Screen ── */

export function SkillScreen() {
    const [activeTab, setActiveTab] = useState<"library" | "mappings">("library");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [skillModalOpen, setSkillModalOpen] = useState(false);
    const [mappingModalOpen, setMappingModalOpen] = useState(false);
    const [gapModalOpen, setGapModalOpen] = useState(false);
    const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
    const [editingMappingId, setEditingMappingId] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [deleteType, setDeleteType] = useState<"skill" | "mapping">("skill");
    const [gapEmployeeId, setGapEmployeeId] = useState("");
    const [skillForm, setSkillForm] = useState({ ...EMPTY_SKILL_FORM });
    const [mappingForm, setMappingForm] = useState({ ...EMPTY_MAPPING_FORM });

    const skillParams: Record<string, unknown> = {};
    if (categoryFilter) skillParams.category = categoryFilter;

    const { data: skillsData, isLoading: skillsLoading, isError: skillsError } = useSkills(Object.keys(skillParams).length ? skillParams : undefined);
    const { data: mappingsData, isLoading: mappingsLoading, isError: mappingsError } = useSkillMappings();
    const employeesQuery = useEmployees();
    const gapQuery = useSkillGapAnalysis(gapEmployeeId);

    const createSkillMutation = useCreateSkill();
    const updateSkillMutation = useUpdateSkill();
    const deleteSkillMutation = useDeleteSkill();
    const createMappingMutation = useCreateSkillMapping();
    const updateMappingMutation = useUpdateSkillMapping();
    const deleteMappingMutation = useDeleteSkillMapping();

    const skills: any[] = skillsData?.data ?? [];
    const mappings: any[] = mappingsData?.data ?? [];
    const employees: any[] = employeesQuery.data?.data ?? [];
    const gapData: any[] = gapQuery.data?.data ?? [];

    const employeeName = (id: string) => {
        const emp = employees.find((e: any) => e.id === id);
        if (!emp) return id || "\u2014";
        return [emp.firstName, emp.lastName].filter(Boolean).join(" ") || emp.fullName || emp.email || id;
    };

    const skillName = (id: string) => skills.find((s: any) => s.id === id)?.name ?? id;

    const filteredSkills = skills.filter((s: any) => {
        if (!search) return true;
        return s.name?.toLowerCase().includes(search.toLowerCase()) || s.category?.toLowerCase().includes(search.toLowerCase());
    });

    const filteredMappings = mappings.filter((m: any) => {
        if (!search) return true;
        const s = search.toLowerCase();
        return employeeName(m.employeeId)?.toLowerCase().includes(s) || skillName(m.skillId)?.toLowerCase().includes(s);
    });

    // -- Skill CRUD --
    const openCreateSkill = () => { setEditingSkillId(null); setSkillForm({ ...EMPTY_SKILL_FORM }); setSkillModalOpen(true); };
    const openEditSkill = (s: any) => { setEditingSkillId(s.id); setSkillForm({ name: s.name ?? "", category: s.category ?? "TECHNICAL", description: s.description ?? "" }); setSkillModalOpen(true); };
    const handleSaveSkill = async () => {
        try {
            if (editingSkillId) {
                await updateSkillMutation.mutateAsync({ id: editingSkillId, data: skillForm });
                showSuccess("Skill Updated", `"${skillForm.name}" has been updated.`);
            } else {
                await createSkillMutation.mutateAsync(skillForm);
                showSuccess("Skill Created", `"${skillForm.name}" has been added to the library.`);
            }
            setSkillModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    // -- Mapping CRUD --
    const openCreateMapping = () => { setEditingMappingId(null); setMappingForm({ ...EMPTY_MAPPING_FORM }); setMappingModalOpen(true); };
    const openEditMapping = (m: any) => { setEditingMappingId(m.id); setMappingForm({ employeeId: m.employeeId ?? "", skillId: m.skillId ?? "", proficiencyLevel: m.proficiencyLevel ?? 3, requiredLevel: m.requiredLevel ?? 3, notes: m.notes ?? "" }); setMappingModalOpen(true); };
    const handleSaveMapping = async () => {
        try {
            const payload = { ...mappingForm, proficiencyLevel: Number(mappingForm.proficiencyLevel), requiredLevel: Number(mappingForm.requiredLevel) };
            if (editingMappingId) {
                await updateMappingMutation.mutateAsync({ id: editingMappingId, data: payload });
                showSuccess("Mapping Updated", "Skill mapping has been updated.");
            } else {
                await createMappingMutation.mutateAsync(payload);
                showSuccess("Mapping Created", "Skill mapping has been created.");
            }
            setMappingModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    // -- Delete --
    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            if (deleteType === "skill") {
                await deleteSkillMutation.mutateAsync(deleteTarget.id);
                showSuccess("Skill Deleted", `"${deleteTarget.name}" has been removed.`);
            } else {
                await deleteMappingMutation.mutateAsync(deleteTarget.id);
                showSuccess("Mapping Deleted", "Skill mapping has been removed.");
            }
            setDeleteTarget(null);
        } catch (err) { showApiError(err); }
    };

    // -- Gap Analysis --
    const openGapAnalysis = () => {
        if (employees.length > 0 && !gapEmployeeId) setGapEmployeeId(employees[0]?.id ?? "");
        setGapModalOpen(true);
    };

    const isLoading = activeTab === "library" ? skillsLoading : mappingsLoading;
    const isError = activeTab === "library" ? skillsError : mappingsError;
    const savingSkill = createSkillMutation.isPending || updateSkillMutation.isPending;
    const savingMapping = createMappingMutation.isPending || updateMappingMutation.isPending;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Skills & Mapping</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage skill library, map skills to employees, and identify gaps</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={openGapAnalysis} className="inline-flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-accent-500/20 transition-all dark:shadow-none">
                        <BarChart3 className="w-4 h-4" /> Gap Analysis
                    </button>
                    <button onClick={activeTab === "library" ? openCreateSkill : openCreateMapping} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none">
                        <Plus className="w-5 h-5" /> {activeTab === "library" ? "New Skill" : "New Mapping"}
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 dark:text-neutral-500" />
                    <input type="text" placeholder={activeTab === "library" ? "Search skills..." : "Search mappings..."} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
                <div className="flex items-center gap-3 overflow-x-auto pb-1 lg:pb-0">
                    <div className="flex items-center gap-1 border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
                        <button onClick={() => { setActiveTab("library"); setSearch(""); }} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", activeTab === "library" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><BookOpen size={12} /> Library</button>
                        <button onClick={() => { setActiveTab("mappings"); setSearch(""); }} className={cn("px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1", activeTab === "mappings" ? "bg-primary-600 text-white" : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800")}><Link2 size={12} /> Mappings</button>
                    </div>
                    {activeTab === "library" && (
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-3 py-1.5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-semibold text-neutral-700 dark:text-neutral-300 focus:outline-none">
                            <option value="">All Categories</option>
                            {SKILL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                        </select>
                    )}
                </div>
            </div>

            {isError && (
                <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800/50 rounded-xl p-4 text-sm text-danger-700 dark:text-danger-400 font-medium">Failed to load data. Please try again.</div>
            )}

            {/* Skill Library Table */}
            {activeTab === "library" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? <SkeletonTable rows={6} cols={5} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[700px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Skill Name</th>
                                        <th className="py-4 px-6 font-bold">Category</th>
                                        <th className="py-4 px-6 font-bold">Description</th>
                                        <th className="py-4 px-6 font-bold text-center">Mapped To</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredSkills.map((s: any) => {
                                        const mappingCount = mappings.filter((m: any) => m.skillId === s.id).length;
                                        return (
                                            <tr key={s.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                            <Brain className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6"><CategoryBadge category={s.category ?? "TECHNICAL"} /></td>
                                                <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs max-w-xs truncate">{s.description || "\u2014"}</td>
                                                <td className="py-4 px-6 text-center">
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{mappingCount} {mappingCount === 1 ? "employee" : "employees"}</span>
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEditSkill(s)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => { setDeleteTarget(s); setDeleteType("skill"); }} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredSkills.length === 0 && !isLoading && (
                                        <tr><td colSpan={5}><EmptyState icon="list" title="No skills found" message="Add skills to build your organization's skill library." action={{ label: "New Skill", onClick: openCreateSkill }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Skill Mappings Table */}
            {activeTab === "mappings" && (
                <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                    {isLoading ? <SkeletonTable rows={6} cols={6} /> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[900px]">
                                <thead>
                                    <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                        <th className="py-4 px-6 font-bold">Employee</th>
                                        <th className="py-4 px-6 font-bold">Skill</th>
                                        <th className="py-4 px-6 font-bold">Current Level</th>
                                        <th className="py-4 px-6 font-bold">Required Level</th>
                                        <th className="py-4 px-6 font-bold text-center">Gap</th>
                                        <th className="py-4 px-6 font-bold text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {filteredMappings.map((m: any) => {
                                        const gap = (m.requiredLevel ?? 0) - (m.proficiencyLevel ?? 0);
                                        return (
                                            <tr key={m.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center shrink-0">
                                                            <User className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                                                        </div>
                                                        <span className="font-bold text-primary-950 dark:text-white">{employeeName(m.employeeId)}</span>
                                                    </div>
                                                </td>
                                                <td className="py-4 px-6 text-neutral-700 dark:text-neutral-300 font-medium">{skillName(m.skillId)}</td>
                                                <td className="py-4 px-6"><ProficiencyBar level={m.proficiencyLevel ?? 1} /></td>
                                                <td className="py-4 px-6"><ProficiencyBar level={m.requiredLevel ?? 1} /></td>
                                                <td className="py-4 px-6 text-center">
                                                    {gap > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200 dark:border-danger-800/50">
                                                            <AlertTriangle size={10} /> -{gap}
                                                        </span>
                                                    ) : gap < 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-success-600 dark:text-success-400 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800/50">+{Math.abs(gap)}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-neutral-400">On target</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => openEditMapping(m)} className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors" title="Edit"><Edit3 size={15} /></button>
                                                        <button onClick={() => { setDeleteTarget(m); setDeleteType("mapping"); }} className="p-2 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {filteredMappings.length === 0 && !isLoading && (
                                        <tr><td colSpan={6}><EmptyState icon="list" title="No skill mappings found" message="Map skills to employees to track proficiency levels." action={{ label: "New Mapping", onClick: openCreateMapping }} /></td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* ── Skill Create/Edit Modal ── */}
            {skillModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingSkillId ? "Edit Skill" : "New Skill"}</h2>
                            <button onClick={() => setSkillModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Skill Name</label>
                                <input type="text" value={skillForm.name} onChange={(e) => setSkillForm((p) => ({ ...p, name: e.target.value }))} placeholder="e.g., React, Project Management" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Category</label>
                                <select value={skillForm.category} onChange={(e) => setSkillForm((p) => ({ ...p, category: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    {SKILL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                                <textarea value={skillForm.description} onChange={(e) => setSkillForm((p) => ({ ...p, description: e.target.value }))} rows={3} placeholder="Brief description of the skill..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setSkillModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveSkill} disabled={savingSkill || !skillForm.name} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingSkill && <Loader2 size={14} className="animate-spin" />}
                                {savingSkill ? "Saving..." : editingSkillId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Mapping Create/Edit Modal ── */}
            {mappingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingMappingId ? "Edit Skill Mapping" : "New Skill Mapping"}</h2>
                            <button onClick={() => setMappingModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Employee</label>
                                <select value={mappingForm.employeeId} onChange={(e) => setMappingForm((p) => ({ ...p, employeeId: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Skill</label>
                                <select value={mappingForm.skillId} onChange={(e) => setMappingForm((p) => ({ ...p, skillId: e.target.value }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select skill...</option>
                                    {skills.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Current Level (1-5)</label>
                                    <select value={mappingForm.proficiencyLevel} onChange={(e) => setMappingForm((p) => ({ ...p, proficiencyLevel: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PROFICIENCY_LEVELS.map((p) => <option key={p.value} value={p.value}>{p.value} - {p.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Required Level (1-5)</label>
                                    <select value={mappingForm.requiredLevel} onChange={(e) => setMappingForm((p) => ({ ...p, requiredLevel: Number(e.target.value) }))} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                        {PROFICIENCY_LEVELS.map((p) => <option key={p.value} value={p.value}>{p.value} - {p.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Notes</label>
                                <textarea value={mappingForm.notes} onChange={(e) => setMappingForm((p) => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Optional notes..." className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setMappingModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleSaveMapping} disabled={savingMapping || !mappingForm.employeeId || !mappingForm.skillId} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {savingMapping && <Loader2 size={14} className="animate-spin" />}
                                {savingMapping ? "Saving..." : editingMappingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Gap Analysis Modal ── */}
            {gapModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Skill Gap Analysis</h2>
                            <button onClick={() => setGapModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Select Employee</label>
                                <select value={gapEmployeeId} onChange={(e) => setGapEmployeeId(e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white transition-all">
                                    <option value="">Select employee...</option>
                                    {employees.map((e: any) => <option key={e.id} value={e.id}>{[e.firstName, e.lastName].filter(Boolean).join(" ") || e.fullName || e.email}</option>)}
                                </select>
                            </div>

                            {gapQuery.isLoading ? (
                                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-primary-400 animate-spin" /></div>
                            ) : gapData.length > 0 ? (
                                <div className="space-y-3">
                                    {gapData.map((item: any, i: number) => {
                                        const gap = (item.requiredLevel ?? 0) - (item.currentLevel ?? item.proficiencyLevel ?? 0);
                                        return (
                                            <div key={i} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-bold text-primary-950 dark:text-white">{item.skillName ?? item.skill?.name ?? "Unnamed Skill"}</span>
                                                    {gap > 0 ? (
                                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-danger-600 bg-danger-50 dark:bg-danger-900/20 px-2 py-0.5 rounded-full border border-danger-200 dark:border-danger-800/50"><AlertTriangle size={10} /> Gap: {gap}</span>
                                                    ) : (
                                                        <span className="text-[10px] font-bold text-success-600 bg-success-50 dark:bg-success-900/20 px-2 py-0.5 rounded-full border border-success-200 dark:border-success-800/50">No Gap</span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-[10px] text-neutral-400 mb-1">Current Level</p>
                                                        <ProficiencyBar level={item.currentLevel ?? item.proficiencyLevel ?? 1} compact />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-neutral-400 mb-1">Required Level</p>
                                                        <ProficiencyBar level={item.requiredLevel ?? 1} compact />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : gapEmployeeId ? (
                                <div className="flex flex-col items-center py-12 space-y-3">
                                    <BarChart3 className="w-10 h-10 text-neutral-300 dark:text-neutral-600" />
                                    <p className="text-sm text-neutral-400">No skill data available for this employee</p>
                                </div>
                            ) : null}
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setGapModalOpen(false)} className="w-full py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirmation ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 dark:text-danger-400 mb-2">Delete {deleteType === "skill" ? "Skill" : "Mapping"}?</h2>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {deleteType === "skill"
                                ? <>This will permanently delete <strong>"{deleteTarget.name}"</strong> and all associated mappings.</>
                                : <>This will remove the skill mapping for this employee.</>}
                        </p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteSkillMutation.isPending || deleteMappingMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                                {(deleteSkillMutation.isPending || deleteMappingMutation.isPending) ? "Deleting..." : "Delete"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
