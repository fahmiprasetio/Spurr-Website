"use client";

import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-white">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, black 1px, transparent 0)`,
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Decorative lines */}
      <div className="absolute top-0 left-1/2 w-px h-32 bg-gradient-to-b from-transparent to-black/10" />
      <div className="absolute bottom-0 left-1/2 w-px h-32 bg-gradient-to-t from-transparent to-black/10" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-8">
            The Finest Collection
          </p>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
          className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-black leading-none"
        >
          SPURR
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
        >
          <div className="w-20 h-px bg-black mx-auto mt-10 mb-8" />
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed font-light">
            Where speed meets elegance. Explore the world&apos;s most iconic
            sport cars — from Italian thoroughbreds to Japanese engineering
            marvels.
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
            className="px-10 py-4 bg-black text-white text-sm tracking-[0.2em] uppercase hover:bg-gray-900 transition-all duration-300"
          >
            Explore Collection
          </a>
          <a
            href="#brands"
            className="px-10 py-4 border border-black text-black text-sm tracking-[0.2em] uppercase hover:bg-black hover:text-white transition-all duration-300"
          >
            View Brands
          </a>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="mt-24 grid grid-cols-3 gap-8 max-w-lg mx-auto"
        >
          <div>
            <p className="text-3xl font-bold text-black">50+</p>
            <p className="text-xs tracking-wider uppercase text-gray-400 mt-1">
              Models
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-black">12</p>
            <p className="text-xs tracking-wider uppercase text-gray-400 mt-1">
              Brands
            </p>
          </div>
          <div>
            <p className="text-3xl font-bold text-black">∞</p>
            <p className="text-xs tracking-wider uppercase text-gray-400 mt-1">
              Passion
            </p>
          </div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] tracking-[0.3em] uppercase text-gray-400">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-8 bg-black/30"
        />
      </motion.div>
    </section>
  );
}
