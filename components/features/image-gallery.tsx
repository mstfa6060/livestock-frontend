"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageGalleryProps {
  images: string[];
  alt: string;
  className?: string;
}

export function ImageGallery({ images, alt, className }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Use placeholder if no images
  const displayImages = images.length > 0 ? images : ["/placeholder-product.jpg"];

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === displayImages.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isLightboxOpen) return;
      if (e.key === "Escape") setIsLightboxOpen(false);
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    },
    [isLightboxOpen]
  );

  useEffect(() => {
    if (isLightboxOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isLightboxOpen, handleKeyDown]);

  return (
    <>
      <div className={cn("flex flex-col gap-4", className)}>
        {/* Main Image */}
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted group">
          <Image
            src={displayImages[selectedIndex]}
            alt={`${alt} - ${selectedIndex + 1}`}
            fill
            className="object-cover cursor-zoom-in"
            onClick={() => setIsLightboxOpen(true)}
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />

          {/* Zoom Button */}
          <Button
            variant="secondary"
            size="icon"
            className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => setIsLightboxOpen(true)}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          {/* Navigation Arrows */}
          {displayImages.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={goToNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          )}

          {/* Image Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-2 py-1 rounded">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>

        {/* Thumbnails */}
        {displayImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {displayImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={cn(
                  "relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden border-2 transition-colors",
                  selectedIndex === index
                    ? "border-primary"
                    : "border-transparent hover:border-muted-foreground/50"
                )}
              >
                <Image
                  src={image}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close Button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setIsLightboxOpen(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          {/* Navigation */}
          {displayImages.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Image */}
          <div
            className="relative w-full h-full max-w-5xl max-h-[80vh] m-8"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={displayImages[selectedIndex]}
              alt={`${alt} - ${selectedIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>

          {/* Counter */}
          {displayImages.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
              {selectedIndex + 1} / {displayImages.length}
            </div>
          )}
        </div>
      )}
    </>
  );
}
