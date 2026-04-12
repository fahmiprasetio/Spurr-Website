"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CarCard from "@/components/CarCard";
import type { Car } from "@/data/cars";

import { framesMap } from "@/data/frames";

type CollectionSectionProps = {
  cars: Car[];
};

const HOMEPAGE_FEATURED_IDS = [
  "porsche-911",
  "bugatti-chiron",
  "pagani-huayra",
  "koenigsegg-jesko",
];

export default function CollectionSection({ cars }: CollectionSectionProps) {
  const hoverReadyCars = cars.filter((car) => {
    if (!car.sequenceFolder) return false;

    const frames = framesMap[car.sequenceFolder];
    return Array.isArray(frames) && frames.length > 1;
  });

  const featuredFromPreset = HOMEPAGE_FEATURED_IDS
    .map((carId) => hoverReadyCars.find((car) => car.id === carId))
    .filter((car): car is Car => Boolean(car));

  const fallbackFeatured = hoverReadyCars.filter(
    (car) => !HOMEPAGE_FEATURED_IDS.includes(car.id)
  );

  const featured = [...featuredFromPreset, ...fallbackFeatured].slice(0, 4);
  const remainingCount = Math.max(hoverReadyCars.length - featured.length, 0);

  return (
    <section
      id="collection"
      className="w-full py-32 flex flex-col items-center"
      style={{
        background: "#e8e8e8",
        contentVisibility: "auto",
        containIntrinsicSize: "1px 1200px",
      }}
    >
      <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-20 flex flex-col items-center gap-6 md:gap-8"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-gray-400 text-center">
            Curated Selection
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black text-center">
            The Collection
          </h2>
          <p
            className="text-gray-500 text-sm md:text-base leading-relaxed"
            style={{
              maxWidth: "56rem",
              marginInline: "auto",
              textAlign: "center",
            }}
          >
            A meticulously curated assembly of the world&apos;s most exceptional automobiles each representing the pinnacle of engineering, performance, and artistry.
          </p>
        </motion.div>

        {/* Car grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          {featured.map((car) => {
            const sequenceFrames = car.sequenceFolder
              ? framesMap[car.sequenceFolder] ?? []
              : [];

            return (
              <CarCard
                key={car.id}
                car={car}
                sequenceFrames={sequenceFrames}
                href={`/collection/${car.id}`}
              />
            );
          })}
        </div>

        {/* View All button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center mt-16 gap-4"
        >
          <p className="text-xs tracking-[0.3em] uppercase text-gray-400">
            {remainingCount} more vehicles await
          </p>
          <Link
            href="/collection"
            className="px-12 py-4 border border-black text-black text-sm tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-all duration-300"
          >
            View Full Collection
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
