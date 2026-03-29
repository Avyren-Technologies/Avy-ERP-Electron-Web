import { useMyTraining } from '@/features/company-admin/api';
import { Loader2, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
    Nominated: 'bg-info-100 text-info-700',
    Approved: 'bg-primary-100 text-primary-700',
    'In Progress': 'bg-warning-100 text-warning-700',
    Completed: 'bg-success-100 text-success-700',
    Cancelled: 'bg-danger-100 text-danger-600',
};

export function MyTrainingScreen() {
    const { data, isLoading } = useMyTraining();
    const nominations = data?.data ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Training</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Your training nominations and courses</p>
            </div>

            {nominations.length === 0 ? (
                <div className="text-center py-16">
                    <GraduationCap className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Training</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't been nominated for any training yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {nominations.map((n: any) => (
                        <div key={n.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-accent-50 dark:bg-accent-900/30 flex items-center justify-center">
                                        <GraduationCap className="w-5 h-5 text-accent-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-primary-950 dark:text-white">{n.training?.name ?? n.course?.name ?? 'Training'}</h3>
                                        <p className="text-xs text-neutral-500">{n.training?.type ?? n.course?.category ?? ''} {n.training?.mode ? `\u2022 ${n.training.mode}` : ''}</p>
                                    </div>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[n.status] ?? STATUS_STYLES.Nominated)}>{n.status}</span>
                            </div>
                            <div className="flex gap-4 text-xs text-neutral-500">
                                {n.training?.duration && <span>Duration: {n.training.duration}h</span>}
                                {n.batchDate && <span>Batch: {new Date(n.batchDate).toLocaleDateString()}</span>}
                                {n.score != null && <span>Score: {n.score}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
