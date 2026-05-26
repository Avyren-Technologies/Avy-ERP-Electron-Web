import { cn } from '@/lib/utils';
import { STOCK_STATUS_CONFIG, TRANSACTION_STATUS_CONFIG } from './inventory-status-colors';

export function InventoryStatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
    const config = STOCK_STATUS_CONFIG[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: status };
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
            config.bg, config.text, config.border,
            size === 'sm' ? 'text-[10px]' : 'text-xs',
        )}>
            {config.label}
        </span>
    );
}

export function TransactionStatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) {
    const config = TRANSACTION_STATUS_CONFIG[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', label: status };
    return (
        <span className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium',
            config.bg, config.text, config.border,
            size === 'sm' ? 'text-[10px]' : 'text-xs',
        )}>
            {config.label}
        </span>
    );
}
