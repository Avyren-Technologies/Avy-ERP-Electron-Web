import { useEffect, useCallback, useState } from "react";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";

interface ImageViewerProps {
    images: Array<{ fileName: string; fileUrl: string }>;
    initialIndex?: number;
    isOpen: boolean;
    onClose: () => void;
}

export function ImageViewer({ images, initialIndex = 0, isOpen, onClose }: ImageViewerProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [zoomed, setZoomed] = useState(false);

    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
            setZoomed(false);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen, initialIndex]);

    const goNext = useCallback(() => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev + 1) % images.length);
            setZoomed(false);
        }
    }, [images.length]);

    const goPrev = useCallback(() => {
        if (images.length > 1) {
            setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
            setZoomed(false);
        }
    }, [images.length]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "Escape") onClose();
            else if (e.key === "ArrowRight") goNext();
            else if (e.key === "ArrowLeft") goPrev();
        },
        [isOpen, onClose, goNext, goPrev],
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen || images.length === 0) return null;

    const current = images[currentIndex];
    if (!current) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title="Close (Esc)"
            >
                <X size={20} />
            </button>

            {/* Zoom toggle */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setZoomed((z) => !z);
                }}
                className="absolute top-4 right-16 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                title={zoomed ? "Fit to screen" : "Original size"}
            >
                {zoomed ? <ZoomOut size={20} /> : <ZoomIn size={20} />}
            </button>

            {/* Counter */}
            {images.length > 1 && (
                <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm font-medium">
                    {currentIndex + 1} / {images.length}
                </div>
            )}

            {/* Prev arrow */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        goPrev();
                    }}
                    className="absolute left-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    title="Previous (Left arrow)"
                >
                    <ChevronLeft size={24} />
                </button>
            )}

            {/* Next arrow */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        goNext();
                    }}
                    className="absolute right-4 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                    title="Next (Right arrow)"
                >
                    <ChevronRight size={24} />
                </button>
            )}

            {/* Image container */}
            <div
                className="flex flex-col items-center max-h-[90vh] max-w-[90vw]"
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className={
                        zoomed
                            ? "overflow-auto max-h-[80vh] max-w-[90vw] cursor-zoom-out"
                            : "flex items-center justify-center max-h-[80vh] max-w-[90vw] cursor-zoom-in"
                    }
                    onClick={() => setZoomed((z) => !z)}
                >
                    <img
                        src={current.fileUrl}
                        alt={current.fileName}
                        className={
                            zoomed
                                ? "max-w-none"
                                : "max-h-[80vh] max-w-[90vw] object-contain rounded-lg"
                        }
                        draggable={false}
                    />
                </div>

                {/* Filename */}
                <p className="mt-3 text-sm text-white/80 font-medium text-center truncate max-w-[80vw]">
                    {current.fileName}
                </p>
            </div>
        </div>
    );
}
