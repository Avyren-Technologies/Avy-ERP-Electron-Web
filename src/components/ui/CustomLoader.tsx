import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CustomLoaderProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
    text?: string;
    fullScreen?: boolean;
}

const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
    xl: "w-16 h-16",
};

export function CustomLoader({ size = "md", className, text, fullScreen = false }: CustomLoaderProps) {
    const content = (
        <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
            <div className="relative flex items-center justify-center">
                {/* Outer glowing ring */}
                <div className={cn(
                    "absolute rounded-full border border-primary-500/30 blur-sm animate-pulse",
                    sizeClasses[size]
                )} />
                {/* Main spinner */}
                <Loader2
                    className={cn(
                        "animate-spin text-primary-600",
                        sizeClasses[size]
                    )}
                />
                {/* Inner gradient dot */}
                <div className="absolute w-1/4 h-1/4 rounded-full bg-gradient-to-tr from-primary-500 to-accent-500 blur-[2px]" />
            </div>
            {text && (
                <span className="text-sm font-medium text-neutral-500 animate-pulse">
                    {text}
                </span>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                {content}
            </div>
        );
    }

    return content;
}
