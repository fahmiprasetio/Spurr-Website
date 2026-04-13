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

  const featuredFromPreset = HOMEPAGE_FEATURED_IDS.map((carId) =>
    hoverReadyCars.find((car) => car.id === carId),
  ).filter((car): car is Car => Boolean(car));

  const fallbackFeatured = hoverReadyCars.filter(
    (car) => !HOMEPAGE_FEATURED_IDS.includes(car.id),
  );

  const featured = [...featuredFromPreset, ...fallbackFeatured].slice(0, 4);

  return (
    <section
      id="car"
      className="w-full pt-28 pb-24 flex flex-col items-center"
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
            Curated Collection
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black text-center">
            Collection
          </h2>
          <p
            className="text-gray-500 text-sm md:text-base leading-relaxed"
            style={{
              maxWidth: "56rem",
              marginInline: "auto",
              textAlign: "center",
            }}
          >
            A meticulously curated assembly of the world&apos;s most exceptional
            automobiles each representing the pinnacle of engineering,
            performance, and artistry.
          </p>
        </motion.div>

        {/* Horizontal carousel */}
        <div className="collection-carousel flex gap-5 overflow-x-auto overflow-y-hidden snap-x snap-mandatory pb-3">
          {featured.map((car) => {
            const sequenceFrames = car.sequenceFolder
              ? (framesMap[car.sequenceFolder] ?? [])
              : [];

            return (
              <div
                key={car.id}
                className="shrink-0 snap-start"
                style={{ width: "clamp(17rem, 70vw, 27rem)" }}
              >
                <CarCard
                  car={car}
                  sequenceFrames={sequenceFrames}
                  href={`/car/${car.id}`}
                  alwaysShowDetails
                />
              </div>
            );
          })}
        </div>

        {/* View All button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center mt-16"
        >
          <Link
            href="/car"
            className="px-12 py-4 border border-black text-black text-sm tracking-[0.25em] uppercase hover:bg-black hover:text-white transition-all duration-300"
          >
            View All Cars
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
