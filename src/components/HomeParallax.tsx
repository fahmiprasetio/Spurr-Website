"use client";

import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { useEffect, useState } from "react";
import type { Car } from "@/data/cars";
import Hero from "@/components/Hero";
import CollectionSection from "@/components/CollectionSection";

type HomeParallaxProps = {
  cars: Car[];
};

export default function HomeParallax({ cars }: HomeParallaxProps) {
  const { scrollY } = useScroll();
  const [isHeroVideoActive, setIsHeroVideoActive] = useState(true);

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
      <div className="sticky top-0 z-0 h-screen overflow-hidden">
        <Hero isVideoActive={isHeroVideoActive} />
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
