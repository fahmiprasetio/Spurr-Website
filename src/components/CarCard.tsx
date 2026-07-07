"use client";

import { useEffect, useRef, useState, useCallback, type CSSProperties, type KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import type { Car } from "@/data/cars";
import spriteMeta from "@/data/sprite-meta.json";

type SpriteInfo = { frameW: number; frameH: number; cols: number; rows: number; count: number };
const spriteMap = spriteMeta as Record<string, SpriteInfo>;

type CarCardProps = {
  car: Car;
  sequenceFrames?: string[];
  href?: string;
  alwaysShowDetails?: boolean;
  performanceMode?: "auto" | "light";
};

export default function CarCard({ car, href, alwaysShowDetails = false }: CarCardProps) {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [frame, setFrame] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const routePrefetchedRef = useRef(false);
  const allowMotionRef = useRef(true);

  const sprite = car.sequenceFolder ? spriteMap[car.sequenceFolder] : undefined;
  const hasSequence = Boolean(sprite && sprite.count > 1);
  const hasRealImage = Boolean(car.baseImage);
  const spriteUrl = car.sequenceFolder ? `/car-image(sequences)/${car.sequenceFolder}/sprite.webp` : "";

  useEffect(() => {
    const node = cardRef.current;
    if (!node || isInView) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0]?.isIntersecting) { setIsInView(true); obs.disconnect(); } },
      { rootMargin: "320px 0px" }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [isInView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    allowMotionRef.current = !reduced && canHover;
  }, []);

  const prefetchRoute = useCallback(() => {
    if (!href || routePrefetchedRef.current) return;
    routePrefetchedRef.current = true;
    router.prefetch(href);
  }, [href, router]);

  useEffect(() => {
    if (!hasSequence || !sprite || !allowMotionRef.current) return;
    const target = isHovered ? sprite.count - 1 : 0;
    const fps = isHovered ? 24 : 18;
    const id = setInterval(() => {
      setFrame((prev) => {
        if (prev === target) { clearInterval(id); return prev; }
        return prev < target ? prev + 1 : prev - 1;
      });
    }, Math.max(16, Math.floor(1000 / fps)));
    return () => clearInterval(id);
  }, [isHovered, hasSequence, sprite]);

  const infoInset = "clamp(1rem, 2.8vw, 1.6rem)";
  const showDetails = alwaysShowDetails || isHovered;

  const col = sprite ? frame % sprite.cols : 0;
  const row = sprite ? Math.floor(frame / sprite.cols) : 0;
  const posX = sprite && sprite.cols > 1 ? (col / (sprite.cols - 1)) * 100 : 0;
  const posY = sprite && sprite.rows > 1 ? (row / (sprite.rows - 1)) * 100 : 0;

  const initialAnim = { opacity: 0, y: 40 };
  const whileInViewAnim = { opacity: 1, y: 0 };
  const viewportCfg = { once: true, margin: "-50px" };
  const cardTransition = { duration: 0.6, ease: "easeOut" };
  const cardStyle: CSSProperties = { borderRadius: "12px" };
  const brandTagStyle: CSSProperties = { top: "1rem", left: infoInset };
  const yearTagStyle: CSSProperties = { top: "1rem", right: infoInset };
  const visualStyle: CSSProperties = { background: "radial-gradient(ellipse at 60% 50%, #e0e0e0 0%, #ebebeb 100%)", contain: "paint" };
  const spriteStyle: CSSProperties | undefined = sprite ? {
    aspectRatio: `${sprite.frameW} / ${sprite.frameH}`,
    backgroundImage: isInView ? `url("${spriteUrl}")` : "none",
    backgroundRepeat: "no-repeat",
    backgroundSize: `${sprite.cols * 100}% ${sprite.rows * 100}%`,
    backgroundPosition: `${posX}% ${posY}%`,
    transform: "translateZ(0)",
  } : undefined;
  const infoWrapStyle: CSSProperties = { paddingBlock: "1rem" };
  const infoInnerStyle: CSSProperties = { width: `calc(100% - (${infoInset} * 2))`, marginInline: "auto" };
  const specRowStyle: CSSProperties = { columnGap: "1rem" };
  const arrowAnim = { x: showDetails ? 0 : -5, opacity: showDetails ? 1 : 0 };
  const arrowTransition = { duration: 0.3 };
  const specsAnim = { height: showDetails ? "auto" : 0, opacity: showDetails ? 1 : 0 };
  const specsTransition = { duration: 0.4, ease: "easeInOut" };

  const handleClick = () => { if (href) router.push(href); };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!href) return;
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); router.push(href); }
  };
  const handleMouseEnter = () => { prefetchRoute(); setIsHovered(true); };
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <motion.div
      ref={cardRef}
      initial={initialAnim}
      whileInView={whileInViewAnim}
      viewport={viewportCfg}
      transition={cardTransition}
      className={`group w-full ${href ? "cursor-pointer" : ""}`}
      role={href ? "link" : undefined}
      tabIndex={href ? 0 : undefined}
      onClick={handleClick}
      onFocus={prefetchRoute}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative overflow-hidden border border-gray-200 shadow-md transition-[border-color,box-shadow] duration-300 hover:border-gray-300 hover:shadow-[0_10px_24px_rgba(0,0,0,0.12)]"
        style={cardStyle}
      >
        <div className="absolute z-10" style={brandTagStyle}>
          <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-medium">{car.brand}</span>
        </div>
        <div className="absolute z-10" style={yearTagStyle}>
          <span className="text-[10px] tracking-wider text-gray-300">{car.year}</span>
        </div>

        <div className="relative w-full overflow-hidden" style={visualStyle}>
          {hasSequence && spriteStyle ? (
            <div className="w-full" style={spriteStyle} aria-label={car.name} role="img" />
          ) : hasRealImage ? (
            <img src={`/car-image(based)/${car.baseImage}`} alt={car.name} className="w-full h-auto block" loading="lazy" decoding="async" draggable={false} />
          ) : (
            <div className="w-full aspect-8/3 flex items-center justify-center text-[11px] tracking-[0.14em] uppercase text-gray-400">Image unavailable</div>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-black/10 to-transparent pointer-events-none z-10" />
        </div>

        <div className="relative" style={infoWrapStyle}>
          <div style={infoInnerStyle}>
            <div className="flex items-end justify-between mb-3" style={specRowStyle}>
              <div>
                <h3 className="text-lg font-semibold text-black tracking-tight">{car.name}</h3>
                <p className="text-xs text-gray-400 mt-1 tracking-wider uppercase">{car.brand}</p>
              </div>
              <motion.div animate={arrowAnim} transition={arrowTransition}>
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </motion.div>
            </div>

            <motion.div animate={specsAnim} transition={specsTransition} className="overflow-hidden">
              <div className="border-t border-gray-100 pt-4 mt-2">
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{car.description}</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><p className="text-sm font-semibold text-black">{car.power}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Power</p></div>
                  <div><p className="text-sm font-semibold text-black">{car.topSpeed}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">Top Speed</p></div>
                  <div><p className="text-sm font-semibold text-black">{car.acceleration}</p><p className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">0-100</p></div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
