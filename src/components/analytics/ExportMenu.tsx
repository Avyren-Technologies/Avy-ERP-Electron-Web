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

const formatOptions: { format: ExportFormat; label: string; description: string; icon: typeof FileSpreadsheet; iconColor: string; iconBg: string }[] = [
  { format: 'xlsx', label: 'Excel', description: '.xlsx with formatting', icon: FileSpreadsheet, iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { format: 'pdf', label: 'PDF', description: '.pdf summary report', icon: FileText, iconColor: 'text-red-500', iconBg: 'bg-red-50 dark:bg-red-900/20' },
  { format: 'csv', label: 'CSV', description: '.csv raw data', icon: File, iconColor: 'text-blue-500', iconBg: 'bg-blue-50 dark:bg-blue-900/20' },
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
          'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
          'bg-gradient-to-r from-indigo-500 to-violet-500 text-white',
          'hover:from-indigo-600 hover:to-violet-600 hover:shadow-lg hover:shadow-indigo-500/20',
          'active:scale-95',
          exporting && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Download className={cn('h-3.5 w-3.5', exporting && 'animate-bounce')} />
        Export
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-52 bg-white dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 rounded-2xl shadow-2xl shadow-black/10 overflow-hidden animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="p-1.5">
            {formatOptions.map(({ format, label, description, icon: Icon, iconColor, iconBg }) => (
              <button
                key={format}
                type="button"
                onClick={() => handleExport(format)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors"
              >
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', iconBg)}>
                  <Icon className={cn('h-4 w-4', iconColor)} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">{label}</div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">{description}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
