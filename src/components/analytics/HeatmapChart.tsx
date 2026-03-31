import { cn } from '@/lib/utils';

export interface HeatmapCell {
  row: string;
  col: string;
  value: number;
  label?: string;
}

interface HeatmapChartProps {
  cells: HeatmapCell[];
  rows: string[];
  columns: string[];
  minColor?: string;
  maxColor?: string;
  title?: string;
}

function getIntensityClass(value: number, min: number, max: number): string {
  if (max === min) return 'bg-indigo-200 dark:bg-indigo-900/30';

  const ratio = (value - min) / (max - min);

  if (ratio === 0) return 'bg-neutral-100 dark:bg-neutral-800';
  if (ratio < 0.2) return 'bg-indigo-100 dark:bg-indigo-900/20';
  if (ratio < 0.4) return 'bg-indigo-200 dark:bg-indigo-900/40';
  if (ratio < 0.6) return 'bg-indigo-300 dark:bg-indigo-800/50';
  if (ratio < 0.8) return 'bg-indigo-400 dark:bg-indigo-700/60';
  return 'bg-indigo-500 dark:bg-indigo-600';
}

function getTextClass(value: number, min: number, max: number): string {
  if (max === min) return 'text-indigo-800 dark:text-indigo-200';
  const ratio = (value - min) / (max - min);
  return ratio >= 0.6 ? 'text-white' : 'text-neutral-700 dark:text-neutral-300';
}

export function HeatmapChart({ cells, rows, columns, title }: HeatmapChartProps) {
  const values = cells.map((c) => c.value);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);

  const cellMap = new Map<string, HeatmapCell>();
  cells.forEach((c) => cellMap.set(`${c.row}|${c.col}`, c));

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 overflow-x-auto">
      {title && (
        <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-4">
          {title}
        </h3>
      )}

      <div className="inline-block min-w-full">
        {/* Column Headers */}
        <div className="flex">
          <div className="w-24 flex-shrink-0" />
          {columns.map((col) => (
            <div
              key={col}
              className="flex-1 min-w-[40px] text-center text-[10px] font-medium text-neutral-500 dark:text-neutral-400 pb-2 truncate px-0.5"
            >
              {col}
            </div>
          ))}
        </div>

        {/* Rows */}
        <div className="space-y-0.5">
          {rows.map((row) => (
            <div key={row} className="flex items-center">
              <div className="w-24 flex-shrink-0 text-xs font-medium text-neutral-600 dark:text-neutral-400 truncate pr-2 text-right">
                {row}
              </div>
              {columns.map((col) => {
                const cell = cellMap.get(`${row}|${col}`);
                const value = cell?.value ?? 0;

                return (
                  <div
                    key={col}
                    className={cn(
                      'flex-1 min-w-[40px] h-8 flex items-center justify-center rounded-sm mx-0.5 transition-colors',
                      getIntensityClass(value, min, max),
                    )}
                    title={cell?.label ?? `${row} / ${col}: ${value}`}
                  >
                    <span className={cn('text-[10px] font-medium', getTextClass(value, min, max))}>
                      {value > 0 ? value : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-1 mt-4">
          <span className="text-[10px] text-neutral-400 mr-1">Less</span>
          <div className="w-4 h-4 rounded-sm bg-neutral-100 dark:bg-neutral-800" />
          <div className="w-4 h-4 rounded-sm bg-indigo-200 dark:bg-indigo-900/40" />
          <div className="w-4 h-4 rounded-sm bg-indigo-300 dark:bg-indigo-800/50" />
          <div className="w-4 h-4 rounded-sm bg-indigo-400 dark:bg-indigo-700/60" />
          <div className="w-4 h-4 rounded-sm bg-indigo-500 dark:bg-indigo-600" />
          <span className="text-[10px] text-neutral-400 ml-1">More</span>
        </div>
      </div>
    </div>
  );
}
