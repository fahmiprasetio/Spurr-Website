"use client";

import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Car } from "@/data/cars";

type QualityTier = "high" | "balanced" | "light";

type NavigatorWithPerformanceHints = Navigator & {
  deviceMemory?: number;
  connection?: {
    effectiveType?: string;
    saveData?: boolean;
  };
};

type CarCardProps = {
  car: Car;
  sequenceFrames?: string[];
  href?: string;
  alwaysShowDetails?: boolean;
  performanceMode?: "auto" | "light";
};

export default function CarCard({
  car,
  sequenceFrames = [],
  href,
  alwaysShowDetails = false,
  performanceMode = "auto",
}: CarCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isSequenceReady, setIsSequenceReady] = useState(false);
  const [qualityTier, setQualityTier] = useState<QualityTier>(
    performanceMode === "light" ? "light" : "balanced"
  );
  const cardRef = useRef<HTMLDivElement | null>(null);
  const frontImageRef = useRef<HTMLImageElement | null>(null);
  const backImageRef = useRef<HTMLImageElement | null>(null);
  const currentFrameRef = useRef(-1);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceWarmedRef = useRef(false);
  const routePrefetchedRef = useRef(false);
  const isFrontVisibleRef = useRef(true);
  const requestedFrameRef = useRef(0);
  const sequenceReadyRef = useRef(false);
  const sequenceWarmupPromiseRef = useRef<Promise<void> | null>(null);
  const swapTokenRef = useRef(0);
  const loadedSrcRef = useRef<Set<string>>(new Set());
  const loadingSrcRef = useRef<Set<string>>(new Set());
  const frames = sequenceFrames;
  const sequenceFolderPath =
    car.sequenceFolder && car.sequenceFolder.trim() !== ""
      ? `${car.sequenceFolder}/`
      : "";

  const FORWARD_FPS = qualityTier === "high" ? 24 : qualityTier === "balanced" ? 20 : 16;
  const REVERSE_FPS = qualityTier === "high" ? 18 : qualityTier === "balanced" ? 15 : 12;
  const PRELOAD_CONCURRENCY =
    qualityTier === "high" ? 8 : qualityTier === "balanced" ? 5 : 3;
  const READY_FRAME_COUNT = qualityTier === "high" ? 20 : qualityTier === "balanced" ? 14 : 10;
  // Only reduce effective frame count during reverse hover.
  const REVERSE_FRAME_STRIDE = qualityTier === "high" ? 2 : qualityTier === "balanced" ? 2 : 3;

  useEffect(() => {
    if (performanceMode === "light") {
      setQualityTier("light");
      return;
    }

    if (typeof window === "undefined") return;

    const nav = navigator as NavigatorWithPerformanceHints;
    const cores = nav.hardwareConcurrency ?? 8;
    const memory = nav.deviceMemory ?? 8;
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = Boolean(nav.connection?.saveData);
    const effectiveType = nav.connection?.effectiveType ?? "";
    const isSlowNetwork = effectiveType.includes("2g") || effectiveType.includes("3g");

    if (prefersReducedMotion || saveData || cores <= 4 || memory <= 4 || isSlowNetwork) {
      setQualityTier("light");
      return;
    }

    if (cores <= 8 || memory <= 8) {
      setQualityTier("balanced");
      return;
    }

    setQualityTier("high");
  }, [performanceMode]);

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
      { rootMargin: "320px 0px" }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isInView]);

  const prefetchRoute = useCallback(() => {
    if (!href || routePrefetchedRef.current) return;
    routePrefetchedRef.current = true;
    router.prefetch(href);
  }, [href, router]);

  const getFrameUrl = useCallback(
    (index: number) => {
      if (frames.length === 0) return "";
      return `/car-image(sequences)/${sequenceFolderPath}${frames[index]}`;
    },
    [frames, sequenceFolderPath]
  );

  const swapVisibleFrame = useCallback((nextSrc: string, safeIndex: number) => {
    const front = frontImageRef.current;
    const back = backImageRef.current;
    if (!front || !back) return;

    const visible = isFrontVisibleRef.current ? front : back;
    const hidden = isFrontVisibleRef.current ? back : front;
    const token = ++swapTokenRef.current;

    const commitSwap = () => {
      if (swapTokenRef.current !== token) return;
      if (requestedFrameRef.current !== safeIndex) return;

      hidden.style.opacity = "1";
      visible.style.opacity = "0";
      isFrontVisibleRef.current = !isFrontVisibleRef.current;
      currentFrameRef.current = safeIndex;
      hidden.onload = null;
      hidden.onerror = null;
    };

    const decodeThenCommit = () => {
      const finalize = () => {
        commitSwap();
      };

      const decode = hidden.decode;
      if (typeof decode === "function") {
        decode.call(hidden).then(finalize).catch(finalize);
        return;
      }

      finalize();
    };

    if (hidden.getAttribute("src") !== nextSrc) {
      hidden.setAttribute("src", nextSrc);
    }

    if (hidden.complete && hidden.naturalWidth > 0) {
      loadedSrcRef.current.add(nextSrc);
      decodeThenCommit();
      return;
    }

    hidden.onload = () => {
      loadedSrcRef.current.add(nextSrc);
      decodeThenCommit();
    };
    hidden.onerror = () => {
      if (swapTokenRef.current !== token) return;
      hidden.onerror = null;
      hidden.onload = null;
    };
  }, []);

  const preloadFrame = useCallback((src: string) => {
    if (loadedSrcRef.current.has(src)) {
      return Promise.resolve();
    }

    if (loadingSrcRef.current.has(src)) {
      return new Promise<void>((resolve) => {
        const check = () => {
          if (loadedSrcRef.current.has(src) || !loadingSrcRef.current.has(src)) {
            resolve();
            return;
          }

          setTimeout(check, 16);
        };

        check();
      });
    }

    loadingSrcRef.current.add(src);

    return new Promise<void>((resolve) => {
      const img = new Image();
      img.decoding = "async";
      img.onload = async () => {
        loadingSrcRef.current.delete(src);
        loadedSrcRef.current.add(src);

        try {
          await img.decode();
        } catch {
          // decode() may reject in some browsers even if image loaded.
        }

        resolve();
      };
      img.onerror = () => {
        loadingSrcRef.current.delete(src);
        resolve();
      };
      img.src = src;
    });
  }, []);

  const ensureSequenceReady = useCallback(async () => {
    if (frames.length <= 1) {
      sequenceReadyRef.current = true;
      setIsSequenceReady(true);
      return;
    }

    if (sequenceReadyRef.current) {
      if (!isSequenceReady) {
        setIsSequenceReady(true);
      }
      return;
    }

    if (!sequenceWarmupPromiseRef.current) {
      sequenceWarmupPromiseRef.current = (async () => {
        const readyFrameCount = Math.min(frames.length, READY_FRAME_COUNT);

        // Load a near-term chunk first so hover can start quickly on slower networks.
        if (readyFrameCount > 0) {
          await Promise.all(
            Array.from({ length: readyFrameCount }, (_, index) =>
              preloadFrame(getFrameUrl(index))
            )
          );
        }

        sequenceReadyRef.current = true;
        setIsSequenceReady(true);

        if (qualityTier !== "high") {
          return;
        }

        // Continue warming the remaining frames in small parallel batches.
        for (let start = readyFrameCount; start < frames.length; start += PRELOAD_CONCURRENCY) {
          const end = Math.min(start + PRELOAD_CONCURRENCY, frames.length);
          await Promise.all(
            Array.from({ length: end - start }, (_, offset) =>
              preloadFrame(getFrameUrl(start + offset))
            )
          );
        }
      })().finally(() => {
        sequenceWarmupPromiseRef.current = null;
      });
    }

    await sequenceWarmupPromiseRef.current;
  }, [
    PRELOAD_CONCURRENCY,
    READY_FRAME_COUNT,
    frames.length,
    getFrameUrl,
    isSequenceReady,
    preloadFrame,
    qualityTier,
  ]);

  const setFrameOnImage = useCallback(
    (index: number) => {
      if (!frontImageRef.current || !backImageRef.current || frames.length === 0) return;

      const safeIndex = Math.min(Math.max(index, 0), frames.length - 1);
      requestedFrameRef.current = safeIndex;
      if (safeIndex === currentFrameRef.current) return;

      const nextSrc = getFrameUrl(safeIndex);

      if (loadedSrcRef.current.has(nextSrc)) {
        swapVisibleFrame(nextSrc, safeIndex);
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

        if (requestedFrameRef.current !== safeIndex) return;

        swapVisibleFrame(nextSrc, safeIndex);
      };
      preloadImage.onerror = () => {
        loadingSrcRef.current.delete(nextSrc);
      };
      preloadImage.src = nextSrc;
    },
    [frames.length, getFrameUrl, swapVisibleFrame]
  );

  useEffect(() => {
    if (frames.length <= 1 || !isSequenceReady) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const targetFrame = isHovered ? frames.length - 1 : 0;
    const step = isHovered ? 1 : -REVERSE_FRAME_STRIDE;
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

      const reachedTarget = isHovered ? next >= targetFrame : next <= targetFrame;
      setFrameOnImage(reachedTarget ? targetFrame : next);

      if (reachedTarget) {
        clearInterval(intervalRef.current!);
      }
    }, frameInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    FORWARD_FPS,
    REVERSE_FPS,
    REVERSE_FRAME_STRIDE,
    isHovered,
    frames.length,
    isSequenceReady,
    setFrameOnImage,
  ]);

  useEffect(() => {
    if (frames.length === 0) return;

    const firstFrameSrc = getFrameUrl(0);
    const front = frontImageRef.current;
    const back = backImageRef.current;

    sequenceWarmedRef.current = false;
    loadedSrcRef.current.clear();
    loadingSrcRef.current.clear();
    sequenceReadyRef.current = frames.length <= 1;
    sequenceWarmupPromiseRef.current = null;
    setIsSequenceReady(frames.length <= 1);
    swapTokenRef.current = 0;
    isFrontVisibleRef.current = true;
    requestedFrameRef.current = 0;
    currentFrameRef.current = 0;
    loadedSrcRef.current.add(firstFrameSrc);

    if (front && back) {
      front.setAttribute("src", firstFrameSrc);
      back.setAttribute("src", firstFrameSrc);
      front.style.opacity = "1";
      back.style.opacity = "0";
    }
  }, [frames.length, getFrameUrl, sequenceFolderPath]);

  useEffect(() => {
    if (!isInView || frames.length <= 1 || sequenceWarmedRef.current) return;
    if (typeof window !== "undefined") {
      const supportsHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
      if (!supportsHover) return;
    }

    // Anti-flicker mode: fully preload sequence before allowing frame animation.
    sequenceWarmedRef.current = true;
    void ensureSequenceReady();

    return () => {
      // no-op
    };
  }, [ensureSequenceReady, frames.length, isInView]);

  const hasRealImage = Boolean(car.baseImage);
  const hasSequence = frames.length > 0;
  const infoInset = "clamp(1rem, 2.8vw, 1.6rem)";
  const showDetails = alwaysShowDetails || isHovered;

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
      onFocus={prefetchRoute}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        if (!href) return;

        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(href);
        }
      }}
      onMouseEnter={() => {
        prefetchRoute();
        void ensureSequenceReady();

        if (frames.length > 0 && currentFrameRef.current < 0) {
          setFrameOnImage(0);
        }
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div
        className="relative overflow-hidden border border-gray-200 shadow-sm transition-[border-color,box-shadow] duration-300 hover:border-gray-300 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
        style={{ borderRadius: "2px", background: "#e8e8e8" }}
      >
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
        <div
          className="relative w-full overflow-hidden"
          style={{
            background: "radial-gradient(ellipse at 60% 50%, #e0e0e0 0%, #ebebeb 100%)",
            contain: "paint",
          }}
        >
          {hasSequence ? (
            <div className="grid w-full">
              <img
                ref={frontImageRef}
                src={getFrameUrl(0)}
                alt={car.name}
                className="col-start-1 row-start-1 w-full h-auto block"
                loading={isInView ? "eager" : "lazy"}
                decoding="async"
                style={{
                  backgroundColor: "#e8e8e8",
                  opacity: 1,
                  willChange: "opacity",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
                draggable={false}
              />
              <img
                ref={backImageRef}
                src={getFrameUrl(0)}
                alt=""
                aria-hidden="true"
                className="col-start-1 row-start-1 w-full h-auto block"
                loading={isInView ? "eager" : "lazy"}
                decoding="async"
                style={{
                  backgroundColor: "#e8e8e8",
                  opacity: 0,
                  willChange: "opacity",
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
                draggable={false}
              />
            </div>
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
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-black/10 to-transparent pointer-events-none z-10" />
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
              animate={{
                x: showDetails ? 0 : -5,
                opacity: showDetails ? 1 : 0,
              }}
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
              height: showDetails ? "auto" : 0,
              opacity: showDetails ? 1 : 0,
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
