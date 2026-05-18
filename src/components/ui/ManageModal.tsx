import { useState, useEffect, useCallback } from "react";
import { X, Edit3, Trash2, Check, Loader2 } from "lucide-react";
import { showApiError, showSuccess } from "@/lib/toast";

/* ── Types ── */

export interface ManageModalItem {
  id: string;
  name: string;
  code?: string | null;
  abbreviation?: string | null;
}

export interface ManageModalField {
  key: string;
  label: string;
  placeholder: string;
  required?: boolean;
}

export interface ManageModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  items: ManageModalItem[];
  isLoading: boolean;
  createFields: ManageModalField[];
  onCreate: (values: Record<string, string>) => Promise<any>;
  onUpdate: (id: string, values: Record<string, string>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

/* ── Component ── */

export function ManageModal({
  open,
  onClose,
  title,
  items,
  isLoading,
  createFields,
  onCreate,
  onUpdate,
  onDelete,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: ManageModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [createValues, setCreateValues] = useState<Record<string, string>>({});

  // Reset internal state when modal closes
  useEffect(() => {
    if (!open) {
      setEditingId(null);
      setEditValue("");
      setDeletingId(null);
      setCreateValues({});
    }
  }, [open]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [open]);

  const resetCreate = useCallback(() => {
    setCreateValues({});
  }, []);

  /* ── Handlers ── */

  const handleStartEdit = (item: ManageModalItem) => {
    setEditingId(item.id);
    setEditValue(item.name);
    setDeletingId(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editValue.trim()) return;
    try {
      await onUpdate(editingId, { name: editValue.trim() });
      showSuccess("Updated successfully");
      setEditingId(null);
      setEditValue("");
    } catch (err) {
      showApiError(err);
    }
  };

  const handleStartDelete = (id: string) => {
    setDeletingId(id);
    setEditingId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    try {
      await onDelete(deletingId);
      showSuccess("Deleted successfully");
      setDeletingId(null);
    } catch (err) {
      showApiError(err);
    }
  };

  const handleCreate = async () => {
    // Validate required fields
    for (const field of createFields) {
      if (field.required !== false && !createValues[field.key]?.trim()) {
        showApiError(new Error(`${field.label} is required`));
        return;
      }
    }

    const trimmed: Record<string, string> = {};
    for (const field of createFields) {
      const val = createValues[field.key]?.trim() ?? "";
      if (val) trimmed[field.key] = val;
    }

    try {
      await onCreate(trimmed);
      showSuccess("Created successfully");
      resetCreate();
    } catch (err) {
      showApiError(err);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 dark:hover:text-neutral-300 dark:hover:bg-neutral-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* ── Existing items list ── */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary-500" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-6">
              No items yet. Add one below.
            </p>
          ) : (
            <div className="space-y-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 group"
                >
                  {/* Editing row */}
                  {editingId === item.id ? (
                    <>
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveEdit();
                          if (e.key === "Escape") handleCancelEdit();
                        }}
                        className="flex-1 px-3 py-1.5 bg-white dark:bg-neutral-700 border border-primary-300 dark:border-primary-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:text-white"
                      />
                      <button
                        onClick={handleSaveEdit}
                        disabled={isUpdating}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {isUpdating ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          <Check size={12} />
                        )}
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        Cancel
                      </button>
                    </>
                  ) : deletingId === item.id ? (
                    /* Delete confirmation */
                    <>
                      <span className="flex-1 text-sm text-red-600 dark:text-red-400 font-medium">
                        Delete?
                      </span>
                      <button
                        onClick={handleConfirmDelete}
                        disabled={isDeleting}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-1"
                      >
                        {isDeleting ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : null}
                        Yes
                      </button>
                      <button
                        onClick={() => setDeletingId(null)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                      >
                        No
                      </button>
                    </>
                  ) : (
                    /* Normal row */
                    <>
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        {item.code && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 shrink-0">
                            {item.code}
                          </span>
                        )}
                        <span className="text-sm text-neutral-800 dark:text-neutral-200 truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                          title="Edit"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleStartDelete(item.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── Add New section ── */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4">
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-3">
              Add New
            </p>
            <div className="space-y-3">
              {createFields.map((field) => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1">
                    {field.label}
                    {field.required !== false && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={createValues[field.key] ?? ""}
                    onChange={(e) =>
                      setCreateValues((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:text-white placeholder:text-neutral-400 transition-all"
                  />
                </div>
              ))}
            </div>
            <div className="flex items-center justify-end gap-2 mt-3">
              <button
                onClick={resetCreate}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={isCreating}
                className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {isCreating && <Loader2 size={12} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={onClose}
            className="w-full py-2 text-sm font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
