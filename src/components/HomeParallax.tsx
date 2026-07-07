"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Car } from "@/data/cars";
import Hero from "@/components/Hero";
import CollectionSection from "@/components/CollectionSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";

type HomeParallaxProps = {
  cars: Car[];
};

const SPLASH_WAIT_CAP = 92;
const SPLASH_TICK_MS = 24;
const SPLASH_FALLBACK_READY_MS = 4000;
const SPLASH_EXIT_DELAY_MS = 160;
const SPLASH_SESSION_KEY = "spurr:splash-seen:v1";

export default function HomeParallax({ cars }: HomeParallaxProps) {
  const { scrollY } = useScroll();
  const [isHeroVideoActive, setIsHeroVideoActive] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const hasResolvedReadyRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasSeenSplash = window.sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
    if (!hasSeenSplash) return;

    hasResolvedReadyRef.current = true;
    setIsVideoReady(true);
    setLoadingProgress(100);
    setShowSplash(false);
  }, []);

  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        const cap = isVideoReady ? 100 : SPLASH_WAIT_CAP;
        if (prev >= cap) return prev;
        const step = isVideoReady ? 4 : 1;
        return Math.min(cap, prev + step);
      });
    }, SPLASH_TICK_MS);

    return () => clearInterval(interval);
  }, [isVideoReady, showSplash]);

  useEffect(() => {
    if (!showSplash || loadingProgress < 100) return;

    const timeout = setTimeout(() => {
      setShowSplash(false);

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(SPLASH_SESSION_KEY, "1");
      }
    }, SPLASH_EXIT_DELAY_MS);

    return () => clearTimeout(timeout);
  }, [loadingProgress, showSplash]);

  useEffect(() => {
    if (!showSplash || isVideoReady) return;

    const timeout = setTimeout(() => {
      setIsVideoReady(true);
    }, SPLASH_FALLBACK_READY_MS);

    return () => clearTimeout(timeout);
  }, [isVideoReady, showSplash]);

  useEffect(() => {
    if (!showSplash) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [showSplash]);

  function handleHeroVideoReady() {
    if (hasResolvedReadyRef.current) return;
    hasResolvedReadyRef.current = true;
    setIsVideoReady(true);
  }

  useEffect(() => {
    const updateHeroVideoState = () => {
      const viewportHeight = window.innerHeight || 0;
      const pauseAfter = viewportHeight;
      const shouldPlay = window.scrollY < pauseAfter;
      setIsHeroVideoActive((prev) => (prev === shouldPlay ? prev : shouldPlay));
    };

    updateHeroVideoState();
    window.addEventListener("scroll", updateHeroVideoState, { passive: true });
    window.addEventListener("resize", updateHeroVideoState);

    return () => {
      window.removeEventListener("scroll", updateHeroVideoState);
      window.removeEventListener("resize", updateHeroVideoState);
    };
  }, []);

  const heroParallax = useTransform(scrollY, [0, 1200], [0, -600]);
  const smoothHeroParallax = useSpring(heroParallax, {
    stiffness: 90,
    damping: 24,
    mass: 0.8,
  });

  // Delay the first section slightly so the cover motion feels smoother.
  const revealOffset = useTransform(scrollY, [0, 700], [90, 0]);
  const smoothRevealOffset = useSpring(revealOffset, {
    stiffness: 110,
    damping: 28,
    mass: 0.75,
  });
  const sectionRadius = useTransform(scrollY, [0, 500], [44, 0]);

  return (
    <div className="relative bg-black">
      <AnimatePresence>
        {showSplash ? (
          <motion.div
            key="spurr-splash"
            className="fixed inset-0 z-[9999] overflow-hidden"
            initial={ { opacity: 1 } }
            animate={ { opacity: 1 } }
          >
            {/* Cream shutter: dua bagian yang membelah saat loading mencapai 100% */}
            <motion.span
              className="absolute inset-x-0 top-0 h-[calc(50%_+_1px)] bg-[#faf0ed]"
              initial={ { y: 0 } }
              exit={ { y: "-100%" } }
              transition={ { duration: 1.15, ease: [0.85, 0, 0.15, 1], delay: 0.08 } }
            />
            <motion.span
              className="absolute inset-x-0 bottom-0 h-[calc(50%_+_1px)] bg-[#faf0ed]"
              initial={ { y: 0 } }
              exit={ { y: "100%" } }
              transition={ { duration: 1.15, ease: [0.85, 0, 0.15, 1], delay: 0.08 } }
            />

            {/* Wordmark SPURR yang terisi kiri->kanan mengikuti progress loading */}
            <motion.div
              className="absolute left-1/2 top-1/2 z-[2] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              initial={ { opacity: 0, scale: 0.98 } }
              animate={ { opacity: 1, scale: 1 } }
              exit={ { opacity: 0, scale: 0.96, y: -10 } }
              transition={ { duration: 0.6, ease: "easeOut" } }
            >
              <span className="relative inline-block">
                <span className="block whitespace-nowrap pl-[0.4em] text-[clamp(2.75rem,13vw,7.5rem)] font-light uppercase leading-none tracking-[0.4em] text-[#1a1411]/15">
                  SPURR
                </span>
                <span
                  className="absolute inset-y-0 left-0 overflow-hidden"
                  style={ { width: `${loadingProgress}%` } }
                >
                  <span className="block w-max whitespace-nowrap pl-[0.4em] text-[clamp(2.75rem,13vw,7.5rem)] font-light uppercase leading-none tracking-[0.4em] text-[#1a1411]">
                    SPURR
                  </span>
                </span>
              </span>
              <span className="mt-7 text-[11px] font-light uppercase tracking-[0.5em] text-[#1a1411]/45">
                {loadingProgress}%
              </span>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <motion.div
        className="sticky top-0 z-0 h-screen overflow-hidden"
        style={{ y: smoothHeroParallax }}
      >
        <Hero
          isVideoActive={isHeroVideoActive}
          onVideoReady={handleHeroVideoReady}
        />
      </motion.div>

      <motion.div className="relative z-20 -mt-16 md:-mt-20" style={{ y: smoothRevealOffset }}>
        <motion.div
          className="overflow-hidden bg-[#e8e8e8] shadow-[0_-1.25rem_3rem_rgba(0,0,0,0.30)]"
          style={{
            borderTopLeftRadius: sectionRadius,
            borderTopRightRadius: sectionRadius,
          }}
        >
          <CollectionSection cars={cars} />
        </motion.div>

        <HowItWorksSection />
        <TestimonialsSection />
      </motion.div>
    </div>
  );
}

