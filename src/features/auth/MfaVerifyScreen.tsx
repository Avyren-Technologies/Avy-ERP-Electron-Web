import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi, decodeJwtPayload } from '@/lib/api/auth';
import type { LoginResponse } from '@/lib/api/auth';
import { useAuthStore, mapBackendRole } from '@/store/useAuthStore';
import { showApiError } from '@/lib/toast';
import { CustomLoader } from '@/components/ui/CustomLoader';

const CODE_LENGTH = 6;

export function MfaVerifyScreen() {
    const navigate = useNavigate();
    const signIn = useAuthStore((s) => s.signIn);
    const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const verifiedRef = useRef(false);

    const mfaToken = sessionStorage.getItem('mfa_token');

    // Redirect to login if no MFA token (but not if we just verified successfully)
    useEffect(() => {
        if (!mfaToken && !verifiedRef.current) {
            navigate('/login', { replace: true });
        }
    }, [mfaToken, navigate]);

    const verifyMutation = useMutation({
        mutationFn: (code: string) => authApi.verifyMfa(mfaToken!, code),
        onSuccess: (response) => {
            if (response.success && response.data) {
                // Mark as verified BEFORE removing token to prevent useEffect redirect
                verifiedRef.current = true;
                sessionStorage.removeItem('mfa_token');
                const { user, tokens } = response.data as LoginResponse;
                const payload = decodeJwtPayload(tokens.accessToken);
                const permissions: string[] = Array.isArray(payload?.permissions)
                    ? (payload.permissions as string[])
                    : [];
                const role = mapBackendRole(user.role);
                signIn(tokens, { ...user, permissions }, role);
                navigate('/app/dashboard');
            }
        },
        onError: (err) => {
            showApiError(err);
            // Clear digits on error so user can retry
            setDigits(Array(CODE_LENGTH).fill(''));
            inputRefs.current[0]?.focus();
        },
    });

    const submitCode = useCallback(
        (code: string) => {
            if (code.length === CODE_LENGTH && !verifyMutation.isPending) {
                verifyMutation.mutate(code);
            }
        },
        [verifyMutation],
    );

    const handleChange = (index: number, value: string) => {
        // Only allow digits
        const digit = value.replace(/\D/g, '').slice(-1);
        const next = [...digits];
        next[index] = digit;
        setDigits(next);

        if (digit && index < CODE_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit when all digits filled
        const code = next.join('');
        if (code.length === CODE_LENGTH) {
            submitCode(code);
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
        // Focus the next empty input or the last one
        const focusIdx = Math.min(pasted.length, CODE_LENGTH - 1);
        inputRefs.current[focusIdx]?.focus();
        if (pasted.length === CODE_LENGTH) {
            submitCode(pasted);
        }
    };

    const handleBackToLogin = () => {
        sessionStorage.removeItem('mfa_token');
        navigate('/login');
    };

    if (!mfaToken) return null;

    const isLoading = verifyMutation.isPending;

    return (
        <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-6 min-h-screen">
            <div className="bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl border border-white/40 dark:border-neutral-800 shadow-2xl shadow-primary-900/5 dark:shadow-black/20 rounded-[2rem] p-8 md:p-10 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                    </div>
                </div>

                {/* Heading */}
                <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                        Two-Factor Authentication
                    </h2>
                    <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                        Enter the 6-digit code from your authenticator app
                    </p>
                </div>

                {/* OTP Input */}
                <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
                    {digits.map((digit, i) => (
                        <input
                            key={i}
                            ref={(el) => { inputRefs.current[i] = el; }}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleChange(i, e.target.value)}
                            onKeyDown={(e) => handleKeyDown(i, e)}
                            disabled={isLoading}
                            autoFocus={i === 0}
                            className="w-12 h-14 text-center text-xl font-bold bg-white dark:bg-neutral-950 border-2 border-neutral-200 dark:border-neutral-700 rounded-xl focus:border-primary-500 focus:shadow-sm focus:shadow-primary-500/10 outline-none transition-colors text-neutral-900 dark:text-white disabled:opacity-50"
                        />
                    ))}
                </div>

                {/* Submit button */}
                <button
                    type="button"
                    onClick={() => submitCode(digits.join(''))}
                    disabled={isLoading || digits.join('').length < CODE_LENGTH}
                    className="w-full h-14 flex items-center justify-center gap-2 bg-primary-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-primary-500/25 transition-all hover:bg-primary-700 disabled:opacity-70 disabled:hover:bg-primary-600"
                >
                    {isLoading ? (
                        <CustomLoader size="sm" className="text-white brightness-200" />
                    ) : (
                        'Verify Code'
                    )}
                </button>

                {/* Error display */}
                {verifyMutation.isError && (
                    <div className="mt-4 p-3 rounded-xl bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800">
                        <p className="text-sm font-semibold text-danger-700 dark:text-danger-400 text-center">
                            {(verifyMutation.error as any)?.response?.data?.message
                                || 'Verification failed. Please try again.'}
                        </p>
                    </div>
                )}

                {/* Back to login */}
                <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </button>
            </div>
        </div>
    );
}
