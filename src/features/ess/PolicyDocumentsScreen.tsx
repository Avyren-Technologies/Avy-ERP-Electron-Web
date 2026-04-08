import { usePolicyDocuments } from '@/features/company-admin/api';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { R2Link } from '@/components/R2Link';
import { Loader2, BookOpen, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORY_STYLES: Record<string, string> = {
    HR: 'bg-primary-100 text-primary-700',
    COMPLIANCE: 'bg-warning-100 text-warning-700',
    SAFETY: 'bg-danger-100 text-danger-600',
    FINANCE: 'bg-success-100 text-success-700',
    IT: 'bg-info-100 text-info-700',
    GENERAL: 'bg-neutral-100 text-neutral-600',
};

export function PolicyDocumentsScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = usePolicyDocuments();
    const policies = data?.data ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white">Policy Documents</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Company policies and guidelines</p>
            </div>

            {policies.length === 0 ? (
                <div className="text-center py-16">
                    <BookOpen className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Policy Documents</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">No policy documents have been published yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {policies.map((p: any) => (
                        <div key={p.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-semibold text-primary-950 dark:text-white">{p.title}</h3>
                                        {p.category && (
                                            <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', CATEGORY_STYLES[p.category?.toUpperCase()] ?? CATEGORY_STYLES.GENERAL)}>
                                                {p.category}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {p.version && <>v{p.version} &middot; </>}
                                        Published: {fmt.date(p.publishedAt ?? p.createdAt)}
                                    </p>
                                </div>
                                {p.fileUrl && (
                                    <R2Link fileKey={p.fileUrl} className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 border border-primary-200 rounded-lg hover:bg-primary-50 transition-colors">
                                        <ExternalLink className="w-3.5 h-3.5" /> View
                                    </R2Link>
                                )}
                            </div>
                            {p.description && <p className="text-sm text-neutral-600 dark:text-neutral-400">{p.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
