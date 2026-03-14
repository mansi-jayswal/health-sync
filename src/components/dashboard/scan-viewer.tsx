"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  X,
  Maximize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, getErrorMessage } from "@/lib/utils";
import { useStudyScanSignedUrl } from "@/hooks/use-scan-images";
import type { ScanImage } from "@/types/schemas";

const ZOOM_STEP = 0.25;
const WHEEL_STEP = 0.1;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;

interface ScanViewerProps {
  studyId: string;
  images: ScanImage[];
  initialIndex?: number;
  onClose: () => void;
}

type Point = { x: number; y: number };

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function ScanViewer({
  studyId,
  images,
  initialIndex = 0,
  onClose,
}: ScanViewerProps) {
  const [currentIndex, setCurrentIndex] = React.useState(() =>
    clamp(initialIndex, 0, Math.max(images.length - 1, 0))
  );
  const [zoom, setZoom] = React.useState(1);
  const [panOffset, setPanOffset] = React.useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState<Point>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const viewerRef = React.useRef<HTMLDivElement | null>(null);

  const currentImage = images[currentIndex];
  const nextImage = images[currentIndex + 1];

  const {
    data: activeUrl,
    isLoading,
    isError,
    error,
    refetch,
  } = useStudyScanSignedUrl(studyId, currentImage?.id ?? "", {
    enabled: Boolean(currentImage?.id),
  });

  useStudyScanSignedUrl(studyId, nextImage?.id ?? "", {
    enabled: Boolean(nextImage?.id),
  });

  const resetView = React.useCallback(() => {
    setZoom(1);
    setPanOffset({ x: 0, y: 0 });
  }, []);

  const goToPrev = React.useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    resetView();
  }, [resetView]);

  const goToNext = React.useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, images.length - 1));
    resetView();
  }, [images.length, resetView]);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        goToPrev();
      }
      if (event.key === "ArrowRight") {
        goToNext();
      }
      if (event.key === "Escape" && !isFullscreen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goToPrev, goToNext, isFullscreen, onClose]);

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  React.useEffect(() => {
    if (images.length === 0) return;
    if (currentIndex > images.length - 1) {
      setCurrentIndex(images.length - 1);
      resetView();
    }
  }, [currentIndex, images.length, resetView]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -WHEEL_STEP : WHEEL_STEP;
    setZoom((prev) => clamp(prev + delta, MIN_ZOOM, MAX_ZOOM));
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    setDragStart({ x: event.clientX - panOffset.x, y: event.clientY - panOffset.y });
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1) return;
    setPanOffset({
      x: event.clientX - dragStart.x,
      y: event.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleFullscreenToggle = async () => {
    if (!viewerRef.current) return;
    if (!document.fullscreenElement) {
      await viewerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const total = images.length;
  const atStart = currentIndex === 0;
  const atEnd = total === 0 ? true : currentIndex === total - 1;

  return (
    <div
      ref={viewerRef}
      className="fixed inset-0 z-50 flex flex-col bg-black/95"
      role="dialog"
      aria-label="Scan viewer"
    >
      <div className="flex items-center justify-between gap-2 border-b border-white/10 bg-black/80 px-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToPrev}
            disabled={atStart}
            aria-label="Previous scan"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm tabular-nums text-muted-foreground">
            {total === 0 ? "0 / 0" : `${currentIndex + 1} / ${total}`}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={atEnd}
            aria-label="Next scan"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((prev) => clamp(prev - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
            aria-label="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={resetView}
            aria-label="Reset view"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setZoom((prev) => clamp(prev + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM))}
            aria-label="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleFullscreenToggle}
            aria-label="Toggle fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close viewer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {total === 0 && (
          <div className="text-sm text-muted-foreground">No scans to display.</div>
        )}
        {total > 0 && isLoading && <Skeleton className="h-64 w-64 bg-white/10" />}
        {isError && (
          <div className="flex flex-col items-center gap-3 text-sm text-muted-foreground">
            <p>{getErrorMessage(error, "Failed to load scan.")}</p>
            <Button type="button" variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}
        {!isLoading && !isError && total > 0 && activeUrl?.url && (
          <img
            src={activeUrl.url}
            alt={`Scan ${currentIndex + 1}`}
            draggable={false}
            className={cn(
              "max-h-full max-w-full select-none",
              zoom > 1 && "cursor-grab",
              isDragging && "cursor-grabbing"
            )}
            style={{
              transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
              transformOrigin: "center center",
              willChange: "transform",
            }}
          />
        )}
      </div>
    </div>
  );
}
