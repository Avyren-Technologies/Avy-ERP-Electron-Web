import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ConfirmDialogVariant = 'primary' | 'danger' | 'success';

export interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: ConfirmDialogVariant;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    loading = false,
    onConfirm,
    onCancel,
    variant = 'primary',
}: ConfirmDialogProps) {
    if (!open) return null;

    const btnCls =
        variant === 'danger'
            ? 'bg-danger-600 hover:bg-danger-700'
            : variant === 'success'
              ? 'bg-success-600 hover:bg-success-700'
              : 'bg-primary-600 hover:bg-primary-700';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-7 dark:bg-neutral-900">
                <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">{title}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{message}</p>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-800"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className={cn(
                            'flex-1 py-3 rounded-xl text-white text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2',
                            btnCls,
                        )}
                    >
                        {loading && <Loader2 size={14} className="animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}
