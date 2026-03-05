"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import type { Car } from "@/data/cars";

// SVG car silhouette component - side view (fallback)
function CarSilhouette({
  color,
  className,
}: {
  color: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 800 300"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Car body */}
      <path
        d="M120,220 L120,180 Q120,160 140,150 L240,120 Q260,115 280,100 L380,60 Q400,50 420,50 L520,50 Q540,50 560,60 L600,80 Q620,90 640,100 L680,120 Q700,130 700,150 L700,180 Q700,200 700,220"
        fill={color}
        opacity="0.9"
      />
      {/* Window */}
      <path
        d="M290,110 L380,68 Q395,60 410,60 L510,60 Q525,60 535,68 L590,90 Q600,95 600,105 L600,115 Q600,120 595,120 L295,120 Q288,120 290,110Z"
        fill="rgba(200,220,240,0.6)"
        stroke={color}
        strokeWidth="2"
      />
      {/* Lower body line */}
      <path
        d="M130,200 L700,200"
        stroke={color}
        strokeWidth="3"
        opacity="0.5"
      />
      {/* Front bumper */}
      <path
        d="M120,180 Q100,180 90,190 L80,210 Q78,220 85,225 L130,225 L130,180"
        fill={color}
        opacity="0.85"
      />
      {/* Rear bumper */}
      <path
        d="M700,170 Q720,170 730,185 L735,210 Q737,220 730,225 L690,225 L690,170"
        fill={color}
        opacity="0.85"
      />
      {/* Headlight */}
      <ellipse cx="95" cy="190" rx="12" ry="8" fill="#FEF3C7" opacity="0.9" />
      {/* Tail light */}
      <ellipse cx="728" cy="190" rx="8" ry="10" fill="#DC2626" opacity="0.8" />
      {/* Front wheel */}
      <circle cx="210" cy="230" r="40" fill="#1a1a1a" />
      <circle cx="210" cy="230" r="28" fill="#333" />
      <circle cx="210" cy="230" r="18" fill="#555" />
      <circle cx="210" cy="230" r="8" fill="#888" />
      {/* Front wheel spokes */}
      <line x1="210" y1="202" x2="210" y2="258" stroke="#666" strokeWidth="2" />
      <line x1="182" y1="230" x2="238" y2="230" stroke="#666" strokeWidth="2" />
      <line
        x1="190"
        y1="210"
        x2="230"
        y2="250"
        stroke="#666"
        strokeWidth="2"
      />
      <line
        x1="230"
        y1="210"
        x2="190"
        y2="250"
        stroke="#666"
        strokeWidth="2"
      />
      {/* Rear wheel */}
      <circle cx="600" cy="230" r="40" fill="#1a1a1a" />
      <circle cx="600" cy="230" r="28" fill="#333" />
      <circle cx="600" cy="230" r="18" fill="#555" />
      <circle cx="600" cy="230" r="8" fill="#888" />
      {/* Rear wheel spokes */}
      <line x1="600" y1="202" x2="600" y2="258" stroke="#666" strokeWidth="2" />
      <line x1="572" y1="230" x2="628" y2="230" stroke="#666" strokeWidth="2" />
      <line
        x1="580"
        y1="210"
        x2="620"
        y2="250"
        stroke="#666"
        strokeWidth="2"
      />
      <line
        x1="620"
        y1="210"
        x2="580"
        y2="250"
        stroke="#666"
        strokeWidth="2"
      />
      {/* Ground shadow */}
      <ellipse
        cx="400"
        cy="275"
        rx="320"
        ry="12"
        fill="black"
        opacity="0.08"
      />
    </svg>
  );
}

export default function CarCard({ car }: { car: Car }) {
  const [isHovered, setIsHovered] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [currentFrame, setCurrentFrame] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Fetch frame list from centralized frames.json
  useEffect(() => {
    if (!car.sequenceFolder) return;
    // Fetch centralized frames.json from public folder
    fetch(`/frames.json`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch frames.json');
        return res.json();
      })
      .then((data) => {
        if (data && car.sequenceFolder && Array.isArray(data[car.sequenceFolder])) {
          setFrames(data[car.sequenceFolder]);
        } else {
          setFrames([]);
        }
      })
      .catch(() => setFrames([]));
  }, [car.sequenceFolder]);

  // Animation logic
  const FORWARD_DURATION = 2000; // ms total for forward play
  const REWIND_DURATION = 1000;  // ms total for rewind

  useEffect(() => {
    if (frames.length === 0) return;
    // Clamp currentFrame if frames.length changes (e.g. frame count reduced)
    setCurrentFrame((prev) => {
      if (prev >= frames.length) return frames.length - 1;
      if (prev < 0) return 0;
      return prev;
    });
    const forwardInterval = Math.max(16, Math.floor(FORWARD_DURATION / frames.length));
    const rewindInterval = Math.max(8, Math.floor(REWIND_DURATION / frames.length));
    if (isHovered) {
      // Play forward
      setCurrentFrame(0);
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => {
          if (prev >= frames.length - 1) {
            clearInterval(intervalRef.current!);
            return prev;
          }
          return prev + 1;
        });
      }, forwardInterval);
    } else {
      // Rewind backward
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (currentFrame > 0) {
        intervalRef.current = setInterval(() => {
          setCurrentFrame((prev) => {
            if (prev <= 0) {
              clearInterval(intervalRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 20);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, frames.length]);

  const getFrameUrl = () => {
    if (frames.length === 0) return "";
    const folderPath = car.sequenceFolder && car.sequenceFolder.trim() !== "" 
      ? `${car.sequenceFolder}/` 
      : "";
    return `/car-image(sequences)/${folderPath}${frames[currentFrame]}`;
  };

  const hasRealImage = Boolean(car.baseImage);
  const hasSequence = frames.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="group cursor-pointer w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative overflow-hidden bg-white border border-gray-100 hover:border-gray-300 hover:shadow-xl shadow-sm transition-all duration-500" style={{borderRadius: '2px'}}>
        {/* Brand tag */}
        <div className="absolute top-4 left-4 z-10">
          <span className="text-[10px] tracking-[0.25em] uppercase text-gray-400 font-medium">
            {car.brand}
          </span>
        </div>
        {/* Year tag */}
        <div className="absolute top-4 right-4 z-10">
          <span className="text-[10px] tracking-wider text-gray-300">
            {car.year}
          </span>
        </div>
        {/* Car visual area */}
        <div className="relative w-full overflow-hidden" style={{background: 'radial-gradient(ellipse at 60% 50%, #f0f0f0 0%, #ffffff 75%)'}}>
          {hasSequence ? (
            <img
              src={getFrameUrl()}
              alt={car.name}
              className="w-full h-auto block"
              draggable={false}
            />
          ) : hasRealImage ? (
            <img
              src={`/car-image(based)/${car.baseImage}`}
              alt={car.name}
              className="w-full h-auto block"
              draggable={false}
            />
          ) : (
            <CarSilhouette color={car.color} className="w-full h-auto drop-shadow-lg" />
          )}
          <div className="absolute bottom-0 left-0 right-0 h-6 bg-linear-to-t from-white/60 to-transparent pointer-events-none z-10" />
        </div>
        {/* Car info */}
        <div className="relative px-7 py-5">
          <div className="flex items-end justify-between mb-3">
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
    </motion.div>
  );
}
