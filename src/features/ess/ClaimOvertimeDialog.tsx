import { useState, useRef, useCallback } from "react";
import {
    X,
    Loader2,
    Clock,
    CalendarDays,
    Upload,
    FileText,
    Paperclip,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showSuccess, showApiError } from "@/lib/toast";
import { useClaimOvertime } from "@/features/ess/use-overtime-queries";
import { useFileUpload } from "@/hooks/useFileUpload";

interface ClaimOvertimeDialogProps {
    open: boolean;
    onClose: () => void;
}

export function ClaimOvertimeDialog({ open, onClose }: ClaimOvertimeDialogProps) {
    const claimMutation = useClaimOvertime();

    const [date, setDate] = useState("");
    const [hours, setHours] = useState("");
    const [reason, setReason] = useState("");
    const [attachments, setAttachments] = useState<{ fileName: string; fileUrl: string }[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { upload, isUploading } = useFileUpload({
        category: "expense-receipt",
        entityId: "overtime-claim",
    });

    // Date constraints: last 30 days
    const today = new Date();
    const maxDate = today.toISOString().split("T")[0];
    const minDate = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const reasonLen = reason.trim().length;
    const isValid = date && hours && parseFloat(hours) > 0 && reasonLen >= 10 && reasonLen <= 500;

    function resetForm() {
        setDate("");
        setHours("");
        setReason("");
        setAttachments([]);
        setIsDragging(false);
    }

    function handleClose() {
        resetForm();
        onClose();
    }

    function handleSubmit() {
        if (!isValid) return;
        claimMutation.mutate(
            {
                date,
                hours: parseFloat(hours),
                reason: reason.trim(),
                attachments: attachments.length > 0 ? attachments.map((a) => a.fileUrl) : undefined,
            },
            {
                onSuccess: () => {
                    showSuccess("Overtime claim submitted successfully");
                    handleClose();
                },
                onError: (err) => showApiError(err),
            },
        );
    }

    const processFiles = useCallback(
        async (files: FileList | File[]) => {
            const fileArray = Array.from(files);
            const MAX_FILES = 5;
            const remaining = MAX_FILES - attachments.length;
            const toProcess = fileArray.slice(0, remaining);

            for (const file of toProcess) {
                if (file.size > 10 * 1024 * 1024) {
                    showApiError(new Error(`File "${file.name}" exceeds 10MB limit`));
                    continue;
                }
                try {
                    const key = await upload(file);
                    if (key) {
                        setAttachments((prev) => [...prev, { fileName: file.name, fileUrl: key }]);
                    }
                } catch {
                    showApiError(new Error(`Failed to upload "${file.name}"`));
                }
            }
        },
        [upload, attachments.length],
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                processFiles(e.dataTransfer.files);
            }
        },
        [processFiles],
    );

    const handleFileSelect = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (e.target.files && e.target.files.length > 0) {
                processFiles(e.target.files);
                e.target.value = "";
            }
        },
        [processFiles],
    );

    function removeAttachment(index: number) {
        setAttachments((prev) => prev.filter((_, i) => i !== index));
    }

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 pb-8 overflow-y-auto">
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
            <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-5 h-5 text-primary-500" />
                            Claim Overtime
                        </h3>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Submit a manual overtime claim for approval
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-neutral-400" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-5">
                    {/* Date */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                            Date <span className="text-neutral-400">(last 30 days)</span>
                        </label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                min={minDate}
                                max={maxDate}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-10 pr-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Hours */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                            Hours Worked (OT)
                        </label>
                        <div className="relative">
                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                            <input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="24"
                                value={hours}
                                onChange={(e) => setHours(e.target.value)}
                                placeholder="e.g. 2.5"
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 pl-10 pr-4 py-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent focus:outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                            Reason <span className="text-neutral-400">(10-500 chars)</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            maxLength={500}
                            placeholder="Describe why you worked overtime..."
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm text-neutral-800 dark:text-neutral-200 placeholder:text-neutral-400 resize-none focus:ring-2 focus:ring-primary-300 dark:focus:ring-primary-600 focus:border-transparent focus:outline-none transition-all"
                        />
                        <div className="flex justify-end mt-1">
                            <span
                                className={cn(
                                    "text-[10px] font-medium",
                                    reasonLen < 10
                                        ? "text-danger-500"
                                        : reasonLen > 450
                                          ? "text-warning-500"
                                          : "text-neutral-400",
                                )}
                            >
                                {reasonLen}/500
                            </span>
                        </div>
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-400 mb-1.5">
                            Attachments <span className="text-neutral-400">(max 5 files)</span>
                        </label>
                        <div
                            className={cn(
                                "border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer",
                                isDragging
                                    ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20"
                                    : "border-neutral-300 dark:border-neutral-600 hover:border-primary-400 hover:bg-primary-50/50 dark:hover:bg-primary-900/10",
                                attachments.length >= 5 && "opacity-50 cursor-not-allowed",
                            )}
                            onDragOver={attachments.length < 5 ? handleDragOver : undefined}
                            onDragLeave={attachments.length < 5 ? handleDragLeave : undefined}
                            onDrop={attachments.length < 5 ? handleDrop : undefined}
                            onClick={() => attachments.length < 5 && fileInputRef.current?.click()}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept="image/*,.pdf,.doc,.docx"
                                className="hidden"
                                onChange={handleFileSelect}
                            />
                            <Upload
                                className={cn(
                                    "w-6 h-6 mx-auto mb-1",
                                    isDragging ? "text-primary-500" : "text-neutral-400",
                                )}
                            />
                            <p className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
                                {isDragging ? "Drop files here" : "Drop files or click to browse"}
                            </p>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                                PDF, Images, Documents (max 10MB)
                            </p>
                        </div>

                        {isUploading && (
                            <div className="flex items-center gap-2 mt-2 text-xs text-primary-600 dark:text-primary-400">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Uploading...
                            </div>
                        )}

                        {attachments.length > 0 && (
                            <div className="mt-3 space-y-2">
                                {attachments.map((a, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-3 p-2.5 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-700/50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                                            <Paperclip className="w-4 h-4 text-primary-500" />
                                        </div>
                                        <span className="flex-1 text-xs font-medium text-neutral-700 dark:text-neutral-300 truncate">
                                            {a.fileName}
                                        </span>
                                        <button
                                            onClick={() => removeAttachment(idx)}
                                            className="p-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded transition-colors flex-shrink-0"
                                        >
                                            <X className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!isValid || claimMutation.isPending || isUploading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl text-sm font-bold hover:from-primary-700 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
                    >
                        {claimMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                <Clock className="w-4 h-4" /> Submit Claim
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
