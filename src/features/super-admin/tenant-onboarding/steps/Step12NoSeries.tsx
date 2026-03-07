// Step 12 — No. Series (Document Numbering)
import React from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    SectionCard, FormInput, FormSelect, AddButton, ItemCard, TwoCol, ThreeCol, InfoBanner
} from '../atoms';
import { NO_SERIES_SCREENS } from '../constants';
import { useTenantOnboardingStore } from '../store';

const noSeriesItemSchema = z.object({
    id: z.string(),
    code: z.string().min(1, 'Required'),
    linkedScreen: z.string().min(1, 'Required'),
    description: z.string().optional(),
    prefix: z.string().optional(),
    suffix: z.string().optional(),
    numberCount: z.string().optional(),
    startNumber: z.string().optional(),
});

const schema = z.object({
    noSeries: z.array(noSeriesItemSchema),
});

type FormData = z.infer<typeof schema>;

export function Step12NoSeries() {
    const { step12, setStep12, goNext } = useTenantOnboardingStore();

    const { control, handleSubmit } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            noSeries: step12.noSeries,
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'noSeries',
    });

    const onSubmit = (data: FormData) => {
        // Sanitize data (ensure no undefined strings)
        const sanitizedData = {
            noSeries: data.noSeries.map(item => ({
                id: item.id,
                code: item.code,
                linkedScreen: item.linkedScreen,
                description: item.description || '',
                prefix: item.prefix || '',
                suffix: item.suffix || '',
                numberCount: item.numberCount || '4',
                startNumber: item.startNumber || '1',
            }))
        };
        setStep12(sanitizedData);
        goNext();
        document.getElementById('wizard-content')?.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <form id="wizard-step-form" onSubmit={handleSubmit(onSubmit)} className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300 pb-10">

            <InfoBanner variant="info" className="mb-5">
                <strong>Document Numbering</strong> — No. Series defines how documents are auto-numbered across the ERP.
                For example, invoices follow INV-000001, employees follow EMP-000001. Series can be customized per document type.
            </InfoBanner>

            <SectionCard title="Number Series Configuration" subtitle="Define auto-numbering sequences for each document type used in this company">
                {fields.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-10 text-center mb-4 dark:bg-neutral-800 dark:border-neutral-700">
                        <p className="text-2xl mb-3">🔢</p>
                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No number series configured</p>
                        <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">
                            Add series for Sales Invoice, PO, Employee, Work Order, etc.
                        </p>
                    </div>
                ) : (
                    fields.map((field, idx) => (
                        <Controller
                            key={field.id}
                            name={`noSeries.${idx}`}
                            control={control}
                            render={({ field: controllerField, formState }) => {
                                const item = controllerField.value;
                                const errors = formState.errors.noSeries?.[idx];

                                const preview = [
                                    item.prefix,
                                    '#'.repeat(parseInt(item.numberCount || '4') || 4).replace(/#/g, (_, i) =>
                                        i === (parseInt(item.numberCount || '4') || 4) - 1
                                            ? String(parseInt(item.startNumber || '1') || 1)
                                            : '0'
                                    ),
                                    item.suffix,
                                ]
                                    .filter(Boolean)
                                    .join('');

                                return (
                                    <ItemCard
                                        title={item.code || `Series ${idx + 1}`}
                                        subtitle={item.linkedScreen || 'No document type selected'}
                                        badge={`${idx + 1}`}
                                        defaultOpen={idx === 0}
                                    >
                                        <div className="space-y-4">
                                            <TwoCol>
                                                <Controller name={`noSeries.${idx}.code`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Series Code" placeholder="e.g. INV, EMP, WO" {...subField} value={subField.value || ''} onChange={(e) => subField.onChange(e.toUpperCase())} required monospace hint="Unique identifier for this series (used in API + reports)" error={errors?.code?.message} />
                                                )} />
                                                <Controller name={`noSeries.${idx}.linkedScreen`} control={control} render={({ field: subField }) => (
                                                    <FormSelect label="Linked Screen / Document Type" {...subField} value={subField.value || ''} options={NO_SERIES_SCREENS} placeholder="Select document type" required />
                                                )} />
                                            </TwoCol>

                                            <Controller name={`noSeries.${idx}.description`} control={control} render={({ field: subField }) => (
                                                <FormInput label="Description" placeholder="e.g. Sales Invoice Numbering" {...subField} value={subField.value || ''} error={errors?.description?.message} />
                                            )} />

                                            <ThreeCol>
                                                <Controller name={`noSeries.${idx}.prefix`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Prefix" placeholder="INV-" {...subField} value={subField.value || ''} monospace hint="Text before the number" error={errors?.prefix?.message} />
                                                )} />
                                                <Controller name={`noSeries.${idx}.suffix`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Suffix" placeholder="-FY25" {...subField} value={subField.value || ''} monospace hint="Text after the number" error={errors?.suffix?.message} />
                                                )} />
                                                <Controller name={`noSeries.${idx}.numberCount`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Number Count (Digits)" placeholder="6" type="number" {...subField} value={subField.value || ''} hint="Zero-padded length" error={errors?.numberCount?.message} />
                                                )} />
                                            </ThreeCol>

                                            <TwoCol>
                                                <Controller name={`noSeries.${idx}.startNumber`} control={control} render={({ field: subField }) => (
                                                    <FormInput label="Start Number" placeholder="1" type="number" {...subField} value={subField.value || ''} hint="First document number generated" error={errors?.startNumber?.message} />
                                                )} />
                                                <div>
                                                    <label className="block text-xs font-bold text-primary-900 mb-1.5 dark:text-white">Preview</label>
                                                    <div className="flex items-center h-[46px] px-4 bg-neutral-900 text-green-400 rounded-xl font-mono text-sm border border-neutral-700">
                                                        {preview || <span className="text-neutral-500 dark:text-neutral-400">e.g. INV-000001-FY25</span>}
                                                    </div>
                                                    <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">Live preview of the first generated number</p>
                                                </div>
                                            </TwoCol>

                                            <button
                                                type="button"
                                                onClick={() => remove(idx)}
                                                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
                                            >
                                                🗑 Remove this series
                                            </button>
                                        </div>
                                    </ItemCard>
                                );
                            }}
                        />
                    ))
                )}

                <AddButton label="Add Number Series" onClick={() => append({
                    id: Date.now().toString(),
                    code: '',
                    linkedScreen: '',
                    description: '',
                    prefix: '',
                    suffix: '',
                    numberCount: '4',
                    startNumber: '1',
                })} />
            </SectionCard>

            {/* Quick reference */}
            <SectionCard title="Common Series Reference" subtitle="Suggested series configurations for typical manufacturing companies" accent="info">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                        { doc: 'Sales Invoice', example: 'INV-000001' },
                        { doc: 'Purchase Order', example: 'PO-000001' },
                        { doc: 'Employee Onboarding', example: 'EMP-000001' },
                        { doc: 'Work Order', example: 'WO-000001' },
                        { doc: 'GRN', example: 'GRN-000001' },
                        { doc: 'Gate Pass', example: 'GP-000001' },
                        { doc: 'Maintenance Ticket', example: 'MT-000001' },
                        { doc: 'Leave Management', example: 'LV-000001' },
                    ].map((s) => (
                        <div key={s.doc} className="flex items-center justify-between bg-neutral-50 rounded-lg px-4 py-2.5 dark:bg-neutral-800">
                            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{s.doc}</span>
                            <span className="font-mono text-xs text-primary-600 bg-primary-50 px-2 py-0.5 rounded dark:bg-primary-900/30">{s.example}</span>
                        </div>
                    ))}
                </div>
            </SectionCard>
        </form>
    );
}
