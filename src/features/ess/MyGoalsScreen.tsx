import { useMyGoals } from '@/features/company-admin/api';
import { Loader2, Target, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-neutral-100 text-neutral-600',
    ACTIVE: 'bg-primary-100 text-primary-700',
    COMPLETED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-danger-100 text-danger-600',
};

export function MyGoalsScreen() {
    const { data, isLoading } = useMyGoals();
    const goals = data?.data ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Goals</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Your assigned goals and OKRs</p>
            </div>

            {goals.length === 0 ? (
                <div className="text-center py-16">
                    <Target className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Goals Assigned</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Goals will appear here when assigned by your manager.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {goals.map((goal: any) => (
                        <div key={goal.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                        <Flag className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-primary-950 dark:text-white">{goal.title}</h3>
                                        {goal.cycle?.name && <p className="text-xs text-neutral-500">{goal.cycle.name}</p>}
                                    </div>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[goal.status] ?? STATUS_STYLES.DRAFT)}>
                                    {goal.status}
                                </span>
                            </div>
                            {goal.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">{goal.description}</p>}
                            <div className="flex gap-4 text-xs text-neutral-500">
                                {goal.weightage != null && <span>Weight: {goal.weightage}%</span>}
                                {goal.kpiMetric && <span>KPI: {goal.kpiMetric}</span>}
                                {goal.targetValue && <span>Target: {goal.targetValue}</span>}
                                {goal.achievedValue && <span>Achieved: {goal.achievedValue}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
