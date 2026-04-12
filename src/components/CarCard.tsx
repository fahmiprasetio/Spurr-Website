"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Car } from "@/data/cars";

type CarCardProps = {
  car: Car;
  sequenceFrames?: string[];
};

export default function CarCard({ car, sequenceFrames = [] }: CarCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceWarmedRef = useRef(false);
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
    if (frames.length <= 1) return;

    if (intervalRef.current) clearInterval(intervalRef.current);

    const targetFrame = isHovered ? frames.length - 1 : 0;
    const step = isHovered ? 1 : -1;
    const frameInterval = Math.max(
      16,
      Math.floor(1000 / (isHovered ? FORWARD_FPS : REVERSE_FPS))
    );

    intervalRef.current = setInterval(() => {
      setCurrentFrame((prev) => {
        if (prev === targetFrame) {
          clearInterval(intervalRef.current!);
          return prev;
        }

        const next = prev + step;
        if (next < 0 || next > frames.length - 1) {
          clearInterval(intervalRef.current!);
          return prev;
        }

        return next;
      });
    }, frameInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, frames.length]);

  useEffect(() => {
    if (!isHovered || frames.length <= 1 || sequenceWarmedRef.current) return;

    // Warm up browser cache to avoid white flashing between frame swaps.
    sequenceWarmedRef.current = true;
    frames.forEach((frameName) => {
      const img = new Image();
      img.src = `/car-image(sequences)/${sequenceFolderPath}${frameName}`;
    });
  }, [isHovered, frames, sequenceFolderPath]);

  const getFrameUrl = () => {
    if (frames.length === 0) return "";
    return `/car-image(sequences)/${sequenceFolderPath}${frames[currentFrame]}`;
  };

  const hasRealImage = Boolean(car.baseImage);
  const hasSequence = frames.length > 0;
  const infoInset = "clamp(1rem, 2.8vw, 1.6rem)";

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group cursor-pointer w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        if (frames.length > 1) {
          setCurrentFrame(frames.length - 1);
        }
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
              src={getFrameUrl()}
              alt={car.name}
              className="w-full h-auto block"
              loading="eager"
              decoding="sync"
              draggable={false}
            />
          ) : hasRealImage ? (
            <img
              src={`/car-image(based)/${car.baseImage}`}
              alt={car.name}
              className="w-full h-auto block"
              loading="lazy"
              decoding="async"
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
