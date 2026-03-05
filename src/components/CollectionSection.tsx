"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CarCard from "@/components/CarCard";

import { cars } from "@/data/cars";
import frames from "@/../public/frames.json";

export default function CollectionSection() {
  // Only show cars that have a valid sequenceFolder with images in frames.json
  const sequenceFolders = Object.keys(frames);
  const featured = cars.filter(
    (car) => car.sequenceFolder && sequenceFolders.includes(car.sequenceFolder)
  ).slice(0, 6);

  return (
    <section id="collection" className="w-full py-32 flex flex-col items-center" style={{background: '#fafafa'}}>
      <div className="w-full max-w-5xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-4">
            Curated Selection
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
            The Collection
          </h2>
          <div className="w-12 h-px bg-black/20 mx-auto mt-6 mb-6" />
          <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
            A meticulously curated assembly of the world&apos;s most exceptional automobiles — each representing the pinnacle of engineering, performance, and artistry.
          </p>
        </motion.div>

        {/* Car grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          {featured.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
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
            {cars.length - 6} more vehicles await
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
