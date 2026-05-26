import { useCallback, useRef, useState } from "react";
import { FileText, Image, Loader2, Upload, X } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useFileUrl } from "@/hooks/useFileUrl";
import { showApiError, showSuccess } from "@/lib/toast";
import {
    canAddWorkOrderEvidence,
    createEvidenceItem,
    getEvidenceDisplayName,
    isImageEvidenceItem,
    isRemoteUrl,
    type WorkOrderEvidenceItem,
} from "@/features/maintenance/work-orders/work-order-evidence";

function EvidencePreviewCard({ item }: { item: WorkOrderEvidenceItem }) {
    const storageKey = item.url && !isRemoteUrl(item.url) ? item.url : null;
    const { url: signedUrl, isLoading } = useFileUrl({ key: storageKey });
    const displayUrl = item.url && isRemoteUrl(item.url) ? item.url : signedUrl;
    const isImage = isImageEvidenceItem(item);

    return (
        <div className="rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <div className="w-full aspect-square bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
                {isImage && isLoading ? (
                    <Loader2 size={24} className="animate-spin text-neutral-400" />
                ) : isImage && displayUrl ? (
                    <img
                        src={displayUrl}
                        alt={getEvidenceDisplayName(item)}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <FileText size={32} className="text-neutral-400" />
                )}
            </div>
            <div className="p-2 space-y-0.5">
                <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                    {getEvidenceDisplayName(item)}
                </p>
                {item.fileName && item.fileName !== getEvidenceDisplayName(item) ? (
                    <p className="text-[10px] text-neutral-500 truncate">{item.fileName}</p>
                ) : null}
            </div>
        </div>
    );
}

function EmptySection({ title, message }: { title: string; message: string }) {
    return (
        <div className="text-center py-12 text-neutral-500 dark:text-neutral-400">
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs mt-1">{message}</p>
        </div>
    );
}

export function WorkOrderEvidenceTab({
    evidence,
    woId,
    addMutation,
    canManage,
    status,
}: {
    evidence: WorkOrderEvidenceItem[];
    woId: string;
    addMutation: { mutateAsync: (payload: { id: string; evidence: WorkOrderEvidenceItem[] }) => Promise<unknown>; isPending: boolean };
    canManage: boolean;
    status: string;
}) {
    const [description, setDescription] = useState("");
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const isActive = canAddWorkOrderEvidence(status);

    const { upload, isUploading } = useFileUpload({
        category: "expense-receipt",
        entityId: woId,
        allowedTypes: ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"],
    });

    const processFiles = useCallback((files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const remaining = 5 - pendingFiles.length;
        setPendingFiles((prev) => [...prev, ...fileArray.slice(0, remaining)]);
    }, [pendingFiles.length]);

    const removePending = (index: number) => {
        setPendingFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = async () => {
        if (pendingFiles.length === 0) return;

        try {
            const items: WorkOrderEvidenceItem[] = [];
            for (const file of pendingFiles) {
                const key = await upload(file);
                if (!key) {
                    showApiError(new Error(`Failed to upload "${file.name}"`));
                    return;
                }
                items.push(
                    createEvidenceItem({
                        url: key,
                        description: description.trim() || undefined,
                        fileName: file.name,
                        contentType: file.type,
                    }),
                );
            }

            await addMutation.mutateAsync({ id: woId, evidence: items });
            showSuccess("Added", items.length === 1 ? "Evidence added." : `${items.length} evidence files added.`);
            setPendingFiles([]);
            setDescription("");
        } catch (err) {
            showApiError(err);
        }
    };

    const isBusy = addMutation.isPending || isUploading;

    return (
        <div className="space-y-4">
            {canManage && isActive ? (
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800 space-y-4">
                    <div>
                        <p className="text-sm font-bold text-neutral-800 dark:text-neutral-200">Upload evidence</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Photos or PDFs (max 10 MB each, up to 5 files per upload)
                        </p>
                    </div>

                    <div
                        role="button"
                        tabIndex={0}
                        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDragging(false);
                            if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click(); }}
                        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                            isDragging
                                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                : "border-neutral-200 dark:border-neutral-700 hover:border-primary-300"
                        }`}
                    >
                        <Upload size={28} className="mx-auto text-neutral-400 mb-2" />
                        <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Drag & drop or click to choose files
                        </p>
                        <p className="text-xs text-neutral-500 mt-1">JPEG, PNG, WebP, GIF, PDF</p>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files?.length) processFiles(e.target.files);
                                e.target.value = "";
                            }}
                        />
                    </div>

                    {pendingFiles.length > 0 ? (
                        <div className="space-y-2">
                            {pendingFiles.map((file, idx) => (
                                <div
                                    key={`${file.name}-${idx}`}
                                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
                                >
                                    <span className="text-xs text-neutral-700 dark:text-neutral-300 truncate flex-1">
                                        {file.name}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removePending(idx)}
                                        className="p-1 text-neutral-400 hover:text-danger-600"
                                        aria-label="Remove file"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : null}

                    <div>
                        <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                            Caption / description (optional)
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            placeholder="Describe what this evidence shows..."
                            className="w-full px-3 py-2.5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={handleUpload}
                            disabled={isBusy || pendingFiles.length === 0}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50"
                        >
                            {(isBusy) && <Loader2 size={14} className="animate-spin" />}
                            Upload {pendingFiles.length > 0 ? `(${pendingFiles.length})` : ""}
                        </button>
                    </div>
                </div>
            ) : null}

            {evidence.length === 0 ? (
                <EmptySection
                    title="No Evidence"
                    message={
                        canManage && isActive
                            ? "Upload photos or documents to document work performed."
                            : "No evidence has been added to this work order."
                    }
                />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {evidence.map((item) => (
                        <EvidencePreviewCard key={item.id} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}
