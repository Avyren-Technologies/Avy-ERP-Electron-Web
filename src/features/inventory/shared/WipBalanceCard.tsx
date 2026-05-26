import { cn } from '@/lib/utils';

interface WipItem {
    label: string;
    qty: number;
    color?: string;
}

interface WipBalanceCardProps {
    partName?: string;
    partNumber?: string;
    items: WipItem[];
    totalQty?: number;
    freeToAllocate?: number;
    uom?: string;
    className?: string;
}

const DEFAULT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'Available in Store': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    'In Production / WIP': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    Reserved: { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200' },
    Total: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
    'Free to Allocate': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
};

export function WipBalanceCard({
    partName,
    partNumber,
    items,
    totalQty,
    freeToAllocate,
    uom,
    className,
}: WipBalanceCardProps) {
    const total = totalQty ?? items.reduce((sum, b) => sum + b.qty, 0);

    return (
        <div className={cn(
            'bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200/60 dark:border-neutral-800 p-4',
            className,
        )}>
            {(partName || partNumber) && (
                <div className="mb-3">
                    {partNumber && (
                        <p className="text-[10px] font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                            {partNumber}
                        </p>
                    )}
                    {partName && (
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                            {partName}
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {items.map((item) => {
                    const colors = DEFAULT_COLORS[item.label] || {
                        bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200',
                    };
                    return (
                        <div
                            key={item.label}
                            className={cn('rounded-lg border px-3 py-2', colors.bg, colors.border)}
                        >
                            <p className={cn('text-[10px] font-medium', colors.text)}>
                                {item.label}
                            </p>
                            <p className={cn('text-lg font-bold', colors.text)}>
                                {Number(item.qty).toLocaleString()}
                            </p>
                            {uom && <p className="text-[10px] text-neutral-400">{uom}</p>}
                        </div>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Total</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {Number(total).toLocaleString()}{uom ? ` ${uom}` : ''}
                </span>
            </div>
            {freeToAllocate !== undefined && (
                <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-medium text-teal-600">Free to Allocate</span>
                    <span className="text-sm font-bold text-teal-700">
                        {Number(freeToAllocate).toLocaleString()}{uom ? ` ${uom}` : ''}
                    </span>
                </div>
            )}
        </div>
    );
}
