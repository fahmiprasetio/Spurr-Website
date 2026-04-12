"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Car } from "@/data/cars";

type CarCardProps = {
  car: Car;
  sequenceFrames?: string[];
  href?: string;
};

export default function CarCard({ car, sequenceFrames = [], href }: CarCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const currentFrameRef = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceWarmedRef = useRef(false);
  const loadedSrcRef = useRef<Set<string>>(new Set());
  const loadingSrcRef = useRef<Set<string>>(new Set());
  const frames = sequenceFrames;
  const sequenceFolderPath =
    car.sequenceFolder && car.sequenceFolder.trim() !== ""
      ? `${car.sequenceFolder}/`
      : "";

  // Animation logic: keep per-frame speed consistent across cars.
  // This lets each sequence finish naturally based on its own frame count.
  const FORWARD_FPS = 24;
  const REVERSE_FPS = 20;

  useEffect(() => {
    const node = cardRef.current;
    if (!node || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isInView]);

  useEffect(() => {
    if (!href || !isInView) return;
    router.prefetch(href);
  }, [href, isInView, router]);

  const getFrameUrl = useCallback(
    (index: number) => {
      if (frames.length === 0) return "";
      return `/car-image(sequences)/${sequenceFolderPath}${frames[index]}`;
    },
    [frames, sequenceFolderPath]
  );

  const setFrameOnImage = useCallback(
    (index: number) => {
      if (!imageRef.current || frames.length === 0) return;

      const safeIndex = Math.min(Math.max(index, 0), frames.length - 1);
      if (safeIndex === currentFrameRef.current) return;

      const nextSrc = getFrameUrl(safeIndex);

      const applyFrame = () => {
        if (!imageRef.current) return;
        currentFrameRef.current = safeIndex;
        imageRef.current.src = nextSrc;
      };

      if (loadedSrcRef.current.has(nextSrc)) {
        applyFrame();
        return;
      }

      if (loadingSrcRef.current.has(nextSrc)) return;

      loadingSrcRef.current.add(nextSrc);
      const preloadImage = new Image();
      preloadImage.decoding = "async";
      preloadImage.onload = async () => {
        loadingSrcRef.current.delete(nextSrc);
        loadedSrcRef.current.add(nextSrc);

        // Ensure image bytes are fully decoded before replacing visible frame.
        try {
          await preloadImage.decode();
        } catch {
          // decode() may reject on some browsers even when load succeeded.
        }

        applyFrame();
      };
      preloadImage.onerror = () => {
        loadingSrcRef.current.delete(nextSrc);
      };
      preloadImage.src = nextSrc;
    },
    [frames.length, getFrameUrl]
  );

  useEffect(() => {
    if (frames.length <= 1) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const targetFrame = isHovered ? frames.length - 1 : 0;
    const step = isHovered ? 1 : -1;
    const frameInterval = Math.max(
      16,
      Math.floor(1000 / (isHovered ? FORWARD_FPS : REVERSE_FPS))
    );

    intervalRef.current = setInterval(() => {
      const prev = currentFrameRef.current;
      if (prev === targetFrame) {
        clearInterval(intervalRef.current!);
        return;
      }

      const next = prev + step;
      if (next < 0 || next > frames.length - 1) {
        clearInterval(intervalRef.current!);
        return;
      }

      setFrameOnImage(next);
    }, frameInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, frames.length, setFrameOnImage]);

  useEffect(() => {
    if (frames.length === 0) return;

    sequenceWarmedRef.current = false;
    loadedSrcRef.current.clear();
    loadingSrcRef.current.clear();
    currentFrameRef.current = -1;
    setFrameOnImage(0);
  }, [frames.length, sequenceFolderPath, setFrameOnImage]);

  useEffect(() => {
    if (!isInView || frames.length <= 1 || sequenceWarmedRef.current) return;

    // Progressive warm-up: avoid flash while keeping the main thread smoother.
    sequenceWarmedRef.current = true;
    let cancelled = false;
    let nextFrameIndex = 0;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const preloadChunk = () => {
      if (cancelled) return;

      const chunkSize = 6;
      for (
        let i = 0;
        i < chunkSize && nextFrameIndex < frames.length;
        i += 1, nextFrameIndex += 1
      ) {
        const src = getFrameUrl(nextFrameIndex);
        if (loadedSrcRef.current.has(src) || loadingSrcRef.current.has(src)) continue;

        loadingSrcRef.current.add(src);
        const img = new Image();
        img.decoding = "async";
        img.onload = () => {
          loadingSrcRef.current.delete(src);
          loadedSrcRef.current.add(src);
        };
        img.onerror = () => {
          loadingSrcRef.current.delete(src);
        };
        img.src = src;
      }

      if (nextFrameIndex < frames.length) {
        timeoutId = setTimeout(preloadChunk, 24);
      }
    };

    preloadChunk();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [isInView, frames.length, getFrameUrl]);

  const hasRealImage = Boolean(car.baseImage);
  const hasSequence = frames.length > 0;
  const infoInset = "clamp(1rem, 2.8vw, 1.6rem)";

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`group w-full ${href ? "cursor-pointer" : ""}`}
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onClick={() => {
        if (href) {
          router.push(href);
        }
      }}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (!href) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      onMouseEnter={() => {
        if (frames.length > 0 && currentFrameRef.current < 0) {
          setFrameOnImage(0);
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        if (frames.length > 1) {
          setFrameOnImage(frames.length - 1);
        }
        setIsHovered(false);
      }}
    >
      <div className="relative overflow-hidden border border-gray-200 hover:border-gray-400 hover:shadow-xl shadow-sm transition-all duration-500" style={{borderRadius: '2px', background: '#e8e8e8'}}>
        {/* Brand tag */}
        <div
          className="absolute z-10"
          style={{ top: "1rem", left: infoInset }}
        >
          <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-medium">
            {car.brand}
          </span>
        </div>
        {/* Year tag */}
        <div
          className="absolute z-10"
          style={{ top: "1rem", right: infoInset }}
        >
          <span className="text-[10px] tracking-wider text-gray-300">
            {car.year}
          </span>
        </div>
        {/* Car visual area */}
        <div className="relative w-full overflow-hidden" style={{background: 'radial-gradient(ellipse at 60% 50%, #e0e0e0 0%, #ebebeb 100%)'}}>
          {hasSequence ? (
            <img
              ref={imageRef}
              src={getFrameUrl(0)}
              alt={car.name}
              className="w-full h-auto block"
              loading="lazy"
              decoding="sync"
              style={{ backgroundColor: "#e8e8e8" }}
              onLoad={(event) => {
                const loadedSrc = event.currentTarget.getAttribute("src");
                if (loadedSrc) loadedSrcRef.current.add(loadedSrc);
              }}
              draggable={false}
            />
          ) : hasRealImage ? (
            <img
              src={`/car-image(based)/${car.baseImage}`}
              alt={car.name}
              className="w-full h-auto block"
              loading="lazy"
              decoding="async"
              style={{ backgroundColor: "#e8e8e8" }}
              draggable={false}
            />
          ) : (
            <div className="w-full aspect-8/3 flex items-center justify-center text-[11px] tracking-[0.14em] uppercase text-gray-400">
              Image unavailable
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-white/60 to-transparent pointer-events-none z-10" />
        </div>
        {/* Car info */}
        <div className="relative" style={{ paddingBlock: "1rem" }}>
          <div
            style={{
              width: `calc(100% - (${infoInset} * 2))`,
              marginInline: "auto",
            }}
          >
          <div className="flex items-end justify-between mb-3" style={{ columnGap: "1rem" }}>
            <div>
              <h3 className="text-lg font-semibold text-black tracking-tight">
                {car.name}
              </h3>
              <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">
                {car.brand}
              </p>
            </div>
            <motion.div
              animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <svg
                className="w-5 h-5 text-black"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </motion.div>
          </div>

          {/* Specs - visible on hover */}
          <motion.div
            animate={{
              height: isHovered ? "auto" : 0,
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 pt-4 mt-2">
              <p className="text-xs text-gray-500 leading-relaxed mb-4">
                {car.description}
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-sm font-semibold text-black">
                    {car.power}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    Power
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">
                    {car.topSpeed}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    Top Speed
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-black">
                    {car.acceleration}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                    0-100
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
