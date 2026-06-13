import { useEffect, useMemo, useState } from 'react';
import { SearchableSelect, type SearchableSelectOption } from './SearchableSelect';
import { useEmployeesDropdown } from '@/features/company-admin/api/use-hr-queries';
import type { EmployeeDropdownItem } from '@/lib/api/hr';
import { cn } from '@/lib/utils';

export interface EmployeePickerInitialEmployee {
    id: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    employeeId?: string;
}

export interface EmployeePickerProps {
    /** Currently selected employee id, or null. */
    value: string | null;
    /** Called with the selected employee id (or null when cleared) and the full row when available. */
    onChange: (id: string | null, employee?: EmployeeDropdownItem) => void;
    /** Optional label rendered above the field. */
    label?: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
    /** Filter employees by status. Defaults to ACTIVE on the backend. */
    status?: 'ACTIVE' | 'ALL';
    /** Restrict results to a single department. */
    departmentId?: string;
    /** Restrict results to a single location. */
    locationId?: string;
    /** Employee ids to hide from the dropdown (e.g. self, already-selected). */
    excludeIds?: string[];
    /** Wrapper class name. */
    className?: string;
    /** Validation error message displayed below the field. */
    error?: string;
    /** Pre-known selected employee, so the label can render before the dropdown query resolves. */
    initialEmployee?: EmployeePickerInitialEmployee;
}

function buildFullName(
    parts: { firstName?: string | null; middleName?: string | null; lastName?: string | null },
): string {
    return [parts.firstName, parts.middleName, parts.lastName].filter(Boolean).join(' ');
}

/**
 * Reusable employee picker with server-driven search, infinite scroll, and optional filters.
 * Backed by `GET /hr/employees/dropdown` via `useEmployeesDropdown`.
 */
export function EmployeePicker(props: EmployeePickerProps) {
    const {
        value,
        onChange,
        label,
        placeholder = 'Select employee...',
        disabled = false,
        required = false,
        status,
        departmentId,
        locationId,
        excludeIds,
        className,
        error,
        initialEmployee,
    } = props;

    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    const queryParams = useMemo(
        () => ({
            search: debouncedSearch || undefined,
            status,
            departmentId,
            locationId,
        }),
        [debouncedSearch, status, departmentId, locationId],
    );

    const query = useEmployeesDropdown(queryParams, !disabled);
    const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = query;

    const employees = useMemo(() => {
        const flat: EmployeeDropdownItem[] = data?.pages.flatMap((p) => p.data) ?? [];
        return excludeIds && excludeIds.length > 0
            ? flat.filter((e) => !excludeIds.includes(e.id))
            : flat;
    }, [data, excludeIds]);

    // Cache the most recently selected employee so its label persists across
    // searches and pagination even after the row scrolls out of the current pages.
    // Updated only via user interaction (handleChange) — never via setState in an effect.
    const [selectedCache, setSelectedCache] = useState<EmployeeDropdownItem | null>(null);

    const options: SearchableSelectOption[] = useMemo(() => {
        const base: SearchableSelectOption[] = employees.map((e) => ({
            value: e.id,
            label: buildFullName(e),
            sublabel: [e.employeeId, e.department?.name].filter(Boolean).join(' • '),
        }));

        if (value && !base.some((o) => o.value === value)) {
            // 1. Prefer the most recently selected employee from the cache.
            if (selectedCache && selectedCache.id === value) {
                base.unshift({
                    value: selectedCache.id,
                    label: buildFullName(selectedCache),
                    sublabel: [selectedCache.employeeId, selectedCache.department?.name]
                        .filter(Boolean)
                        .join(' • '),
                });
            } else if (initialEmployee && initialEmployee.id === value) {
                // 2. Otherwise fall back to the initial employee provided by the parent
                //    (e.g. when editing a record where the manager is already known).
                base.unshift({
                    value: initialEmployee.id,
                    label: buildFullName(initialEmployee),
                    sublabel: initialEmployee.employeeId ?? '',
                });
            }
        }

        return base;
    }, [employees, value, initialEmployee, selectedCache]);

    const handleChange = (id: string) => {
        if (!id) {
            onChange(null);
            return;
        }
        const emp = employees.find((e) => e.id === id);
        if (emp) setSelectedCache(emp);
        onChange(id, emp);
    };

    const handleLoadMore = () => {
        if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
        }
    };

    return (
        <div className={cn('relative', className)}>
            <SearchableSelect
                label={label}
                value={value ?? ''}
                onChange={handleChange}
                options={options}
                placeholder={placeholder}
                disabled={disabled}
                required={required}
                serverSearch
                onSearchChange={setSearch}
                onLoadMore={handleLoadMore}
                hasMore={!!hasNextPage}
                isLoading={isLoading}
                isFetchingMore={isFetchingNextPage}
            />
            {error && (
                <p className="mt-1 text-xs text-danger-500">{error}</p>
            )}
        </div>
    );
}
