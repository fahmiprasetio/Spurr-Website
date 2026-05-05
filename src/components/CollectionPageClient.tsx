"use client";

import { motion } from "framer-motion";
import CarCard from "@/components/CarCard";
import type { Car } from "@/data/cars";
import { framesMap } from "@/data/frames";

type CollectionPageClientProps = {
  cars: Car[];
};

export default function CollectionPageClient({ cars }: CollectionPageClientProps) {
  const hoverReadyCars = cars.filter((car) => {
    if (!car.sequenceFolder) return false;

    const frames = framesMap[car.sequenceFolder];
    return Array.isArray(frames) && frames.length > 1;
  });

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div
        className="w-full flex flex-col items-center border-b border-black/5 pt-16 pb-8 md:pt-20 md:pb-10"
        style={{ background: "#fafafa" }}
      >
        <div className="w-full max-w-7xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-2 mt-5">
              Curated Selection
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-black">
              Signature Catalogue
            </h1>
            <div className="w-12 h-px bg-black/20 mx-auto mt-4 mb-4" />
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              Discover our current lineup of handpicked performance cars, built for refined city cruising and unforgettable weekend drives.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <section className="w-full py-20 flex flex-col items-center" style={{ background: "#fafafa" }}>
        <div className="w-full max-w-7xl px-6 lg:px-8 -mt-7">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            {hoverReadyCars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.07 }}
                className="w-full"
              >
                <CarCard
                  car={car}
                  sequenceFrames={car.sequenceFolder ? framesMap[car.sequenceFolder] ?? [] : []}
                  href={`/car/${car.id}`}
                />
              </motion.div>
            ))}
          </div>

          <div className="mt-16 border border-black/10 bg-white/90 px-6 py-8 text-center">
            <p className="text-xs uppercase tracking-[0.28em] text-gray-400">
              More to come
            </p>
            <p className="mt-4 text-sm leading-relaxed text-gray-600">
              Additional icons are being prepared and will be added to the catalogue soon.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
