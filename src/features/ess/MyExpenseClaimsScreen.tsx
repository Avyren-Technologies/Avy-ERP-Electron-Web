import { useState } from 'react';
import { useMyExpenseClaims, useCreateMyExpenseClaim, useSubmitMyExpenseClaim } from '@/features/company-admin/api';
import { Loader2, Receipt, Plus, X, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    DRAFT: 'bg-info-100 text-info-700',
    SUBMITTED: 'bg-info-100 text-info-700',
    PENDING: 'bg-warning-100 text-warning-700',
    APPROVED: 'bg-success-100 text-success-700',
    REJECTED: 'bg-danger-100 text-danger-600',
    PAID: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-neutral-100 text-neutral-500',
};

const CATEGORY_STYLES: Record<string, string> = {
    TRAVEL: 'bg-blue-100 text-blue-700',
    MEDICAL: 'bg-red-100 text-red-700',
    INTERNET: 'bg-cyan-100 text-cyan-700',
    FUEL: 'bg-orange-100 text-orange-700',
    UNIFORM: 'bg-purple-100 text-purple-700',
    BUSINESS: 'bg-indigo-100 text-indigo-700',
    OTHER: 'bg-neutral-100 text-neutral-600',
};

const EXPENSE_CATEGORIES = ['TRAVEL', 'MEDICAL', 'INTERNET', 'FUEL', 'UNIFORM', 'BUSINESS', 'OTHER'] as const;

export function MyExpenseClaimsScreen() {
    const { data, isLoading } = useMyExpenseClaims();
    const claims = data?.data ?? [];
    const createMutation = useCreateMyExpenseClaim();
    const submitMutation = useSubmitMyExpenseClaim();

    const [showForm, setShowForm] = useState(false);
    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tripDate, setTripDate] = useState('');

    function resetForm() {
        setTitle('');
        setAmount('');
        setCategory('');
        setDescription('');
        setTripDate('');
        setShowForm(false);
    }

    function handleCreate() {
        if (!title.trim() || !amount || !category) return;
        createMutation.mutate(
            {
                title: title.trim(),
                amount: parseFloat(amount),
                category,
                description: description.trim() || undefined,
                tripDate: tripDate || undefined,
            },
            {
                onSuccess: () => { showSuccess('Expense claim created'); resetForm(); },
                onError: (err) => showApiError(err),
            },
        );
    }

    function handleSubmit(id: string) {
        submitMutation.mutate(id, {
            onSuccess: () => showSuccess('Claim submitted for approval'),
            onError: (err) => showApiError(err),
        });
    }

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">My Expense Claims</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Submit and track expense reimbursements</p>
                </div>
                <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors">
                    <Plus className="w-4 h-4" /> New Claim
                </button>
            </div>

            {showForm && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">New Expense Claim</h3>
                        <button onClick={() => resetForm()}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Claim title" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        <div className="grid grid-cols-2 gap-4">
                            <input type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (₹)" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm">
                                <option value="">Select Category</option>
                                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <input type="date" value={tripDate} onChange={(e) => setTripDate(e.target.value)} className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm" />
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Description (optional)" className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm resize-none" />
                        <button onClick={handleCreate} disabled={createMutation.isPending || !title.trim() || !amount || !category} className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50">
                            {createMutation.isPending ? 'Creating...' : 'Create Claim'}
                        </button>
                    </div>
                </div>
            )}

            {claims.length === 0 && !showForm ? (
                <div className="text-center py-16">
                    <Receipt className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Expense Claims</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't submitted any expense claims yet.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {claims.map((c: any) => (
                        <div key={c.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">{c.title}</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">{new Date(c.createdAt).toLocaleDateString()}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', CATEGORY_STYLES[c.category] ?? CATEGORY_STYLES.OTHER)}>
                                        {c.category}
                                    </span>
                                    <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[c.status] ?? STATUS_STYLES.PENDING)}>
                                        {c.status}
                                    </span>
                                </div>
                            </div>
                            <p className="text-lg font-bold text-primary-700 dark:text-primary-400">
                                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(c.amount)}
                            </p>
                            {c.description && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{c.description}</p>}
                            {c.tripDate && <p className="text-xs text-neutral-500 mt-1">Trip date: {new Date(c.tripDate).toLocaleDateString()}</p>}
                            {c.status === 'DRAFT' && (
                                <button
                                    onClick={() => handleSubmit(c.id)}
                                    disabled={submitMutation.isPending}
                                    className="mt-3 flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-50"
                                >
                                    <Send className="w-3 h-3" />
                                    {submitMutation.isPending ? 'Submitting...' : 'Submit'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
