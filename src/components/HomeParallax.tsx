"use client";

import { AnimatePresence, motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Car } from "@/data/cars";
import Hero from "@/components/Hero";
import CollectionSection from "@/components/CollectionSection";

type HomeParallaxProps = {
  cars: Car[];
};

const SPLASH_WAIT_CAP = 92;
const SPLASH_TICK_MS = 24;
const SPLASH_FALLBACK_READY_MS = 1300;
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

  // Delay the first section slightly so the cover motion feels smoother.
  const revealOffset = useTransform(scrollY, [0, 700], [90, 0]);
  const smoothRevealOffset = useSpring(revealOffset, {
    stiffness: 110,
    damping: 28,
    mass: 0.75,
  });
  const sectionRadius = useTransform(scrollY, [0, 500], [28, 0]);

  return (
    <div className="relative">
      <AnimatePresence>
        {showSplash ? (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-9999 flex items-center justify-center bg-black"
          >
            <div className="w-[min(28rem,84vw)]">
              <p className="text-center text-[11px] tracking-[0.32em] uppercase text-white/75">
                Loading SPURR Experience
              </p>
              <div className="mt-5 h-1 w-full overflow-hidden bg-white/20">
                <motion.div
                  className="h-full bg-white"
                  animate={{ width: `${loadingProgress}%` }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                />
              </div>
              <p className="mt-3 text-right text-sm tracking-wider text-white/85">
                {loadingProgress}%
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="sticky top-0 z-0 h-screen overflow-hidden">
        <Hero
          isVideoActive={isHeroVideoActive}
          onVideoReady={handleHeroVideoReady}
        />
      </div>

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
      </motion.div>
    </div>
  );
}
