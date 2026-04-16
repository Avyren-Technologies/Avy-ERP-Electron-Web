import { Keyboard, X } from "lucide-react";
import { useEffect } from "react";

interface Props {
  onClose: () => void;
}

const SHORTCUTS = [
  { key: "J  /  ↓", action: "Next difference" },
  { key: "K  /  ↑", action: "Previous difference" },
  { key: "C", action: "Confirm current difference" },
  { key: "D", action: "Dismiss current difference" },
  { key: "E", action: "Open correction editor" },
  { key: "F", action: "Flag for review" },
  { key: "Space", action: "Jump to next unverified" },
  { key: "?", action: "Toggle this help" },
];

export function KeyboardShortcutsHelp({ onClose }: Props) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-semibold text-neutral-800">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4 text-neutral-500" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="px-5 py-4 divide-y divide-neutral-100">
          {SHORTCUTS.map(({ key, action }) => (
            <div
              key={key}
              className="flex items-center justify-between py-2.5"
            >
              <kbd className="inline-flex items-center rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-sm font-mono font-semibold text-neutral-700 shadow-sm min-w-[60px] justify-center">
                {key}
              </kbd>
              <span className="text-sm text-neutral-600 text-right">
                {action}
              </span>
            </div>
          ))}
        </div>

        <div className="px-5 py-3 border-t border-neutral-100 bg-neutral-50">
          <p className="text-xs text-neutral-400 text-center">
            Press <kbd className="font-mono text-xs">Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
}
