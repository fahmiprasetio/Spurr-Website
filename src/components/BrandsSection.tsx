"use client";

import { motion } from "framer-motion";
import { brands } from "@/data/cars";

export default function BrandsSection() {
  return (
    <section id="brands" className="py-32 bg-black text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <p className="text-xs tracking-[0.4em] uppercase text-gray-500 mb-4">
            The Marques
          </p>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
            Legendary Brands
          </h2>
          <div className="w-12 h-px bg-white/30 mx-auto mt-6" />
        </motion.div>

        {/* Brands grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-white/5">
          {brands.map((brand, index) => (
            <motion.div
              key={brand.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="group bg-black hover:bg-white/5 transition-all duration-500 p-8 flex flex-col items-center text-center"
            >
              <span className="text-3xl mb-4 group-hover:scale-125 transition-transform duration-300">
                {brand.logo}
              </span>
              <h3 className="text-sm font-semibold tracking-[0.15em] uppercase text-white mb-1">
                {brand.name}
              </h3>
              <p className="text-[10px] tracking-wider text-gray-500">
                {brand.country} · Est. {brand.founded}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
