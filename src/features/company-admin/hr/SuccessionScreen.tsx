import { GitFork } from "lucide-react";

export function SuccessionScreen() {
    return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4 animate-in fade-in duration-500">
            <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <GitFork className="w-7 h-7 text-primary-400" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-400 dark:text-neutral-500">Succession Planning</h2>
            <p className="text-neutral-500 dark:text-neutral-400">Screen pending implementation</p>
        </div>
    );
}
