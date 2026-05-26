import { useScrapCategories } from '@/features/inventory/api/use-inventory-queries';

interface ScrapCategoryPickerProps {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    required?: boolean;
}

export function ScrapCategoryPicker({ value, onChange, disabled, required }: ScrapCategoryPickerProps) {
    const { data, isLoading } = useScrapCategories();
    const categories = data?.data || [];

    return (
        <select
            className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || isLoading}
            required={required}
        >
            <option value="">{isLoading ? 'Loading...' : 'Select scrap category'}</option>
            {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>
                    {cat.code ? `${cat.code} - ` : ''}{cat.name}
                </option>
            ))}
        </select>
    );
}
