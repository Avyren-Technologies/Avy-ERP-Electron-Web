import { useState, useRef, useCallback } from "react";
import { Shield, Plus, Edit3, Trash2, Loader2, X, Search, Eye, Upload, Link as LinkIcon, PlusCircle, Trash, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSafetyInductions } from "@/features/company-admin/api/use-visitor-queries";
import { useCreateSafetyInduction, useUpdateSafetyInduction, useDeleteSafetyInduction } from "@/features/company-admin/api/use-visitor-mutations";
import { useCanPerform } from "@/hooks/useCanPerform";
import { useFileUpload } from "@/hooks/useFileUpload";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { showSuccess, showApiError } from "@/lib/toast";

const INDUCTION_TYPES = [
    { value: "VIDEO", label: "Video" },
    { value: "SLIDES", label: "Slides" },
    { value: "QUESTIONNAIRE", label: "Questionnaire" },
    { value: "DECLARATION", label: "Declaration" },
] as const;

const EMPTY_FORM = { name: "", type: "VIDEO" as string, contentUrl: "", passingScore: "80", durationSeconds: "120", validityDays: "30" };

// ── URL Detection Helpers ──

function getYouTubeEmbedUrl(url: string): string | null {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
    ];
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}`;
    }
    return null;
}

function getVimeoEmbedUrl(url: string): string | null {
    const match = url.match(/vimeo\.com\/(\d+)/);
    if (match?.[1]) return `https://player.vimeo.com/video/${match[1]}`;
    return null;
}

function isDirectVideoUrl(url: string): boolean {
    return /\.(mp4|webm|mov|ogg)(\?.*)?$/i.test(url);
}

// ── Preview Modal ──

