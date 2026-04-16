import { useCallback, useState } from "react";
import { FileText, Play, Upload, X } from "lucide-react";
import { showApiError } from "@/lib/toast";
import { useCreateJob, useStartJob } from "../api/use-docdiff-mutations";
import { ModelSelector } from "./ModelSelector";

interface Props {
  onJobCreated: (jobId: string) => void;
}

interface DropZoneProps {
  label: string;
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}

function DropZone({ label, file, onFile, onClear }: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = (f: File): string | null => {
    if (!f.name.toLowerCase().endsWith(".pdf"))
      return "Only PDF files are supported";
    if (f.size > 50 * 1024 * 1024) return "File must be under 50 MB";
    return null;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const dropped = e.dataTransfer.files[0];
      if (!dropped) return;
      const err = validateFile(dropped);
      if (err) {
        showApiError(new Error(err));
        return;
      }
      onFile(dropped);
    },
    [onFile],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    const err = validateFile(selected);
    if (err) {
      showApiError(new Error(err));
      return;
    }
    onFile(selected);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer min-h-[180px] ${
        isDragOver
          ? "border-indigo-400 bg-indigo-50"
          : file
            ? "border-green-400 bg-green-50"
            : "border-neutral-300 bg-neutral-50 hover:border-indigo-300 hover:bg-indigo-50/40"
      }`}
    >
      <input
        type="file"
        accept=".pdf"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleChange}
      />
      {file ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <FileText className="h-8 w-8 text-green-600" />
          <span className="text-sm font-medium text-green-700 max-w-[200px] truncate">
            {file.name}
          </span>
          <span className="text-xs text-neutral-500">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
          >
            <X className="h-3 w-3" /> Remove
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 text-center pointer-events-none">
          <Upload className="h-8 w-8 text-neutral-400" />
          <p className="text-sm font-medium text-neutral-600">{label}</p>
          <p className="text-xs text-neutral-400">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-neutral-400">PDF only, max 50 MB</p>
        </div>
      )}
    </div>
  );
}

export function UploadView({ onJobCreated }: Props) {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [labelA, setLabelA] = useState("Version A");
  const [labelB, setLabelB] = useState("Version B");
  const [provider, setProvider] = useState("anthropic");
  const [modelName, setModelName] = useState("claude-sonnet-4-6");
  const [autoConfirmThreshold, setAutoConfirmThreshold] = useState(0.95);

  const createJob = useCreateJob();
  const startJob = useStartJob();

  const handleModelChange = (p: string, m: string) => {
    setProvider(p);
    setModelName(m);
  };

  const handleSubmit = async () => {
    if (!fileA || !fileB) return;

    const formData = new FormData();
    formData.append("version_a", fileA);
    formData.append("version_b", fileB);
    formData.append("model_provider", provider);
    formData.append("model_name", modelName);
    formData.append("label_a", labelA);
    formData.append("label_b", labelB);
    formData.append(
      "auto_confirm_threshold",
      autoConfirmThreshold.toString(),
    );

    try {
      const createResult = await createJob.mutateAsync(formData);
      const jobId = createResult.data.id;
      await startJob.mutateAsync(jobId);
      onJobCreated(jobId);
    } catch {
      /* errors handled by mutation onError */
    }
  };

  const isLoading = createJob.isPending || startJob.isPending;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-neutral-800 mb-1">
          Compare Documents
        </h1>
        <p className="text-sm text-neutral-500">
          Upload two PDF versions to detect and verify differences
        </p>
      </div>

      {/* File upload zones */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={labelA}
            onChange={(e) => setLabelA(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Label for Version A"
          />
          <DropZone
            label="Drop Version A here"
            file={fileA}
            onFile={setFileA}
            onClear={() => setFileA(null)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="text"
            value={labelB}
            onChange={(e) => setLabelB(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            placeholder="Label for Version B"
          />
          <DropZone
            label="Drop Version B here"
            file={fileB}
            onFile={setFileB}
            onClear={() => setFileB(null)}
          />
        </div>
      </div>

      {/* Settings */}
      <div className="bg-white rounded-xl border border-neutral-200 p-5 flex flex-col gap-5 mb-6">
        <ModelSelector
          provider={provider}
          model={modelName}
          onChange={handleModelChange}
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-neutral-700">
              Auto-confirm threshold
            </label>
            <span className="text-sm font-semibold text-indigo-600">
              {autoConfirmThreshold.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={0.5}
            max={1.0}
            step={0.01}
            value={autoConfirmThreshold}
            onChange={(e) =>
              setAutoConfirmThreshold(parseFloat(e.target.value))
            }
            className="w-full accent-indigo-600"
          />
          <div className="flex justify-between text-xs text-neutral-400 mt-1">
            <span>0.50 (confirm more)</span>
            <span>1.00 (confirm only certain)</span>
          </div>
        </div>
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!fileA || !fileB || isLoading}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              />
            </svg>
            Starting comparison...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Compare Documents
          </>
        )}
      </button>
    </div>
  );
}
