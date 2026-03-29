import { useMyForm16 } from '@/features/company-admin/api';
import { Loader2, FileText } from 'lucide-react';

export function MyForm16Screen() {
    const { data, isLoading } = useMyForm16();
    const payslips = data?.data?.payslips ?? [];

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    // Group by financial year
    const byYear: Record<string, any[]> = {};
    for (const p of payslips) {
        const fy = p.month >= 4 ? `${p.year}-${(p.year + 1).toString().slice(-2)}` : `${p.year - 1}-${p.year.toString().slice(-2)}`;
        if (!byYear[fy]) byYear[fy] = [];
        byYear[fy].push(p);
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white">Form 16</h1>
                <p className="text-neutral-500 dark:text-neutral-400 mt-1">Your annual tax deduction certificates</p>
            </div>

            {payslips.length === 0 ? (
                <div className="text-center py-16">
                    <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Tax Records</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">Form 16 data will appear after payroll processing.</p>
                </div>
            ) : (
                Object.entries(byYear).sort(([a], [b]) => b.localeCompare(a)).map(([fy, slips]) => {
                    const totalGross = slips.reduce((s: number, p: any) => s + (p.grossEarnings ?? 0), 0);
                    const totalTds = slips.reduce((s: number, p: any) => s + (p.tdsAmount ?? 0), 0);
                    const totalNet = slips.reduce((s: number, p: any) => s + (p.netPay ?? 0), 0);
                    return (
                        <div key={fy} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <h3 className="font-bold text-primary-950 dark:text-white mb-3">FY {fy}</h3>
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Gross Earnings</p>
                                    <p className="font-bold text-primary-950 dark:text-white">&#x20B9;{totalGross.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">TDS Deducted</p>
                                    <p className="font-bold text-danger-600">&#x20B9;{totalTds.toLocaleString('en-IN')}</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800">
                                    <p className="text-xs text-neutral-500 mb-1">Net Pay</p>
                                    <p className="font-bold text-success-600">&#x20B9;{totalNet.toLocaleString('en-IN')}</p>
                                </div>
                            </div>
                            <p className="text-xs text-neutral-400">{slips.length} payslip(s) for this financial year</p>
                        </div>
                    );
                })
            )}
        </div>
    );
}
