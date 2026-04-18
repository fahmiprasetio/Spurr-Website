"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export type CarCarouselImage = {
  src: string;
  label: string;
};

type CarImageCarouselProps = {
  carName: string;
  images: CarCarouselImage[];
};

function wrapIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  if (index < 0) return total - 1;
  if (index >= total) return 0;
  return index;
}

export default function CarImageCarousel({ carName, images }: CarImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const hasMultipleImages = images.length > 1;

  useEffect(() => {
    setActiveIndex(0);
    setIsLoaded(false);
  }, [images.length, images[0]?.src]);

  const activeImage = images[activeIndex] ?? null;

  if (!activeImage) {
    return (
      <div className="flex aspect-video items-center justify-center bg-white text-xs uppercase tracking-[0.18em] text-gray-400">
        Image unavailable
      </div>
    );
  }

  function goToPreviousImage() {
    setActiveIndex((currentIndex) => wrapIndex(currentIndex - 1, images.length));
  }

  function goToNextImage() {
    setActiveIndex((currentIndex) => wrapIndex(currentIndex + 1, images.length));
  }

  return (
    <div>
      <div className="relative aspect-video bg-white">
        <Image
          src={activeImage.src}
          alt={`${carName} - ${activeImage.label} view`}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 65vw, 800px"
          className="object-contain"
          style={{ backgroundColor: "#ffffff" }}
          onLoad={() => setIsLoaded(true)}
        />

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={goToPreviousImage}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 border border-black/20 bg-white/90 px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
            >
              {"<"}
            </button>
            <button
              type="button"
              onClick={goToNextImage}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 border border-black/20 bg-white/90 px-2.5 py-1 text-xs font-semibold text-black hover:bg-black hover:text-white"
            >
              {">"}
            </button>
            <div className="absolute bottom-3 right-3 border border-black/20 bg-white/90 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-black">
              {activeIndex + 1}/{images.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="grid grid-cols-2 gap-2 border-t border-black/10 bg-[#fafafa] p-3 sm:grid-cols-4">
          {images.map((image, imageIndex) => {
            const isActive = imageIndex === activeIndex;

            return (
              <button
                key={`${image.src}-${imageIndex}`}
                type="button"
                onClick={() => setActiveIndex(imageIndex)}
                aria-label={`Show ${image.label} image`}
                aria-pressed={isActive}
                className={`relative border px-1.5 py-1 text-left transition-colors ${
                  isActive
                    ? "border-black bg-white"
                    : "border-black/15 bg-white/60 hover:border-black/45 hover:bg-white"
                }`}
              >
                <div className="relative h-14 w-full overflow-hidden bg-white">
                  <Image
                    src={image.src}
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover"
                    loading="lazy"
                    style={{ backgroundColor: "#ffffff" }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
