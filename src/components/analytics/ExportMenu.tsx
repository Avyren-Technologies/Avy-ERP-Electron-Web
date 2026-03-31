import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { analyticsApi } from '@/lib/api/analytics';
import { showSuccess, showApiError } from '@/lib/toast';

interface ExportMenuProps {
  reportType: string;
  filters: Record<string, unknown>;
}

type ExportFormat = 'xlsx' | 'pdf' | 'csv';

const formatOptions: { format: ExportFormat; label: string; icon: typeof FileSpreadsheet }[] = [
  { format: 'xlsx', label: 'Excel (.xlsx)', icon: FileSpreadsheet },
  { format: 'pdf', label: 'PDF (.pdf)', icon: FileText },
  { format: 'csv', label: 'CSV (.csv)', icon: File },
];

export function ExportMenu({ reportType, filters }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleExport = async (format: ExportFormat) => {
    setExporting(true);
    setOpen(false);

    try {
      const response = await analyticsApi.exportReport(reportType, { ...filters, format });
      const blob = new Blob([response.data], { type: response.headers['content-type'] });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${reportType}-report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showSuccess(`${format.toUpperCase()} report downloaded`);
    } catch (err) {
      showApiError(err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className={cn(
          'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all',
          'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
          'hover:bg-indigo-100 dark:hover:bg-indigo-900/30',
          'border border-indigo-200/60 dark:border-indigo-800/60',
          exporting && 'opacity-50 cursor-not-allowed',
        )}
      >
        <Download className={cn('h-3.5 w-3.5', exporting && 'animate-pulse')} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 w-44 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {formatOptions.map(({ format, label, icon: Icon }) => (
            <button
              key={format}
              type="button"
              onClick={() => handleExport(format)}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              <Icon className="h-4 w-4 text-neutral-400" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
