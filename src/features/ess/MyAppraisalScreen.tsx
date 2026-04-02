import { useState } from 'react';
import { useMyAppraisals, useMyAppraisalEntry, useSubmitEssSelfReview } from '@/features/company-admin/api';
import { showSuccess, showApiError } from '@/lib/toast';
import { cn } from '@/lib/utils';
import { Loader2, ClipboardCheck, ChevronRight, Star, X, Target, Send } from 'lucide-react';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Pending' },
    SELF_REVIEW: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Self Review' },
    MANAGER_REVIEW: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Manager Review' },
    SKIP_LEVEL: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Skip Level' },
    HR_REVIEW: { bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'HR Review' },
    PUBLISHED: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' },
    CLOSED: { bg: 'bg-neutral-100', text: 'text-neutral-600', label: 'Closed' },
};

function StatusBadge({ status }: { status: string }) {
    const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
    return (
        <span className={cn('px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full', style.bg, style.text)}>
            {style.label}
        </span>
    );
}

function RatingDisplay({ label, value, scale }: { label: string; value?: number | null; scale?: number }) {
    if (value == null) return null;
    return (
        <div className="flex items-center gap-1.5 text-sm">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-neutral-500">{label}:</span>
            <span className="font-semibold text-primary-950 dark:text-white">{value}{scale ? `/${scale}` : ''}</span>
        </div>
    );
}

// ── Detail Modal ──

