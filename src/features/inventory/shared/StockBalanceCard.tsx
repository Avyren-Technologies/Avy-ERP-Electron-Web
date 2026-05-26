import { cn } from '@/lib/utils';
import { STOCK_STATUS_CONFIG } from './inventory-status-colors';

interface BalanceItem {
    status: string;
    qty: number;
}

interface StockBalanceCardProps {
    partName?: string;
    partNumber?: string;
    balances: BalanceItem[];
    totalQty?: number;
    uom?: string;
    className?: string;
}

const STATUS_ORDER = ['AVAILABLE', 'RESERVED', 'QC_HOLD', 'BLOCKED', 'IN_TRANSIT', 'QUARANTINE', 'EXPIRED'];

export function StockBalanceCard({ partName, partNumber, balances, totalQty, uom, className }: StockBalanceCardProps) {
    const total = totalQty ?? balances.reduce((sum, b) => sum + b.qty, 0);

    const ordered = STATUS_ORDER
        .map((s) => {
            const found = balances.find((b) => b.status === s);
            return found ? found : { status: s, qty: 0 };
        })
        .filter((b) => b.qty > 0 || b.status === 'AVAILABLE');

    // Include any statuses not in the predefined order
    const extra = balances.filter((b) => !STATUS_ORDER.includes(b.status) && b.qty > 0);

    const allItems = [...ordered, ...extra];

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
                {allItems.map((item) => {
                    const config = STOCK_STATUS_CONFIG[item.status] || {
                        bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: item.status,
                    };
                    return (
                        <div
                            key={item.status}
                            className={cn('rounded-lg border px-3 py-2', config.bg, config.border)}
                        >
                            <p className={cn('text-[10px] font-medium', config.text)}>
                                {config.label}
                            </p>
                            <p className={cn('text-lg font-bold', config.text)}>
                                {Number(item.qty).toLocaleString()}
                            </p>
                            {uom && (
                                <p className="text-[10px] text-neutral-400">{uom}</p>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Total */}
            <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-500">Total on Hand</span>
                <span className="text-sm font-bold text-neutral-900 dark:text-white">
                    {Number(total).toLocaleString()}{uom ? ` ${uom}` : ''}
                </span>
            </div>
        </div>
    );
}
