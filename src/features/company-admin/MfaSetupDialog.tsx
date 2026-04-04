import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Shield, Copy, Check, X, Loader2 } from 'lucide-react';
import { authApi } from '@/lib/api/auth';
import type { AuthUser } from '@/lib/api/auth';
import { showApiError, showInfo, showSuccess } from '@/lib/toast';
import { useAuthStore } from '@/store/useAuthStore';

interface MfaSetupDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const CODE_LENGTH = 6;

export function MfaSetupDialog({ open, onClose, onSuccess }: MfaSetupDialogProps) {
    const [step, setStep] = useState<'setup' | 'confirm' | 'done'>('setup');
    const [setupData, setSetupData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const [copied, setCopied] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const setupMutation = useMutation({
        mutationFn: () => authApi.setupMfa(),
        onSuccess: (response) => {
            if (response.success && response.data) {
                setSetupData({
                    secret: response.data.secret,
                    qrCodeDataUrl: response.data.qrCodeDataUrl,
                });
                setStep('confirm');
            }
        },
        onError: (err) => {
            const code =
                err &&
                typeof err === 'object' &&
                'response' in err &&
                (err as { response?: { data?: { code?: string } } }).response?.data?.code;
            if (code === 'MFA_ALREADY_ENABLED') {
                const u = useAuthStore.getState().user;
                if (u) {
                    const next: AuthUser = { ...u, mfaEnabled: true };
                    useAuthStore.setState({ user: next });
                    try {
                        localStorage.setItem('auth_user', JSON.stringify(next));
                    } catch {
                        /* ignore */
                    }
                }
                showInfo(
                    'MFA already enabled',
                    'Two-factor authentication is already active on this account.',
                );
                onClose();
                return;
            }
            showApiError(err);
        },
    });

    const confirmMutation = useMutation({
        mutationFn: (code: string) => authApi.confirmMfa(code),
        onSuccess: () => {
            setStep('done');
            showSuccess('MFA enabled successfully');
            const u = useAuthStore.getState().user;
            if (u) {
                const next: AuthUser = { ...u, mfaEnabled: true };
                useAuthStore.setState({ user: next });
                try {
                    localStorage.setItem('auth_user', JSON.stringify(next));
                } catch {
                    /* ignore */
                }
            }
            onSuccess?.();
        },
        onError: (err) => {
            showApiError(err);
            setDigits(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        },
    });

    // Start setup when dialog opens
    useEffect(() => {
        if (open) {
            setStep('setup');
            setSetupData(null);
            setDigits(Array(CODE_LENGTH).fill(''));
            setCopied(false);
            setupMutation.mutate();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const handleCopySecret = async () => {
        if (!setupData?.secret) return;
        try {
            await navigator.clipboard.writeText(setupData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Fallback — ignore
        }
    };

    const handleDigitChange = (index: number, value: string) => {
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);

        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        const code = next.join('');
        if (code.length === CODE_LENGTH && !confirmMutation.isPending) {
            confirmMutation.mutate(code);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !digits[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
        if (!pasted) return;
        const next = Array(CODE_LENGTH).fill('');
        for (let i = 0; i < pasted.length; i++) {
            next[i] = pasted[i];
        }
        setDigits(next);
        const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
        if (pasted.length === CODE_LENGTH && !confirmMutation.isPending) {
            confirmMutation.mutate(pasted);
        }
    };

    const handleClose = () => {
        onClose();
    };

    if (!open) return null;

    const isLoading = setupMutation.isPending || confirmMutation.isPending;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={step === 'done' ? handleClose : undefined}
            />

            {/* Dialog */}
            <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-md mx-4 p-6 md:p-8 animate-in fade-in zoom-in-95 duration-200">
                {/* Close button */}
                <button
                    type="button"
                    onClick={handleClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            {step === 'done' ? 'MFA Enabled' : 'Set Up MFA'}
                        </h3>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            {step === 'setup' && 'Loading your authenticator setup...'}
                            {step === 'confirm' && 'Scan the QR code with your authenticator app'}
                            {step === 'done' && 'Two-factor authentication is now active'}
                        </p>
                    </div>
                </div>

                {/* Loading state */}
                {step === 'setup' && setupMutation.isPending && (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                )}

                {/* QR Code + Confirm step */}
                {step === 'confirm' && setupData && (
                    <div className="space-y-6">
                        {/* QR Code */}
                        <div className="flex justify-center">
                            <div className="p-3 bg-white rounded-xl border border-neutral-200 dark:border-neutral-700">
                                <img
                                    src={setupData.qrCodeDataUrl}
                                    alt="MFA QR Code"
                                    className="w-48 h-48"
                                />
                            </div>
                        </div>

                        {/* Secret key */}
                        <div className="space-y-1.5">
                            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                Manual entry key
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-sm font-mono text-neutral-700 dark:text-neutral-300 break-all select-all">
                                    {setupData.secret}
                                </code>
                                <button
                                    type="button"
                                    onClick={handleCopySecret}
                                    className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors flex-shrink-0"
                                    title="Copy secret"
                                >
                                    {copied ? (
                                        <Check className="w-4 h-4 text-success-600" />
                                    ) : (
                                        <Copy className="w-4 h-4" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* OTP Input */}
                        <div className="space-y-2">
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                Enter the 6-digit code from your app
                            </p>
                            <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
                                {digits.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={(el) => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handleDigitChange(i, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(i, e)}
                                        disabled={isLoading}
                                        className="w-11 h-13 text-center text-lg font-bold bg-white dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-primary-500 focus:shadow-sm focus:shadow-primary-500/10 outline-none transition-colors text-neutral-900 dark:text-white disabled:opacity-50"
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Confirm button */}
                        <button
                            type="button"
                            onClick={() => {
                                const code = digits.join('');
                                if (code.length === CODE_LENGTH && !confirmMutation.isPending) {
                                    confirmMutation.mutate(code);
                                }
                            }}
                            disabled={isLoading || digits.join('').length < CODE_LENGTH}
                            className="w-full h-12 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 disabled:opacity-70 disabled:hover:bg-primary-600"
                        >
                            {confirmMutation.isPending ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                'Verify & Enable MFA'
                            )}
                        </button>
                    </div>
                )}

                {/* Done step */}
                {step === 'done' && (
                    <div className="text-center py-4 space-y-4">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                                <Check className="w-8 h-8 text-success-600 dark:text-success-400" />
                            </div>
                        </div>
                        <p className="text-neutral-600 dark:text-neutral-400 text-sm">
                            Your account is now protected with two-factor authentication. You will need your authenticator app to sign in.
                        </p>
                        <button
                            type="button"
                            onClick={handleClose}
                            className="w-full h-12 bg-primary-600 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
