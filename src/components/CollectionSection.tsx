"use client";

import { motion } from "framer-motion";
import CarCard from "@/components/CarCard";
import { cars } from "@/data/cars";

export default function CollectionSection() {
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
            Each car tells a story of innovation, passion, and relentless
            pursuit of perfection. Hover to explore.
          </p>
        </motion.div>

        {/* Car grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>
    </section>
  );
}
