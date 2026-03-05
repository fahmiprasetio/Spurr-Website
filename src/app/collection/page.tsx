"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import CarCard from "@/components/CarCard";
import { cars } from "@/data/cars";

export default function CollectionPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="w-full py-32 flex flex-col items-center border-b border-black/5" style={{ background: "#fafafa" }}>
        <div className="w-full max-w-5xl px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs tracking-[0.3em] uppercase text-gray-400 hover:text-black transition-colors duration-200 mb-10"
            >
              <span>←</span>
              <span>Return to Home</span>
            </Link>
            <p className="text-xs tracking-[0.4em] uppercase text-gray-400 mb-4">
              Complete Catalogue
            </p>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black">
              The Full Collection
            </h1>
            <div className="w-12 h-px bg-black/20 mx-auto mt-6 mb-6" />
            <p className="text-gray-500 max-w-xl mx-auto text-sm leading-relaxed">
              Every vehicle in our curated catalogue — from the measured refinement of grand tourers to the unbridled ferocity of hypercars. Each one a masterwork in its own right.
            </p>
            <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mt-6">
              {cars.length} Exceptional Vehicles
            </p>
          </motion.div>
        </div>
      </div>

      {/* Grid */}
      <section className="w-full py-20 flex flex-col items-center" style={{ background: "#fafafa" }}>
        <div className="w-full max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 justify-items-center">
            {cars.map((car, index) => (
              <motion.div
                key={car.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.07 }}
                className="w-full"
              >
                <CarCard car={car} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
