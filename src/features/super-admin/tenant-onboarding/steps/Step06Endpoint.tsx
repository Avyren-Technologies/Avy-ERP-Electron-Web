// Step 06 — Backend Endpoint (WEB EXCLUSIVE — MISSING FROM MOBILE)
// Allows Super-Admin to connect this tenant to default or a custom backend server
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { Globe, Server, CheckCircle2, AlertCircle } from 'lucide-react';
import { SectionCard, FormInput, SecretInput, FormTextarea, RadioOption, TwoCol, InfoBanner } from '../atoms';
import { BACKEND_REGIONS } from '../constants';
import { useTenantOnboardingStore } from '../store';

const schema = z.object({
    endpointType: z.enum(['default', 'custom']),
    customRegion: z.string().optional(),
    customBaseUrl: z.string().optional(),
    apiKey: z.string().optional(),
    webhookSecret: z.string().optional(),
    customNote: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.endpointType === 'custom') {
        if (!data.customBaseUrl) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['customBaseUrl'], message: 'Required' });
    }
});

type FormData = z.infer<typeof schema>;

export function Step06Endpoint() {
    const { step6, setStep6, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit, watch } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            endpointType: step6.endpointType || 'default',
            customRegion: step6.customRegion,
            customBaseUrl: step6.customBaseUrl,
            apiKey: step6.apiKey,
            webhookSecret: step6.webhookSecret,
            customNote: step6.customNote,
        }
    });

    const endpointType = watch('endpointType');
    const customBaseUrl = watch('customBaseUrl');

    const onSubmit = (data: FormData) => {
        setStep6(data);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                <strong>Backend Endpoint Configuration</strong> — This determines which server cluster handles this tenant's
                data. Most tenants use the Default Avyren Cloud endpoint. Custom endpoints are available for enterprise
                deployments with on-premise or dedicated infrastructure.
            </InfoBanner>

            {/* Endpoint Type Selection */}
            <SectionCard
                title="Connection Type"
                subtitle="Choose how this tenant connects to the Avy ERP backend"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Default Cloud */}
                    <Controller name="endpointType" control={control} render={({ field }) => (
                        <button
                            type="button"
                            onClick={() => field.onChange('default')}
                            className={cn(
                                'relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                                field.value === 'default'
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 shadow-md shadow-primary-500/10'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-primary-200 dark:border-primary-800/50'
                            )}
                        >
                            {field.value === 'default' && (
                                <CheckCircle2 size={18} className="absolute top-4 right-4 text-primary-600" />
                            )}
                            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center dark:bg-primary-900/40">
                                <Globe size={20} className="text-primary-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">Avyren Default Cloud</p>
                                <p className="text-xs text-neutral-500 mt-1 leading-5 dark:text-neutral-400">
                                    Hosted on Avyren's managed infrastructure. Automatic scaling, backups, and SLA.
                                    Recommended for most tenants.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {['Auto-managed', 'Multi-region CDN', '99.9% Uptime SLA'].map(f => (
                                    <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </button>
                    )} />

                    {/* Custom Endpoint */}
                    <Controller name="endpointType" control={control} render={({ field }) => (
                        <button
                            type="button"
                            onClick={() => field.onChange('custom')}
                            className={cn(
                                'relative flex flex-col items-start gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200',
                                field.value === 'custom'
                                    ? 'border-accent-500 bg-accent-50 shadow-md shadow-accent-500/10'
                                    : 'border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 hover:border-accent-200'
                            )}
                        >
                            {field.value === 'custom' && (
                                <CheckCircle2 size={18} className="absolute top-4 right-4 text-accent-600" />
                            )}
                            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                                <Server size={20} className="text-accent-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-primary-950 dark:text-white">Custom / On-Premise Endpoint</p>
                                <p className="text-xs text-neutral-500 mt-1 leading-5 dark:text-neutral-400">
                                    Point to a dedicated server, private cloud, or on-premise Avy ERP backend deployment.
                                    Enterprise use only.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                                {['Self-hosted', 'Custom domain', 'Enterprise SLA'].map(f => (
                                    <span key={f} className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent-100 text-accent-700">
                                        {f}
                                    </span>
                                ))}
                            </div>
                        </button>
                    )} />
                </div>
            </SectionCard>

            {/* Default — Region Selection */}
            {endpointType === 'default' && (
                <SectionCard
                    title="Server Region"
                    subtitle="Select the geographic region closest to the company's primary operations"
                >
                    <Controller name="customRegion" control={control} render={({ field }) => (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {BACKEND_REGIONS.map((region) => (
                                <RadioOption
                                    key={region.key}
                                    label={region.label}
                                    subtitle={region.subtitle}
                                    selected={field.value === region.key}
                                    onSelect={() => field.onChange(region.key)}
                                />
                            ))}
                        </div>
                    )} />

                    <div className="mt-4 bg-success-50 border border-success-200 rounded-xl px-5 py-4 dark:bg-success-900/20 dark:border-success-800/50">
                        <p className="text-xs font-bold text-success-800 mb-1 dark:text-success-400">✅ Default Endpoint Active</p>
                        <p className="text-xs text-success-700 dark:text-success-400">
                            Tenant will be provisioned on <strong>api.avy-erp.com</strong> with your selected region as the
                            preferred shard. SSL/TLS, backups, and monitoring are fully managed by Avyren.
                        </p>
                    </div>
                </SectionCard>
            )}

            {/* Custom Endpoint Configuration */}
            {endpointType === 'custom' && (
                <div className="space-y-0">
                    <SectionCard title="Custom Server Configuration" subtitle="Enter the backend URL for this tenant's dedicated server" accent="info">
                        <InfoBanner variant="warning">
                            <strong>Enterprise Feature:</strong> Only configure a custom endpoint if the company has a
                            dedicated/on-premise Avy ERP backend deployment. Incorrect URLs will prevent tenant provisioning.
                        </InfoBanner>

                        <Controller name="customBaseUrl" control={control} render={({ field, fieldState }) => (
                            <FormInput label="Backend Base URL" placeholder="https://erp.yourcompany.com/api/v1" {...field} value={field.value || ''} required hint="The root URL of the custom backend. Must be HTTPS with a valid SSL certificate." monospace error={fieldState.error?.message} />
                        )} />

                        <TwoCol>
                            <Controller name="customRegion" control={control} render={({ field, fieldState }) => (
                                <FormInput label="Region / Deployment Label" placeholder="e.g. On-Premise Mumbai DC" {...field} value={field.value || ''} hint="Human-readable label shown in the admin panel" error={fieldState.error?.message} />
                            )} />
                            <Controller name="apiKey" control={control} render={({ field, fieldState }) => (
                                <FormInput label="API Key" placeholder="Bearer token or API key for auth" {...field} value={field.value || ''} hint="Used by Avy ERP Super-Admin to authenticate management requests" monospace error={fieldState.error?.message} />
                            )} />
                        </TwoCol>

                        <Controller name="webhookSecret" control={control} render={({ field, fieldState }) => (
                            <SecretInput label="Webhook Secret" placeholder="Secret token for secure webhook verification" {...field} value={field.value || ''} hint="Used to validate events sent from the custom backend to the platform" error={fieldState.error?.message} />
                        )} />

                        <Controller name="customNote" control={control} render={({ field, fieldState }) => (
                            <FormTextarea label="Notes / Additional Config" placeholder="e.g. VPN required for connectivity, contact IT: sysadmin@company.com" {...field} value={field.value || ''} hint="Internal notes for Avyren support team (not shown to tenant users)" rows={3} error={fieldState.error?.message} />
                        )} />
                    </SectionCard>

                    <SectionCard title="Endpoint Health" subtitle="Validation status of the custom backend connection">
                        <div className="flex items-center gap-3 bg-warning-50 border border-warning-200 rounded-xl px-5 py-4 dark:bg-warning-900/20 dark:border-warning-800/50">
                            <AlertCircle size={20} className="text-warning-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-warning-800 dark:text-warning-400">Endpoint Not Validated</p>
                                <p className="text-xs text-warning-700 mt-0.5 dark:text-warning-400">
                                    The connection test runs automatically after company creation. Ensure the URL is accessible
                                    from Avyren's platform IP range before going live.
                                </p>
                            </div>
                        </div>
                        {customBaseUrl && (
                            <div className="mt-3 font-mono text-xs bg-neutral-900 text-green-400 px-5 py-4 rounded-xl overflow-x-auto">
                                <p className="text-neutral-500 dark:text-neutral-400">{'# Pending validation test:'}</p>
                                <p>{'GET '}{customBaseUrl}{'/health'}</p>
                                <p className="text-neutral-500 mt-1 dark:text-neutral-400">{'# Expected: 200 OK { "status": "healthy" }'}</p>
                            </div>
                        )}
                    </SectionCard>
                </div>
            )}
        </form>
    );
}
