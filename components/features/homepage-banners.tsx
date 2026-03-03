"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBanners } from "@/hooks/queries/useBanners";

export function HomepageBanners() {
  const tc = useTranslations("common");
  const [currentIndex, setCurrentIndex] = useState(0);

  const { data: banners = [] } = useBanners();

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  // Auto-advance every 5 seconds
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [banners.length, nextSlide]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

  return (
    <section className="relative overflow-hidden bg-muted">
      <div className="container mx-auto px-4">
        <div className="relative aspect-[3/1] md:aspect-[4/1] rounded-lg overflow-hidden">
          {/* Banner Image */}
          {current.imageUrl ? (
            <Image
              src={current.imageUrl}
              alt={current.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/5" />
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/30 flex items-center">
            <div className="container mx-auto px-8">
              <h2 className="text-white text-xl md:text-3xl font-bold max-w-lg">
                {current.title}
              </h2>
              {current.description && (
                <p className="text-white/80 mt-2 max-w-md text-sm md:text-base">
                  {current.description}
                </p>
              )}
              {current.targetUrl && (
                <Button className="mt-4" size="sm" asChild>
                  <Link href={current.targetUrl}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Arrows */}
          {banners.length > 1 && (
            <>
              <button
                onClick={prevSlide}
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                aria-label={tc("previous")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1.5 transition-colors"
                aria-label={tc("next")}
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* Dots */}
          {banners.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
              {banners.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === currentIndex ? "bg-white" : "bg-white/50"
                  )}
                  aria-label={tc("slideN", { n: i + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