function PreviewModal({ induction, onClose }: { induction: any; onClose: () => void }) {
    const renderContent = () => {
        const type: string = induction.type ?? "";
        const url: string = induction.contentUrl ?? "";

        if (type === "VIDEO" && url) {
            const ytEmbed = getYouTubeEmbedUrl(url);
            if (ytEmbed) {
                return (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                        <iframe src={ytEmbed} title={induction.name} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                );
            }
            const vimeoEmbed = getVimeoEmbedUrl(url);
            if (vimeoEmbed) {
                return (
                    <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                        <iframe src={vimeoEmbed} title={induction.name} className="w-full h-full" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                    </div>
                );
            }
            // Direct video URL or R2 presigned URL
            return (
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                    <video src={url} controls className="w-full h-full" controlsList="nodownload">
                        Your browser does not support the video tag.
                    </video>
                </div>
            );
        }

        if (type === "SLIDES" && url) {
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <LinkIcon className="w-12 h-12 text-accent-500" />
                    <p className="text-sm text-neutral-600 dark:text-neutral-400">Slides content available at:</p>
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-700 underline text-sm font-medium break-all max-w-full">{url}</a>
                </div>
            );
        }

        if (type === "QUESTIONNAIRE") {
            const rawQuestions = induction.questions ?? induction.contentUrl;
            let parsed: any[] | null = null;
            if (typeof rawQuestions === "string") {
                try { parsed = JSON.parse(rawQuestions); } catch { parsed = null; }
            } else if (Array.isArray(rawQuestions)) {
                parsed = rawQuestions;
            }

            if (parsed && parsed.length > 0) {
                return (
                    <div className="space-y-4 max-h-[400px] overflow-y-auto">
                        <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Questionnaire ({parsed.length} question{parsed.length !== 1 ? "s" : ""})</p>
                        {parsed.map((q: any, idx: number) => (
                            <div key={idx} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                                <p className="text-sm font-semibold text-primary-950 dark:text-white mb-2">{idx + 1}. {q.question}</p>
                                <div className="space-y-1.5">
                                    {(q.options ?? []).map((opt: string, oIdx: number) => (
                                        <div key={oIdx} className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm", q.correctAnswer === oIdx ? "bg-success-50 text-success-700 font-semibold border border-success-200" : "text-neutral-600 dark:text-neutral-400")}>
                                            <span className={cn("w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0", q.correctAnswer === oIdx ? "border-success-500" : "border-neutral-300")}>
                                                {q.correctAnswer === oIdx && <span className="w-2 h-2 rounded-full bg-success-500" />}
                                            </span>
                                            {opt}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            }
            return (
                <div className="flex flex-col items-center gap-4 py-8">
                    <p className="text-sm text-neutral-500">No questionnaire data available.</p>
                </div>
            );
        }

        if (type === "DECLARATION") {
            const content = induction.declarationText ?? induction.contentUrl ?? "";
            return (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Declaration Text</p>
                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{content || "No declaration text available."}</div>
                </div>
            );
        }

        return (
            <div className="flex flex-col items-center gap-4 py-8">
                <p className="text-sm text-neutral-500">No preview available for this induction.</p>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                    <div>
                        <h2 className="text-lg font-bold text-primary-950 dark:text-white">{induction.name}</h2>
                        <span className="text-xs text-neutral-400 uppercase">{induction.type}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                </div>
                <div className="p-6 overflow-y-auto flex-1">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}

// ── Main Screen ──

export function SafetyInductionScreen() {
    const canConfigure = useCanPerform("visitors:configure");
    const { data, isLoading, isError } = useSafetyInductions();
    const createMutation = useCreateSafetyInduction();
    const updateMutation = useUpdateSafetyInduction();
    const deleteMutation = useDeleteSafetyInduction();

    const [search, setSearch] = useState("");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({ ...EMPTY_FORM });
    const [deleteTarget, setDeleteTarget] = useState<any>(null);
    const [previewTarget, setPreviewTarget] = useState<any>(null);
    const [contentInputMode, setContentInputMode] = useState<"url" | "upload">("url");
    const [questions, setQuestions] = useState<{ question: string; options: string[]; correctAnswer: number }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload: uploadFile, isUploading } = useFileUpload({
        category: "induction-content",
        entityId: editingId ?? "new",
        maxSize: 100 * 1024 * 1024, // 100 MB
        allowedTypes: ["video/mp4", "video/webm", "video/quicktime", "image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
        onSuccess: (key) => {
            updateField("contentUrl", key);
        },
    });

    const inductions: any[] = data?.data ?? [];
    const filtered = inductions.filter((i: any) => {
        if (!search) return true;
        return i.name?.toLowerCase().includes(search.toLowerCase());
    });

    const openCreate = () => { setEditingId(null); setForm({ ...EMPTY_FORM }); setQuestions([]); setContentInputMode("url"); setModalOpen(true); };
    const openEdit = (i: any) => {
        setEditingId(i.id);
        setForm({
            name: i.name ?? "",
            type: i.type ?? "VIDEO",
            contentUrl: i.contentUrl ?? "",
            passingScore: String(i.passingScore ?? "80"),
            durationSeconds: String(i.durationSeconds ?? "120"),
            validityDays: String(i.validityDays ?? "30"),
        });
        // Parse questions for questionnaire type
        if (i.type === "QUESTIONNAIRE" && i.questions) {
            try {
                const parsed = typeof i.questions === "string" ? JSON.parse(i.questions) : i.questions;
                if (Array.isArray(parsed)) setQuestions(parsed);
                else setQuestions([]);
            } catch { setQuestions([]); }
        } else {
            setQuestions([]);
        }
        setContentInputMode("url");
        setModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload: Record<string, unknown> = {
                name: form.name,
                type: form.type,
                passingScore: form.passingScore ? Number(form.passingScore) : undefined,
                durationSeconds: form.durationSeconds ? Number(form.durationSeconds) : undefined,
                validityDays: form.validityDays ? Number(form.validityDays) : undefined,
            };
            if (form.type === "VIDEO" || form.type === "SLIDES" || form.type === "DECLARATION") {
                payload.contentUrl = form.contentUrl || undefined;
            }
            if (form.type === "QUESTIONNAIRE") {
                payload.questions = questions.filter(q => q.question.trim());
            }
            if (editingId) {
                await updateMutation.mutateAsync({ id: editingId, data: payload });
                showSuccess("Induction Updated", `${form.name} has been updated.`);
            } else {
                await createMutation.mutateAsync(payload);
                showSuccess("Induction Created", `${form.name} has been added.`);
            }
            setModalOpen(false);
        } catch (err) { showApiError(err); }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try { await deleteMutation.mutateAsync(deleteTarget.id); showSuccess("Deleted", `${deleteTarget.name} removed.`); setDeleteTarget(null); } catch (err) { showApiError(err); }
    };

    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const key = await uploadFile(file);
        if (key) {
            updateField("contentUrl", key);
        }
        // Reset file input so the same file can be selected again
        if (fileInputRef.current) fileInputRef.current.value = "";
    }, [uploadFile]);

    const saving = createMutation.isPending || updateMutation.isPending;
    const updateField = (key: string, value: any) => setForm((p) => ({ ...p, [key]: value }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white tracking-tight">Safety Inductions</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Manage safety induction content for visitors</p>
                </div>
                {canConfigure && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-primary-500/20 transition-all dark:shadow-none"><Plus className="w-5 h-5" /> Add Induction</button>
                )}
            </div>

            <div className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-sm">
                <div className="relative max-w-md w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input type="text" placeholder="Search inductions..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-11 pr-4 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all" />
                </div>
            </div>

            {isError && <div className="bg-danger-50 border border-danger-200 rounded-xl p-4 text-sm text-danger-700 font-medium">Failed to load inductions.</div>}

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 shadow-xl shadow-neutral-900/5 overflow-hidden">
                {isLoading ? <SkeletonTable rows={4} cols={6} /> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[800px]">
                            <thead>
                                <tr className="bg-neutral-50/50 dark:bg-neutral-800/30 border-b border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-widest">
                                    <th className="py-4 px-6 font-bold">Name</th>
                                    <th className="py-4 px-6 font-bold">Type</th>
                                    <th className="py-4 px-6 font-bold">Duration (sec)</th>
                                    <th className="py-4 px-6 font-bold">Validity (days)</th>
                                    <th className="py-4 px-6 font-bold text-center">Status</th>
                                    <th className="py-4 px-6 font-bold text-center">Preview</th>
                                    <th className="py-4 px-6 font-bold text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {filtered.map((i: any) => (
                                    <tr key={i.id} className="border-b border-neutral-100 dark:border-neutral-800/50 last:border-0 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-success-50 dark:bg-success-900/30 flex items-center justify-center shrink-0"><Shield className="w-4 h-4 text-success-600" /></div>
                                                <div>
                                                    <span className="font-bold text-primary-950 dark:text-white block">{i.name}</span>
                                                    {i.contentUrl && <span className="text-[10px] text-neutral-400 line-clamp-1">{i.contentUrl}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs uppercase">{i.type || "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{i.durationSeconds ?? "---"}</td>
                                        <td className="py-4 px-6 text-neutral-600 dark:text-neutral-400 text-xs">{i.validityDays ?? "---"}</td>
                                        <td className="py-4 px-6 text-center">
                                            <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", i.isActive !== false ? "bg-success-50 text-success-700 border-success-200" : "bg-neutral-100 text-neutral-500 border-neutral-200")}>{i.isActive !== false ? "Active" : "Inactive"}</span>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            <button onClick={() => setPreviewTarget(i)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-accent-600 hover:text-accent-700 bg-accent-50 hover:bg-accent-100 rounded-lg transition-colors" title="Preview content">
                                                <Eye size={14} /> Preview
                                            </button>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            {canConfigure && (
                                                <div className="flex items-center justify-end gap-1">
                                                    <button onClick={() => openEdit(i)} className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"><Edit3 size={15} /></button>
                                                    <button onClick={() => setDeleteTarget(i)} className="p-2 text-danger-500 hover:bg-danger-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !isLoading && (
                                    <tr><td colSpan={7}><EmptyState icon="list" title="No inductions" message="Add safety induction content for visitors." action={canConfigure ? { label: "Add Induction", onClick: openCreate } : undefined} /></td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">{editingId ? "Edit Induction" : "Add Induction"}</h2>
                            <button onClick={() => setModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Name *</label><input type="text" value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="e.g. General Safety Induction" className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" /></div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Type</label>
                                <select value={form.type} onChange={(e) => updateField("type", e.target.value)} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white">
                                    {INDUCTION_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                                </select>
                            </div>

                            {/* Type-specific content */}
                            {(form.type === "VIDEO" || form.type === "SLIDES") && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">{form.type === "VIDEO" ? "Video Content" : "Slides Content"}</label>
                                    <div className="flex gap-2 mb-2">
                                        <button type="button" onClick={() => setContentInputMode("url")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", contentInputMode === "url" ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200")}>
                                            <LinkIcon size={12} /> URL
                                        </button>
                                        <button type="button" onClick={() => setContentInputMode("upload")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors", contentInputMode === "upload" ? "bg-primary-100 text-primary-700" : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200")}>
                                            <Upload size={12} /> Upload
                                        </button>
                                    </div>
                                    {contentInputMode === "url" ? (
                                        <input type="url" value={form.contentUrl} onChange={(e) => updateField("contentUrl", e.target.value)} placeholder={form.type === "VIDEO" ? "https://youtube.com/watch?v=... or direct video URL" : "https://docs.google.com/presentation/..."} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all" />
                                    ) : (
                                        <div className="space-y-2">
                                            <input ref={fileInputRef} type="file" accept="video/mp4,video/webm,video/quicktime,image/jpeg,image/png,application/pdf" onChange={handleFileSelect} className="hidden" />
                                            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full flex items-center justify-center gap-2 px-3 py-4 bg-neutral-50 dark:bg-neutral-800 border-2 border-dashed border-neutral-300 rounded-xl text-sm text-neutral-600 hover:border-primary-400 hover:text-primary-600 transition-all disabled:opacity-50">
                                                {isUploading ? (<><Loader2 size={16} className="animate-spin" /> Uploading...</>) : (<><Upload size={16} /> Choose file (max 100 MB)</>)}
                                            </button>
                                            {form.contentUrl && <p className="text-[10px] text-success-600 font-medium truncate">Uploaded: {form.contentUrl}</p>}
                                        </div>
                                    )}
                                    <p className="text-[10px] text-neutral-400 mt-1">{form.type === "VIDEO" ? "Supports YouTube, Vimeo, or direct video file URLs" : "Paste a link to your slides or upload a PDF"}</p>
                                </div>
                            )}

                            {form.type === "DECLARATION" && (
                                <div>
                                    <label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Declaration Text *</label>
                                    <textarea value={form.contentUrl} onChange={(e) => updateField("contentUrl", e.target.value)} placeholder="Enter the declaration text that visitors must read and acknowledge before proceeding..." rows={5} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white placeholder:text-neutral-400 transition-all resize-none" />
                                </div>
                            )}

                            {form.type === "QUESTIONNAIRE" && (
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Questions *</label>
                                        <button type="button" onClick={() => setQuestions(prev => [...prev, { question: "", options: ["", "", ""], correctAnswer: 0 }])} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors">
                                            <PlusCircle size={14} /> Add Question
                                        </button>
                                    </div>

                                    {questions.length === 0 && (
                                        <div className="flex flex-col items-center gap-2 py-8 border-2 border-dashed border-neutral-200 dark:border-neutral-700 rounded-xl">
                                            <p className="text-sm text-neutral-400">No questions added yet</p>
                                            <button type="button" onClick={() => setQuestions([{ question: "", options: ["", "", ""], correctAnswer: 0 }])} className="text-xs font-semibold text-primary-600 hover:text-primary-700">Add your first question</button>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {questions.map((q, qIdx) => (
                                            <div key={qIdx} className="bg-neutral-50 dark:bg-neutral-800/50 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-xs font-bold text-primary-600">Question {qIdx + 1}</span>
                                                    <button type="button" onClick={() => setQuestions(prev => prev.filter((_, i) => i !== qIdx))} className="p-1 text-danger-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"><Trash size={14} /></button>
                                                </div>
                                                <input type="text" value={q.question} onChange={(e) => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, question: e.target.value } : item))} placeholder="Enter your question..." className="w-full px-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white placeholder:text-neutral-400 mb-3" />
                                                <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider mb-2">Options (click radio to mark correct answer)</p>
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex items-center gap-2 mb-2">
                                                        <button type="button" onClick={() => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, correctAnswer: oIdx } : item))} className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors", q.correctAnswer === oIdx ? "border-success-500" : "border-neutral-300 hover:border-neutral-400")}>
                                                            {q.correctAnswer === oIdx && <div className="w-2.5 h-2.5 rounded-full bg-success-500" />}
                                                        </button>
                                                        <input type="text" value={opt} onChange={(e) => setQuestions(prev => prev.map((item, i) => { if (i !== qIdx) return item; const opts = [...item.options]; opts[oIdx] = e.target.value; return { ...item, options: opts }; }))} placeholder={`Option ${oIdx + 1}`} className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-lg text-sm dark:text-white placeholder:text-neutral-400" />
                                                        {q.options.length > 2 && (
                                                            <button type="button" onClick={() => setQuestions(prev => prev.map((item, i) => { if (i !== qIdx) return item; const opts = item.options.filter((_, oi) => oi !== oIdx); return { ...item, options: opts, correctAnswer: Math.min(item.correctAnswer, opts.length - 1) }; }))} className="p-1 text-neutral-400 hover:text-danger-500 transition-colors"><X size={12} /></button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button type="button" onClick={() => setQuestions(prev => prev.map((item, i) => i === qIdx ? { ...item, options: [...item.options, ""] } : item))} className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 mt-1">+ Add Option</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-4">
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Passing Score (%)</label><input type="number" value={form.passingScore} onChange={(e) => updateField("passingScore", e.target.value)} min={0} max={100} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Duration (sec)</label><input type="number" value={form.durationSeconds} onChange={(e) => updateField("durationSeconds", e.target.value)} min={10} max={600} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                                <div><label className="block text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1.5">Validity (days)</label><input type="number" value={form.validityDays} onChange={(e) => updateField("validityDays", e.target.value)} min={1} max={365} className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm dark:text-white transition-all" /></div>
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={saving || isUploading || !form.name} className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {saving && <Loader2 size={14} className="animate-spin" />}
                                {saving ? "Saving..." : editingId ? "Update" : "Create"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-sm p-7 animate-in fade-in zoom-in-95 duration-200">
                        <h2 className="text-lg font-bold text-danger-700 mb-2">Delete Induction?</h2>
                        <p className="text-sm text-neutral-500">Remove <strong>{deleteTarget.name}</strong>?</p>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 transition-colors">Cancel</button>
                            <button onClick={handleDelete} disabled={deleteMutation.isPending} className="flex-1 py-3 rounded-xl bg-danger-600 hover:bg-danger-700 text-white text-sm font-bold transition-colors disabled:opacity-50">{deleteMutation.isPending ? "Deleting..." : "Delete"}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewTarget && (
                <PreviewModal induction={previewTarget} onClose={() => setPreviewTarget(null)} />
            )}
        </div>
    );
}
