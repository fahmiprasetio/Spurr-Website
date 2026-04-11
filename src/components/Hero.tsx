"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

const HERO_VIDEO_SRC = "/car-video/hero-section-video-compresed.mp4";

type HeroProps = {
  isVideoActive?: boolean;
  onVideoReady?: () => void;
};

export default function Hero({ isVideoActive = true, onVideoReady }: HeroProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hasNotifiedReadyRef = useRef(false);

  function notifyVideoReady() {
    if (hasNotifiedReadyRef.current) return;
    hasNotifiedReadyRef.current = true;
    onVideoReady?.();
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isVideoActive) {
      const playPromise = video.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(() => undefined);
      }
      return;
    }

    video.pause();
  }, [isVideoActive]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src={HERO_VIDEO_SRC}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onLoadedData={notifyVideoReady}
          onCanPlay={notifyVideoReady}
          onPlaying={notifyVideoReady}
        />
        <div className="absolute inset-0 bg-black/52" />

        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.07]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="text-xs tracking-[0.4em] uppercase text-white/75 mb-8">
            An Unrivalled Automotive Edit
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white leading-none"
        >
          SPURR
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          <p className="text-lg md:text-xl text-gray-100/95 max-w-2xl mx-auto leading-relaxed font-light">
            A definitive showcase of the world&apos;s most extraordinary performance automobiles — where Italian artistry, German precision, and Japanese mastery converge in singular pursuit of excellence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="#collection"
            className="inline-flex items-center justify-center border border-white/80 bg-transparent text-white text-sm md:text-base tracking-[0.18em] uppercase hover:bg-white/14 hover:border-white transition-all duration-300"
            style={{
              padding: "1rem clamp(2rem, 4vw, 2.9rem)",
              minHeight: "3.25rem",
              lineHeight: 1.1,
              borderRadius: "0.2rem",
            }}
          >
            Explore the Collection
          </a>
        </motion.div>

      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-white/80">
          Scroll
        </span>
      </motion.div>
    </section>
  );
}
