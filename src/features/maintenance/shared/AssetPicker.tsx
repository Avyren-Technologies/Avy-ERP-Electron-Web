import { useState, useCallback } from 'react';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useAssets } from '@/features/maintenance/api/use-maintenance-queries';

interface AssetPickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    /** Filter assets by class (e.g. 'MACHINE', 'TOOL', 'FACILITY') */
    assetClass?: string;
}

export function AssetPicker({
    label = 'Asset',
    value,
    onChange,
    placeholder = 'Select asset...',
    disabled = false,
    required = false,
    assetClass,
}: AssetPickerProps) {
    const [search, setSearch] = useState('');

    const params: Record<string, unknown> = { limit: 50 };
    if (search) params.search = search;
    if (assetClass) params.assetClass = assetClass;

    const { data, isLoading } = useAssets(params);

    const assets: any[] = data?.data ?? [];

    const options = assets.map((a: any) => ({
        value: a.id,
        label: `${a.assetNumber} - ${a.name}`,
        sublabel: [a.assetClass, a.operationalStatus].filter(Boolean).join(' | '),
    }));

    const handleSearchChange = useCallback((term: string) => {
        setSearch(term);
    }, []);

    return (
        <SearchableSelect
            label={label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            serverSearch
            onSearchChange={handleSearchChange}
            isLoading={isLoading}
        />
    );
}
