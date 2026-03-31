import { useState, useMemo } from 'react';
import { useMyLoans, useEssLoanPolicies, useApplyForLoan } from '@/features/company-admin/api';
import { Loader2, Landmark, X, Percent, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { showSuccess, showApiError } from '@/lib/toast';

const STATUS_STYLES: Record<string, string> = {
    PENDING: 'bg-warning-100 text-warning-700',
    APPROVED: 'bg-success-100 text-success-700',
    REJECTED: 'bg-danger-100 text-danger-600',
    ACTIVE: 'bg-success-100 text-success-700',
    CLOSED: 'bg-neutral-100 text-neutral-500',
    CANCELLED: 'bg-neutral-100 text-neutral-500',
    DRAFT: 'bg-info-100 text-info-700',
    SUBMITTED: 'bg-info-100 text-info-700',
    PAID: 'bg-success-100 text-success-700',
};

const formatCurrency = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v);

export function MyLoanScreen() {
    const { data: loansData, isLoading: loansLoading } = useMyLoans();
    const { data: policiesData, isLoading: policiesLoading } = useEssLoanPolicies();
    const applyMutation = useApplyForLoan();

    const loans = loansData?.data ?? [];
    const policies = policiesData?.data ?? [];

    const [applyPolicy, setApplyPolicy] = useState<any>(null);
    const [loanAmount, setLoanAmount] = useState('');
    const [tenure, setTenure] = useState('');
    const [reason, setReason] = useState('');

    const emi = useMemo(() => {
        if (!applyPolicy || !loanAmount || !tenure) return null;
        const P = parseFloat(loanAmount);
        const n = parseInt(tenure, 10);
        const annualRate = parseFloat(applyPolicy.interestRate ?? '0');
        if (!P || !n || n <= 0) return null;
        if (annualRate === 0) return Math.round(P / n);
        const r = annualRate / 12 / 100;
        return Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
    }, [applyPolicy, loanAmount, tenure]);

    function handleApply() {
        if (!applyPolicy || !loanAmount || !tenure) return;
        applyMutation.mutate(
            {
                loanPolicyId: applyPolicy.id,
                amount: parseFloat(loanAmount),
                tenureMonths: parseInt(tenure, 10),
                reason: reason.trim() || undefined,
            },
            {
                onSuccess: () => { showSuccess('Loan application submitted'); setApplyPolicy(null); setLoanAmount(''); setTenure(''); setReason(''); },
                onError: (err) => showApiError(err),
            },
        );
    }

    const isLoading = loansLoading || policiesLoading;
    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold text-primary-950 dark:text-white">Loans</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Browse loan policies and manage your applications</p>
            </div>

            {/* Loan Policies */}
            {policies.length > 0 && (
                <div className="space-y-3">
                    <h2 className="text-lg font-bold text-primary-950 dark:text-white">Available Loan Policies</h2>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {policies.map((p: any) => (
                            <div key={p.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                                <h3 className="font-semibold text-primary-950 dark:text-white mb-3">{p.name}</h3>
                                <div className="space-y-2 text-sm text-neutral-600 dark:text-neutral-400">
                                    {p.loanType && (
                                        <div className="flex items-center gap-2">
                                            <Landmark className="w-3.5 h-3.5 text-neutral-400" />
                                            <span>Type: {p.loanType}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-2">
                                        <IndianRupee className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Max: {formatCurrency(p.maxAmount ?? 0)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Percent className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Interest: {p.interestRate ?? 0}% p.a.</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                        <span>Max tenure: {p.maxTenureMonths ?? 0} months</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => { setApplyPolicy(p); setLoanAmount(''); setTenure(''); setReason(''); }}
                                    className="mt-4 w-full px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-colors"
                                >
                                    Apply
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Apply Modal */}
            {applyPolicy && (
                <div className="bg-white dark:bg-neutral-900 rounded-xl border border-primary-200 dark:border-primary-800 p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-primary-950 dark:text-white">Apply for {applyPolicy.name}</h3>
                        <button onClick={() => setApplyPolicy(null)}><X className="w-5 h-5 text-neutral-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                step="1"
                                min="1"
                                max={applyPolicy.maxAmount ?? undefined}
                                value={loanAmount}
                                onChange={(e) => setLoanAmount(e.target.value)}
                                placeholder={`Amount (max ${formatCurrency(applyPolicy.maxAmount ?? 0)})`}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm"
                            />
                            <input
                                type="number"
                                step="1"
                                min="1"
                                max={applyPolicy.maxTenureMonths ?? undefined}
                                value={tenure}
                                onChange={(e) => setTenure(e.target.value)}
                                placeholder={`Tenure in months (max ${applyPolicy.maxTenureMonths ?? 0})`}
                                className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm"
                            />
                        </div>
                        {emi !== null && (
                            <div className="bg-primary-50 dark:bg-primary-950/30 rounded-xl p-4 text-center">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-1">Estimated Monthly EMI</p>
                                <p className="text-2xl font-bold text-primary-700 dark:text-primary-400">{formatCurrency(emi)}</p>
                            </div>
                        )}
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Reason for loan (optional)"
                            className="w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2.5 text-sm resize-none"
                        />
                        <button
                            onClick={handleApply}
                            disabled={applyMutation.isPending || !loanAmount || !tenure}
                            className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-50"
                        >
                            {applyMutation.isPending ? 'Applying...' : 'Submit Application'}
                        </button>
                    </div>
                </div>
            )}

            {/* My Loan Applications */}
            <div className="space-y-3">
                <h2 className="text-lg font-bold text-primary-950 dark:text-white">My Applications</h2>
                {loans.length === 0 ? (
                    <div className="text-center py-12">
                        <Landmark className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Loan Applications</h3>
                        <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">You haven't applied for any loans yet.</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {loans.map((l: any) => (
                            <div key={l.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h3 className="font-semibold text-primary-950 dark:text-white">
                                            {l.loanPolicy?.name ?? l.policy?.name ?? 'Loan'}
                                        </h3>
                                        <p className="text-xs text-neutral-500 mt-0.5">{new Date(l.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', STATUS_STYLES[l.status] ?? STATUS_STYLES.PENDING)}>
                                        {l.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3 mt-3">
                                    <div>
                                        <p className="text-xs text-neutral-500">Amount</p>
                                        <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{formatCurrency(l.amount)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500">EMI</p>
                                        <p className="text-sm font-bold text-primary-700 dark:text-primary-400">{l.emiAmount ? formatCurrency(l.emiAmount) : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-neutral-500">Tenure</p>
                                        <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">{l.tenureMonths ?? '-'} months</p>
                                    </div>
                                </div>
                                {l.reason && <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">{l.reason}</p>}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
