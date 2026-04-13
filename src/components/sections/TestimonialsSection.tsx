"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

type TestimonialItem = {
  id: string;
  quote: string;
  customerName: string;
  initials: string;
  rentedCar: string;
};

const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "raka",
    quote:
      "The service was smooth and professional. From booking to handover, everything was on schedule and clearly communicated.",
    customerName: "Raka Pratama",
    initials: "RP",
    rentedCar: "Porsche 911 GT3 RS",
  },
  {
    id: "nadine",
    quote:
      "I booked it for a brand event in South Jakarta. The car arrived spotless, and the team quickly handled my schedule adjustments.",
    customerName: "Nadine Valencia",
    initials: "NV",
    rentedCar: "Bugatti Chiron Super Sport",
  },
  {
    id: "fajar",
    quote:
      "This was my first exotic rental and the process felt effortless. The detailed briefing made me fully confident for the weekend drive.",
    customerName: "Fajar Mahendra",
    initials: "FM",
    rentedCar: "Koenigsegg Jesko Absolut",
  },
  {
    id: "keisha",
    quote:
      "A premium experience from beginning to end. Perfect for special occasions, with very responsive support throughout.",
    customerName: "Keisha Adeline",
    initials: "KA",
    rentedCar: "Pagani Huayra Roadster BC",
  },
];

const AUTO_ROTATE_INTERVAL_MS = 5000;

const slideVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? 32 : -32,
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction > 0 ? -32 : 32,
  }),
};

function FiveStarRating() {
  return (
    <div className="mb-4 flex items-center gap-1 text-[0.7rem] tracking-widest text-zinc-700">
      {Array.from({ length: 5 }, (_, index) => (
        <span key={index} aria-hidden="true">
          ★
        </span>
      ))}
    </div>
  );
}

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setDirection(1);
      setActiveIndex((previous) => (previous + 1) % TESTIMONIALS.length);
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isPaused]);

  const activeItem = TESTIMONIALS[activeIndex];

  function goToSlide(nextIndex: number) {
    if (nextIndex === activeIndex) return;

    setDirection(nextIndex > activeIndex ? 1 : -1);
    setActiveIndex(nextIndex);
  }

  function goPrevious() {
    setDirection(-1);
    setActiveIndex(
      (previous) => (previous - 1 + TESTIMONIALS.length) % TESTIMONIALS.length,
    );
  }

  function goNext() {
    setDirection(1);
    setActiveIndex((previous) => (previous + 1) % TESTIMONIALS.length);
  }

  return (
    <section className="w-full bg-[#f6f6f6] pb-24 pt-20 md:pb-32 md:pt-24">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
            What they say
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-900 md:text-5xl">
            Experiences worth telling
          </h2>
        </motion.div>

        <div className="mt-12">
          <div
            className="relative overflow-hidden border border-[#d9d9d9] bg-white"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <AnimatePresence initial={false} mode="wait" custom={direction}>
              <motion.article
                key={activeItem.id}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 gap-8 p-6 md:grid-cols-[auto_1fr] md:items-start md:gap-10 md:p-10"
              >
                <div className="flex items-center gap-4 md:min-w-56 md:flex-col md:items-start md:gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#d0d0d0] text-sm font-semibold tracking-[0.2em] text-zinc-900">
                    {activeItem.initials}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-900 md:text-base">
                      {activeItem.customerName}
                    </p>
                    <p className="mt-1 text-[0.72rem] uppercase tracking-[0.17em] text-zinc-500">
                      {activeItem.rentedCar}
                    </p>
                  </div>
                </div>

                <div>
                  <FiveStarRating />
                  <p className="text-base leading-relaxed text-zinc-700 md:text-xl md:leading-relaxed">
                    "{activeItem.quote}"
                  </p>
                </div>
              </motion.article>
            </AnimatePresence>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {TESTIMONIALS.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goToSlide(index)}
                  aria-label={`Go to testimonial ${index + 1}`}
                  className={`h-2.5 w-2.5 rounded-full border border-zinc-500 transition-colors duration-300 ${
                    index === activeIndex ? "bg-zinc-900" : "bg-transparent"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={goPrevious}
                className="border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-900 transition-colors duration-300 hover:bg-black hover:text-white"
              >
                Prev
              </button>
              <button
                type="button"
                onClick={goNext}
                className="border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-zinc-900 transition-colors duration-300 hover:bg-black hover:text-white"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
