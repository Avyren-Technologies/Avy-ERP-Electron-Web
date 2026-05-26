import { cn } from '@/lib/utils';

interface BomIssueCounterProps {
    bomRequired: number;
    cumulativeIssued: number;
    remaining: number;
    className?: string;
    compact?: boolean;
}

export function BomIssueCounter({
    bomRequired,
    cumulativeIssued,
    remaining,
    className,
    compact = false,
}: BomIssueCounterProps) {
    const total = bomRequired || 1;
    const issuedPct = Math.min((cumulativeIssued / total) * 100, 100);
    const isOverIssued = cumulativeIssued > bomRequired;

    return (
        <div className={cn('space-y-1', className)}>
            {/* Progress bar */}
            <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                <div
                    className={cn(
                        'h-full rounded-full transition-all duration-300',
                        isOverIssued ? 'bg-amber-500' : 'bg-emerald-500',
                    )}
                    style={{ width: `${Math.min(issuedPct, 100)}%` }}
                />
            </div>

            {/* Labels */}
            {!compact ? (
                <div className="flex items-center justify-between text-[10px] text-neutral-500">
                    <span>
                        <span className="font-semibold text-emerald-600">{Number(cumulativeIssued).toLocaleString()}</span>
                        {' / '}
                        <span className="font-medium">{Number(bomRequired).toLocaleString()}</span>
                        {' issued'}
                    </span>
                    <span className={cn(
                        'font-semibold',
                        remaining > 0 ? 'text-neutral-600' : isOverIssued ? 'text-amber-600' : 'text-emerald-600',
                    )}>
                        {remaining > 0
                            ? `${Number(remaining).toLocaleString()} remaining`
                            : isOverIssued
                                ? `Over-issued by ${Number(cumulativeIssued - bomRequired).toLocaleString()}`
                                : 'Fully issued'}
                    </span>
                </div>
            ) : (
                <p className="text-[10px] text-neutral-500">
                    <span className="font-semibold text-emerald-600">{Number(cumulativeIssued).toLocaleString()}</span>
                    {' / '}
                    {Number(bomRequired).toLocaleString()}
                </p>
            )}
        </div>
    );
}