function AppraisalDetail({ entryId, onClose }: { entryId: string; onClose: () => void }) {
    const { data, isLoading } = useMyAppraisalEntry(entryId);
    const submitMutation = useSubmitEssSelfReview();
    const entry = data?.data;

    const [selfRating, setSelfRating] = useState('');
    const [selfComments, setSelfComments] = useState('');
    const [goalRatings, setGoalRatings] = useState<Record<string, { selfRating: string; achievedValue: string }>>({});

    const isPending = entry?.status === 'PENDING';
    const isPublished = entry?.status === 'PUBLISHED';
    const ratingScale = entry?.cycle?.ratingScale ?? entry?.ratingScale ?? 5;
    const goals = entry?.goals ?? entry?.goalRatings ?? [];

    const handleGoalChange = (goalId: string, field: 'selfRating' | 'achievedValue', value: string) => {
        setGoalRatings(prev => ({
            ...prev,
            [goalId]: { ...prev[goalId], [field]: value },
        }));
    };

    const handleSubmit = () => {
        const payload: any = {
            selfRating: Number(selfRating),
            selfComments,
        };

        if (goals.length > 0) {
            payload.goalRatings = goals.map((g: any) => ({
                goalId: g.goalId ?? g.id,
                selfRating: Number(goalRatings[g.goalId ?? g.id]?.selfRating || 0),
                achievedValue: goalRatings[g.goalId ?? g.id]?.achievedValue || undefined,
            }));
        }

        submitMutation.mutate(
            { id: entryId, data: payload },
            {
                onSuccess: () => {
                    showSuccess('Self-review submitted successfully');
                    onClose();
                },
                onError: (err) => showApiError(err),
            },
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Appraisal Details</h2>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <X className="w-5 h-5 text-neutral-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="w-7 h-7 animate-spin text-primary-500" />
                        </div>
                    ) : !entry ? (
                        <p className="text-neutral-500 text-center py-12">Entry not found.</p>
                    ) : (
                        <>
                            {/* Cycle Info */}
                            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="font-semibold text-primary-950 dark:text-white">
                                            {entry.cycle?.name ?? 'Appraisal Cycle'}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">Rating Scale: 1 - {ratingScale}</p>
                                    </div>
                                    <StatusBadge status={entry.status} />
                                </div>
                            </div>

                            {/* Ratings Summary (if submitted or published) */}
                            {!isPending && (
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">Self Rating</p>
                                        <p className="text-lg font-bold text-primary-600">{entry.selfRating ?? '-'}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">Manager Rating</p>
                                        <p className="text-lg font-bold text-violet-600">{entry.managerRating ?? '-'}</p>
                                    </div>
                                    <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-3 text-center">
                                        <p className="text-xs text-neutral-500 mb-1">Final Rating</p>
                                        <p className="text-lg font-bold text-emerald-600">{entry.finalRating ?? '-'}</p>
                                    </div>
                                </div>
                            )}

                            {/* Comments (when published) */}
                            {isPublished && (
                                <div className="space-y-3">
                                    {entry.selfComments && (
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500 mb-1">Your Comments</p>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">{entry.selfComments}</p>
                                        </div>
                                    )}
                                    {entry.managerComments && (
                                        <div>
                                            <p className="text-xs font-medium text-neutral-500 mb-1">Manager Comments</p>
                                            <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">{entry.managerComments}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Self-review comments (read-only after submission, before publish) */}
                            {!isPending && !isPublished && entry.selfComments && (
                                <div>
                                    <p className="text-xs font-medium text-neutral-500 mb-1">Your Comments</p>
                                    <p className="text-sm text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800 rounded-lg p-3">{entry.selfComments}</p>
                                </div>
                            )}

                            {/* Goals */}
                            {goals.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-primary-950 dark:text-white mb-3">Goals</h4>
                                    <div className="space-y-3">
                                        {goals.map((goal: any) => {
                                            const gId = goal.goalId ?? goal.id;
                                            return (
                                                <div key={gId} className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 space-y-2">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Target className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                                                            <div>
                                                                <p className="font-medium text-sm text-primary-950 dark:text-white">{goal.title ?? goal.goal?.title ?? 'Goal'}</p>
                                                                {(goal.weightage != null || goal.goal?.weightage != null) && (
                                                                    <p className="text-xs text-neutral-500">Weight: {goal.weightage ?? goal.goal?.weightage}%</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-4 text-xs text-neutral-500">
                                                        {(goal.targetValue ?? goal.goal?.targetValue) && <span>Target: {goal.targetValue ?? goal.goal?.targetValue}</span>}
                                                        {goal.achievedValue && <span>Achieved: {goal.achievedValue}</span>}
                                                        {goal.selfRating != null && <span>Self: {goal.selfRating}/{ratingScale}</span>}
                                                    </div>

                                                    {/* Goal self-review inputs (PENDING only) */}
                                                    {isPending && (
                                                        <div className="grid grid-cols-2 gap-3 pt-2">
                                                            <div>
                                                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Rating (1-{ratingScale})</label>
                                                                <input
                                                                    type="number"
                                                                    min={1}
                                                                    max={ratingScale}
                                                                    value={goalRatings[gId]?.selfRating ?? ''}
                                                                    onChange={e => handleGoalChange(gId, 'selfRating', e.target.value)}
                                                                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Achieved Value</label>
                                                                <input
                                                                    type="text"
                                                                    value={goalRatings[gId]?.achievedValue ?? ''}
                                                                    onChange={e => handleGoalChange(gId, 'achievedValue', e.target.value)}
                                                                    className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-1.5 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Self-Review Form (PENDING only) */}
                            {isPending && (
                                <div className="space-y-4 border-t border-neutral-200 dark:border-neutral-800 pt-5">
                                    <h4 className="text-sm font-semibold text-primary-950 dark:text-white">Submit Self-Review</h4>
                                    <div>
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Overall Self Rating (1-{ratingScale})
                                        </label>
                                        <input
                                            type="number"
                                            min={1}
                                            max={ratingScale}
                                            value={selfRating}
                                            onChange={e => setSelfRating(e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                                            placeholder={`Enter rating (1-${ratingScale})`}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Comments</label>
                                        <textarea
                                            value={selfComments}
                                            onChange={e => setSelfComments(e.target.value)}
                                            rows={3}
                                            className="mt-1 w-full rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none resize-none"
                                            placeholder="Share your self-assessment comments..."
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                {isPending && entry && (
                    <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!selfRating || submitMutation.isPending}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            {submitMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                            Submit Review
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main Screen ──

export function MyAppraisalScreen() {
    const { data, isLoading } = useMyAppraisals();
    const entries = data?.data ?? [];
    const [selectedId, setSelectedId] = useState<string | null>(null);

    if (isLoading) {
        return (
            <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white">My Appraisal</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">View your appraisal entries and submit self-reviews</p>
            </div>

            {entries.length === 0 ? (
                <div className="text-center py-16">
                    <ClipboardCheck className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Appraisal Entries Found</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Appraisal entries will appear here when a cycle is activated.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {entries.map((entry: any) => (
                        <button
                            key={entry.id}
                            onClick={() => setSelectedId(entry.id)}
                            className="w-full text-left bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-700 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                        <ClipboardCheck className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-primary-950 dark:text-white">
                                            {entry.cycle?.name ?? 'Appraisal'}
                                        </h3>
                                        {entry.cycle?.startDate && (
                                            <p className="text-xs text-neutral-500 mt-0.5">
                                                {new Date(entry.cycle.startDate).toLocaleDateString()} - {new Date(entry.cycle.endDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <StatusBadge status={entry.status} />
                                    <ChevronRight className="w-4 h-4 text-neutral-400" />
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-4">
                                <RatingDisplay label="Self" value={entry.selfRating} scale={entry.cycle?.ratingScale} />
                                <RatingDisplay label="Manager" value={entry.managerRating} scale={entry.cycle?.ratingScale} />
                                <RatingDisplay label="Final" value={entry.finalRating} scale={entry.cycle?.ratingScale} />
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {selectedId && (
                <AppraisalDetail
                    entryId={selectedId}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}
