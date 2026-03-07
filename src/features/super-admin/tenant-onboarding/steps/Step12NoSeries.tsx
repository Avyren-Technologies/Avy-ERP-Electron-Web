// Step 12 — No. Series (Document Numbering)
import {
    SectionCard, FormInput, FormSelect, AddButton, ItemCard, TwoCol, ThreeCol, InfoBanner
} from '../atoms';
import { NO_SERIES_SCREENS } from '../constants';
import { useTenantOnboardingStore } from '../store';
import type { NoSeriesItem } from '../types';

function NoSeriesForm({
    item,
    onUpdate,
    onRemove,
}: {
    item: NoSeriesItem;
    onUpdate: (u: Partial<NoSeriesItem>) => void;
    onRemove: () => void;
}) {
    const preview = [
        item.prefix,
        '#'.repeat(parseInt(item.numberCount) || 4).replace(/#/g, (_, i) =>
            i === (parseInt(item.numberCount) || 4) - 1
                ? String(parseInt(item.startNumber) || 1)
                : '0'
        ),
        item.suffix,
    ]
        .filter(Boolean)
        .join('');

    return (
        <div className="space-y-4">
            <TwoCol>
                <FormInput
                    label="Series Code"
                    placeholder="e.g. INV, EMP, WO"
                    value={item.code}
                    onChange={(v) => onUpdate({ code: v.toUpperCase() })}
                    required
                    monospace
                    hint="Unique identifier for this series (used in API + reports)"
                />
                <FormSelect
                    label="Linked Screen / Document Type"
                    value={item.linkedScreen}
                    onChange={(v) => onUpdate({ linkedScreen: v })}
                    options={NO_SERIES_SCREENS}
                    placeholder="Select document type"
                    required
                />
            </TwoCol>

            <FormInput
                label="Description"
                placeholder="e.g. Sales Invoice Numbering"
                value={item.description}
                onChange={(v) => onUpdate({ description: v })}
            />

            <ThreeCol>
                <FormInput
                    label="Prefix"
                    placeholder="INV-"
                    value={item.prefix}
                    onChange={(v) => onUpdate({ prefix: v })}
                    monospace
                    hint="Text before the number"
                />
                <FormInput
                    label="Suffix"
                    placeholder="-FY25"
                    value={item.suffix}
                    onChange={(v) => onUpdate({ suffix: v })}
                    monospace
                    hint="Text after the number"
                />
                <FormInput
                    label="Number Count (Digits)"
                    placeholder="6"
                    value={item.numberCount}
                    onChange={(v) => onUpdate({ numberCount: v })}
                    type="number"
                    hint="Zero-padded length"
                />
            </ThreeCol>

            <TwoCol>
                <FormInput
                    label="Start Number"
                    placeholder="1"
                    value={item.startNumber}
                    onChange={(v) => onUpdate({ startNumber: v })}
                    type="number"
                    hint="First document number generated"
                />
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
                onClick={onRemove}
                className="text-xs font-semibold text-danger-500 hover:text-danger-700 transition-colors dark:text-danger-400"
            >
                🗑 Remove this series
            </button>
        </div>
    );
}

export function Step12NoSeries() {
    const { step12, addNoSeriesItem, updateNoSeriesItem, removeNoSeriesItem } = useTenantOnboardingStore();

    return (
        <div className="space-y-0 animate-in fade-in slide-in-from-right-3 duration-300">

            <InfoBanner variant="info" className="mb-5">
                <strong>Document Numbering</strong> — No. Series defines how documents are auto-numbered across the ERP.
                For example, invoices follow INV-000001, employees follow EMP-000001. Series can be customized per document type.
            </InfoBanner>

            <SectionCard title="Number Series Configuration" subtitle="Define auto-numbering sequences for each document type used in this company">
                {step12.noSeries.length === 0 ? (
                    <div className="bg-neutral-50 border border-dashed border-neutral-200 rounded-xl py-10 text-center mb-4 dark:bg-neutral-800 dark:border-neutral-700">
                        <p className="text-2xl mb-3">🔢</p>
                        <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-300">No number series configured</p>
                        <p className="text-xs text-neutral-400 mt-1 dark:text-neutral-500">
                            Add series for Sales Invoice, PO, Employee, Work Order, etc.
                        </p>
                    </div>
                ) : (
                    step12.noSeries.map((item, idx) => (
                        <ItemCard
                            key={item.id}
                            title={item.code || `Series ${idx + 1}`}
                            subtitle={item.linkedScreen || 'No document type selected'}
                            badge={`${idx + 1}`}
                            defaultOpen={idx === 0}
                        >
                            <NoSeriesForm
                                item={item}
                                onUpdate={(u) => updateNoSeriesItem(item.id, u)}
                                onRemove={() => removeNoSeriesItem(item.id)}
                            />
                        </ItemCard>
                    ))
                )}

                <AddButton label="Add Number Series" onClick={addNoSeriesItem} />
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
        </div>
    );
}
