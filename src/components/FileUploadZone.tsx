import { useRef, useState, useCallback } from 'react';
import { Upload, CheckCircle, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  onFileSelected: (file: File) => void;
  isUploading: boolean;
  uploadedFileName?: string | null;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
  error?: string | null;
  onClear?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  onFileSelected,
  isUploading,
  uploadedFileName,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx',
  maxSizeMB = 10,
  label = 'Drag and drop your file here, or click to browse',
  error,
  onClear,
}: FileUploadZoneProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileSize, setSelectedFileSize] = useState<number>(0);

  const handleFile = useCallback((file: File) => {
    setSelectedFileName(file.name);
    setSelectedFileSize(file.size);
    onFileSelected(file);
  }, [onFileSelected]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (fileRef.current) fileRef.current.value = '';
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setSelectedFileName(null);
    setSelectedFileSize(0);
    onClear?.();
  }, [onClear]);

  const displayName = uploadedFileName || selectedFileName;

  if (displayName && !isUploading) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-xl border border-success-200 dark:border-success-800/50 bg-success-50/50 dark:bg-success-900/10">
        <CheckCircle className="w-5 h-5 text-success-600 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-success-800 dark:text-success-400 truncate">{displayName}</p>
          {selectedFileSize > 0 && <p className="text-xs text-success-600 dark:text-success-500">{formatFileSize(selectedFileSize)}</p>}
        </div>
        {onClear && (
          <button type="button" onClick={handleClear} className="p-1 text-neutral-400 hover:text-danger-500 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  if (isUploading) {
    return (
      <div className="flex items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-primary-300 dark:border-primary-700 bg-primary-50/50 dark:bg-primary-900/10">
        <Loader2 className="w-5 h-5 text-primary-600 animate-spin" />
        <p className="text-sm font-medium text-primary-700 dark:text-primary-400">Uploading {selectedFileName}...</p>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          'flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors',
          isDragging
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700 hover:bg-neutral-50 dark:hover:bg-neutral-800/50',
          error && 'border-danger-300 dark:border-danger-700'
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center',
          isDragging ? 'bg-primary-100 dark:bg-primary-900/30' : 'bg-neutral-100 dark:bg-neutral-800'
        )}>
          <Upload className={cn('w-5 h-5', isDragging ? 'text-primary-600' : 'text-neutral-400')} />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">{label}</p>
        <p className="text-xs text-neutral-400 dark:text-neutral-500">Max {maxSizeMB} MB</p>
      </div>
      {error && <p className="text-xs text-danger-500 mt-1.5">{error}</p>}
      <input ref={fileRef} type="file" accept={accept} onChange={handleInputChange} className="hidden" />
    </div>
  );
}
