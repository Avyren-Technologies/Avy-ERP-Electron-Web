// ============================================================
// NoPermissionScreen — Displayed when user lacks the required role/permission
// ============================================================
import { useNavigate } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoPermissionScreenProps {
    /** Override the default title. */
    title?: string;
    /** Override the default description. */
    description?: string;
    /** Label for the primary back button. Defaults to 'Go Back'. */
    backLabel?: string;
    /** Optional custom class applied to the wrapper. */
    className?: string;
}

export function NoPermissionScreen({
    title = "Access Restricted",
    description = "You don't have permission to view this page. Contact your administrator if you believe this is a mistake.",
    backLabel = "Go Back",
    className,
}: NoPermissionScreenProps) {
    const navigate = useNavigate();

    return (
        <div className={cn(
            'min-h-full flex items-center justify-center px-6 py-16',
            className
        )}>
            <div className="max-w-md w-full text-center">
                {/* Icon */}
                <div className="flex justify-center mb-8">
                    <div className="relative">
                        {/* Glow ring */}
                        <div className="absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/30 blur-2xl scale-150 opacity-60" />
                        <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-900/40 dark:to-accent-900/40 border border-primary-100 dark:border-primary-800 flex items-center justify-center shadow-lg shadow-primary-100/50 dark:shadow-primary-900/20">
                            <ShieldX
                                size={40}
                                strokeWidth={1.5}
                                className="text-primary-500 dark:text-primary-400"
                            />
                        </div>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-2xl font-bold text-primary-950 dark:text-white mb-3 tracking-tight">
                    {title}
                </h1>

                {/* Description */}
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed mb-8 max-w-xs mx-auto">
                    {description}
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                        onClick={() => navigate(-1 as any)}
                        className={cn(
                            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
                            'border border-neutral-200 dark:border-neutral-700',
                            'text-neutral-700 dark:text-neutral-300',
                            'hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors'
                        )}
                    >
                        <ArrowLeft size={15} />
                        {backLabel}
                    </button>
                    <button
                        onClick={() => navigate('/app/dashboard')}
                        className={cn(
                            'flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold',
                            'bg-primary-600 hover:bg-primary-700 text-white transition-colors',
                            'shadow-sm shadow-primary-600/30'
                        )}
                    >
                        <Home size={15} />
                        Go to Dashboard
                    </button>
                </div>

                {/* Subtle divider */}
                <div className="mt-10 pt-6 border-t border-neutral-100 dark:border-neutral-800">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                        If you need access, please contact your{' '}
                        <span className="font-semibold text-primary-600 dark:text-primary-400">
                            Super Administrator
                        </span>
                        .
                    </p>
                </div>
            </div>
        </div>
    );
}
