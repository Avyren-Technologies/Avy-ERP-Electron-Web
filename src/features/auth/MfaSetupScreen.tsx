import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Shield, ArrowLeft, Copy, Check, Loader2 } from 'lucide-react';
import { authApi, decodeJwtPayload } from '@/lib/api/auth';
import { useAuthStore, mapBackendRole } from '@/store/useAuthStore';
import { showApiError, showSuccess } from '@/lib/toast';

/**
 * Forced MFA Setup Screen — shown when company enforces MFA but user hasn't set it up.
 * Uses the mfaToken from sessionStorage (set during login).
 * Flow: 1. Call /auth/mfa/setup with mfaToken → get QR code
 *       2. User scans QR + enters TOTP code
 *       3. Call /auth/mfa/confirm with mfaToken + code → get full auth tokens
 */
export function MfaSetupScreen() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);

    const mfaToken = sessionStorage.getItem('mfa_token');
    const [step, setStep] = useState<'loading' | 'scan' | 'confirm'>('loading');
    const [qrData, setQrData] = useState<{ qrCodeDataUrl: string; secret: string } | null>(null);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [copied, setCopied] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!mfaToken) {
            navigate('/login');
            return;
        }
        // Fetch QR code using the mfaToken
        setupMutation.mutate();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const setupMutation = useMutation({
        mutationFn: async () => {
            // Call setup with mfaToken in the body (public endpoint)
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3030/api/v1'}/auth/mfa/setup`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Device-Info': 'web' },
                    body: JSON.stringify({ mfaToken }),
                },
            );
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Failed to set up MFA');
            return data.data;
        },
        onSuccess: (data) => {
            setQrData({ qrCodeDataUrl: data.qrCodeDataUrl, secret: data.secret });
            setStep('scan');
        },
        onError: (err) => {
            showApiError(err);
            sessionStorage.removeItem('mfa_token');
            navigate('/login');
        },
    });

    const confirmMutation = useMutation({
        mutationFn: async () => {
            // Call confirm with mfaToken — backend returns full auth tokens
            const response = await fetch(
                `${import.meta.env.VITE_API_URL || 'http://localhost:3030/api/v1'}/auth/mfa/confirm`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'X-Device-Info': 'web' },
                    body: JSON.stringify({ mfaToken, code: code.join('') }),
                },
            );
            const data = await response.json();
            if (!data.success) throw new Error(data.error || 'Invalid code');
            return data.data;
        },
        onSuccess: (data) => {
            sessionStorage.removeItem('mfa_token');
            if (data?.user && data?.tokens) {
                const payload = decodeJwtPayload(data.tokens.accessToken);
                const permissions: string[] = Array.isArray(payload?.permissions) ? payload.permissions as string[] : [];
                signIn(data.tokens, { ...data.user, permissions }, mapBackendRole(data.user.role));
                showSuccess('MFA enabled successfully');
                navigate('/app/dashboard');
            }
        },
        onError: (err) => showApiError(err),
    });

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const next = [...code];
        next[index] = value.slice(-1);
        setCode(next);
        if (value && index < 5) inputRefs.current[index + 1]?.focus();
        if (next.every(d => d !== '')) {
            setTimeout(() => confirmMutation.mutate(), 100);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const copySecret = () => {
        if (qrData?.secret) {
            navigator.clipboard.writeText(qrData.secret);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl p-8 w-full max-w-md">
                <button
                    onClick={() => { sessionStorage.removeItem('mfa_token'); navigate('/login'); }}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 mb-6"
                >
                    <ArrowLeft size={16} /> Back to login
                </button>

                <div className="flex flex-col items-center text-center mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
                        <Shield size={24} className="text-primary-600" />
                    </div>
                    <h1 className="text-xl font-bold text-neutral-900 dark:text-white">Set Up Two-Factor Authentication</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-2">
                        Your organization requires MFA. Scan the QR code with your authenticator app to continue.
                    </p>
                </div>

                {step === 'loading' && (
                    <div className="flex justify-center py-12">
                        <Loader2 size={32} className="animate-spin text-primary-600" />
                    </div>
                )}

                {step === 'scan' && qrData && (
                    <div className="space-y-6">
                        {/* QR Code */}
                        <div className="flex justify-center">
                            <img
                                src={qrData.qrCodeDataUrl}
                                alt="MFA QR Code"
                                className="w-48 h-48 rounded-xl border border-neutral-200 dark:border-neutral-700"
                            />
                        </div>

                        {/* Manual secret */}
                        <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4">
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                                Can't scan? Enter this key manually:
                            </p>
                            <div className="flex items-center gap-2">
                                <code className="flex-1 text-sm font-mono text-neutral-900 dark:text-white bg-white dark:bg-neutral-700 rounded-lg px-3 py-2 select-all break-all">
                                    {qrData.secret}
                                </code>
                                <button
                                    onClick={copySecret}
                                    className="p-2 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    {copied ? <Check size={16} className="text-success-600" /> : <Copy size={16} className="text-neutral-500" />}
                                </button>
                            </div>
                        </div>

                        {/* TOTP code entry */}
                        <div>
                            <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 text-center">
                                Enter the 6-digit code from your app
                            </p>
                            <div className="flex justify-center gap-3 mb-4">
                                {code.map((digit, i) => (
                                    <input
                                        key={i}
                                        ref={el => { inputRefs.current[i] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={e => handleCodeChange(i, e.target.value)}
                                        onKeyDown={e => handleKeyDown(i, e)}
                                        className="w-12 h-14 text-center text-xl font-bold border-2 border-neutral-200 dark:border-neutral-700 rounded-xl
                                            focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none
                                            bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white transition-all"
                                    />
                                ))}
                            </div>
                            <button
                                onClick={() => confirmMutation.mutate()}
                                disabled={code.some(d => d === '') || confirmMutation.isPending}
                                className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700
                                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {confirmMutation.isPending ? 'Verifying...' : 'Verify & Enable MFA'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
