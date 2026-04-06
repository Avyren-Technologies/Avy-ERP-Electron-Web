import { useState } from 'react';
import { useMyTraining } from '@/features/company-admin/api';
import { useSubmitEssFeedback } from '@/features/company-admin/api/use-recruitment-mutations';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { Loader2, GraduationCap, MessageSquare, X, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    Nominated: 'bg-info-100 text-info-700',
    Approved: 'bg-primary-100 text-primary-700',
    'In Progress': 'bg-warning-100 text-warning-700',
    Completed: 'bg-success-100 text-success-700',
    Cancelled: 'bg-danger-100 text-danger-600',
};

const FEEDBACK_FIELDS = [
    { key: 'contentRelevance', label: 'Content Relevance' },
    { key: 'trainerEffectiveness', label: 'Trainer Effectiveness' },
    { key: 'overallSatisfaction', label: 'Overall Satisfaction' },
    { key: 'knowledgeGain', label: 'Knowledge Gain' },
    { key: 'practicalApplicability', label: 'Practical Applicability' },
] as const;

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    return (
        <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className="p-0.5 transition-colors"
                >
                    <Star
                        size={18}
                        className={cn(
                            n <= value
                                ? 'fill-warning-400 text-warning-400'
                                : 'text-neutral-300 dark:text-neutral-600'
                        )}
                    />
                </button>
            ))}
        </div>
    );
}

const EMPTY_FEEDBACK = {
    contentRelevance: 0,
    trainerEffectiveness: 0,
    overallSatisfaction: 0,
    knowledgeGain: 0,
    practicalApplicability: 0,
    comments: '',
    improvementSuggestions: '',
};

export function MyTrainingScreen() {
    const fmt = useCompanyFormatter();
    const { data, isLoading } = useMyTraining();
    const nominations = data?.data ?? [];
    const submitFeedback = useSubmitEssFeedback();

    const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
    const [feedbackNominationId, setFeedbackNominationId] = useState('');
    const [feedbackForm, setFeedbackForm] = useState({ ...EMPTY_FEEDBACK });

    const openFeedback = (nominationId: string) => {
        setFeedbackNominationId(nominationId);
        setFeedbackForm({ ...EMPTY_FEEDBACK });
        setFeedbackModalOpen(true);
    };

    const handleSubmitFeedback = async () => {
        try {
            await submitFeedback.mutateAsync({
                nominationId: feedbackNominationId,
                data: {
                    type: 'PARTICIPANT_FEEDBACK',
                    contentRelevance: feedbackForm.contentRelevance,
                    trainerEffectiveness: feedbackForm.trainerEffectiveness,
                    overallSatisfaction: feedbackForm.overallSatisfaction,
                    knowledgeGain: feedbackForm.knowledgeGain,
                    practicalApplicability: feedbackForm.practicalApplicability,
                    comments: feedbackForm.comments || undefined,
                    improvementSuggestions: feedbackForm.improvementSuggestions || undefined,
                },
            });
            showSuccess('Feedback submitted successfully');
            setFeedbackModalOpen(false);
        } catch (err) {
            showApiError(err);
        }
    };

    const updateField = (key: string, value: any) => setFeedbackForm((p) => ({ ...p, [key]: value }));

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
                                <div className="flex items-center gap-2">
                                    <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[n.status] ?? STATUS_STYLES.Nominated)}>{n.status}</span>
                                    {n.status === 'Completed' && !n.evaluation && (
                                        <button
                                            onClick={() => openFeedback(n.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-accent-50 hover:bg-accent-100 dark:bg-accent-900/30 dark:hover:bg-accent-900/50 text-accent-700 dark:text-accent-400 rounded-lg text-xs font-bold transition-colors"
                                        >
                                            <MessageSquare size={12} />
                                            Give Feedback
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-4 text-xs text-neutral-500">
                                {n.training?.duration && <span>Duration: {n.training.duration}h</span>}
                                {n.batchDate && <span>Batch: {fmt.date(n.batchDate)}</span>}
                                {n.score != null && <span>Score: {n.score}</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Feedback Modal ── */}
            {feedbackModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-lg font-bold text-primary-950 dark:text-white">Training Feedback</h2>
                            <button onClick={() => setFeedbackModalOpen(false)} className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 transition-colors"><X size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1 space-y-5">
                            {FEEDBACK_FIELDS.map((field) => (
                                <div key={field.key} className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-primary-950 dark:text-white">{field.label}</label>
                                    <StarRating
                                        value={(feedbackForm as any)[field.key]}
                                        onChange={(v) => updateField(field.key, v)}
                                    />
                                </div>
                            ))}
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Comments</label>
                                <textarea
                                    value={feedbackForm.comments}
                                    onChange={(e) => updateField('comments', e.target.value)}
                                    rows={3}
                                    placeholder="Share your thoughts about the training..."
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Improvement Suggestions</label>
                                <textarea
                                    value={feedbackForm.improvementSuggestions}
                                    onChange={(e) => updateField('improvementSuggestions', e.target.value)}
                                    rows={2}
                                    placeholder="How could this training be improved?"
                                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all resize-none"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 px-6 py-4 border-t border-neutral-100 dark:border-neutral-800">
                            <button onClick={() => setFeedbackModalOpen(false)} className="flex-1 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 text-sm font-bold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                            <button
                                onClick={handleSubmitFeedback}
                                disabled={submitFeedback.isPending || FEEDBACK_FIELDS.some((f) => (feedbackForm as any)[f.key] === 0)}
                                className="flex-1 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {submitFeedback.isPending && <Loader2 size={14} className="animate-spin" />}
                                {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
