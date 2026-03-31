import { SearchableSelect, type SearchableSelectOption } from '@/components/ui/SearchableSelect';
import { Calendar } from 'lucide-react';

export interface FilterValues {
  [key: string]: string | undefined;
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  locationId?: string;
  gradeId?: string;
  employeeType?: string;
}

export interface FilterOptions {
  departments?: SearchableSelectOption[];
  locations?: SearchableSelectOption[];
  grades?: SearchableSelectOption[];
  employeeTypes?: SearchableSelectOption[];
}

interface GlobalFiltersProps extends FilterOptions {
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export function GlobalFilters({
  filters,
  onChange,
  departments = [],
  locations = [],
  grades = [],
  employeeTypes = [],
}: GlobalFiltersProps) {
  const update = (patch: Partial<FilterValues>) => onChange({ ...filters, ...patch });

  return (
    <div className="flex flex-wrap items-end gap-3">
      {/* Date Range */}
      <div className="flex-shrink-0">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">
          <Calendar className="h-3 w-3" />
          From
        </label>
        <input
          type="date"
          value={filters.dateFrom ?? ''}
          onChange={(e) => update({ dateFrom: e.target.value || undefined })}
          className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:text-white transition-all"
        />
      </div>
      <div className="flex-shrink-0">
        <label className="flex items-center gap-1.5 text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">
          <Calendar className="h-3 w-3" />
          To
        </label>
        <input
          type="date"
          value={filters.dateTo ?? ''}
          onChange={(e) => update({ dateTo: e.target.value || undefined })}
          className="px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 dark:text-white transition-all"
        />
      </div>

      {/* Department */}
      {departments.length > 0 && (
        <div className="min-w-[180px]">
          <SearchableSelect
            label="Department"
            value={filters.departmentId ?? ''}
            onChange={(v) => update({ departmentId: v || undefined })}
            options={departments}
            placeholder="All Departments"
          />
        </div>
      )}

      {/* Location */}
      {locations.length > 0 && (
        <div className="min-w-[180px]">
          <SearchableSelect
            label="Location"
            value={filters.locationId ?? ''}
            onChange={(v) => update({ locationId: v || undefined })}
            options={locations}
            placeholder="All Locations"
          />
        </div>
      )}

      {/* Grade */}
      {grades.length > 0 && (
        <div className="min-w-[160px]">
          <SearchableSelect
            label="Grade"
            value={filters.gradeId ?? ''}
            onChange={(v) => update({ gradeId: v || undefined })}
            options={grades}
            placeholder="All Grades"
          />
        </div>
      )}

      {/* Employee Type */}
      {employeeTypes.length > 0 && (
        <div className="min-w-[160px]">
          <SearchableSelect
            label="Type"
            value={filters.employeeType ?? ''}
            onChange={(v) => update({ employeeType: v || undefined })}
            options={employeeTypes}
            placeholder="All Types"
          />
        </div>
      )}
    </div>
  );
}
