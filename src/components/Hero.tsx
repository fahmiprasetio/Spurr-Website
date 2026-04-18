"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useRef } from "react";

const HERO_VIDEO_SRC = "/car-video/hero-section-video-compresed.mp4";

type HeroProps = {
  isVideoActive?: boolean;
  onVideoReady?: () => void;
};

export default function Hero({
  isVideoActive = true,
  onVideoReady,
}: HeroProps) {
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
          <p className="text-xs tracking-[0.4em] uppercase text-white/75 mb-3">
            An Unrivalled Automotive Edit
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="mx-auto w-[min(30rem,72vw)]"
        >
          <Image
            src="/logo-spurr.png"
            alt="SPURR"
            width={680}
            height={180}
            priority
            className="h-auto w-full object-contain"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          <p className="text-lg md:text-xl text-gray-100/95 max-w-2xl mx-auto leading-relaxed font-light mt-5">
            A definitive showcase of the world&apos;s most extraordinary
            performance automobiles where Italian artistry, German precision,
            and Japanese mastery converge in singular pursuit of excellence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.7, ease: "easeOut" }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="/car"
            className="inline-flex items-center justify-center border border-white/80 bg-transparent text-white text-sm md:text-base tracking-[0.18em] uppercase hover:bg-white/14 hover:border-white transition-all duration-300"
            style={{
              padding: "1rem clamp(2rem, 4vw, 2.9rem)",
              minHeight: "3.25rem",
              lineHeight: 1.1,
              borderRadius: "0.2rem",
            }}
          >
            Explore the Cars
          </a>
        </motion.div>
      </div>
    </section>
  );
}
