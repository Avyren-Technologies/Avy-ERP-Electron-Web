import { useState } from 'react';
import { useCompanyFormatter } from '@/hooks/useCompanyFormatter';
import { useMyHolidays } from '@/features/company-admin/api';
import { Loader2, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TYPE_STYLES: Record<string, string> = {
    NATIONAL: 'bg-info-100 text-info-700',
    REGIONAL: 'bg-purple-100 text-purple-700',
    COMPANY: 'bg-success-100 text-success-700',
    OPTIONAL: 'bg-warning-100 text-warning-700',
    RESTRICTED: 'bg-danger-100 text-danger-600',
};

export function MyHolidaysScreen() {
    const fmt = useCompanyFormatter();
    const [year, setYear] = useState(new Date().getFullYear());
    const { data, isLoading } = useMyHolidays(year);
    const holidays = (data?.data ?? []).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary-950 dark:text-white">Holiday Calendar</h1>
                    <p className="text-neutral-500 dark:text-neutral-400 mt-1">Company holidays for {year}</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => setYear(y => y - 1)} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <ChevronLeft className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                    <span className="text-sm font-bold text-primary-950 dark:text-white min-w-[4rem] text-center">{year}</span>
                    <button onClick={() => setYear(y => y + 1)} className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
                        <ChevronRight className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                    </button>
                </div>
            </div>

            {holidays.length === 0 ? (
                <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-neutral-300 dark:text-neutral-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-neutral-600 dark:text-neutral-400">No Holidays</h3>
                    <p className="text-neutral-400 dark:text-neutral-500 text-sm mt-1">No holidays found for {year}.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {holidays.map((h: any) => (
                        <div key={h.id} className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <h3 className="font-semibold text-primary-950 dark:text-white">{h.name}</h3>
                                    <p className="text-xs text-neutral-500 mt-0.5">
                                        {fmt.date(h.date)}
                                    </p>
                                </div>
                                <span className={cn('px-2 py-0.5 text-[10px] font-bold uppercase rounded-full', TYPE_STYLES[h.type] ?? 'bg-neutral-100 text-neutral-500')}>
                                    {h.type}
                                </span>
                            </div>
                            {h.description && <p className="text-sm text-neutral-600 dark:text-neutral-400">{h.description}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
