"use client";

import { motion } from "framer-motion";

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Browse & choose your vehicle",
    description:
      "Explore our exotic collection and pick the car that best fits your plan and driving style.",
  },
  {
    step: "02",
    title: "Set dates & confirm booking",
    description:
      "Choose your rental dates, share your requirements, and confirm the booking in just a few steps.",
  },
  {
    step: "03",
    title: "Pick up the key & enjoy the drive",
    description:
      "Arrive at the scheduled time, receive the key, and enjoy your premium driving experience.",
  },
] as const;

const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.14,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export default function HowItWorksSection() {
  return (
    <section className="w-full bg-black pb-24 pt-14 md:pb-28 md:pt-16">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-xs uppercase tracking-[0.34em] text-zinc-500">
            The process
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight text-zinc-100 md:text-5xl">
            How it works
          </h2>
          <p className="mt-5 text-sm leading-relaxed text-zinc-400 md:text-base">
            Three simple steps from browsing the car to holding the key in your
            hand.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.25 }}
          className="mt-14 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-7"
        >
          {PROCESS_STEPS.map((item, index) => (
            <motion.article
              key={item.step}
              variants={itemVariants}
              className="relative border border-[#1c1c1c] bg-black px-6 pb-7 pt-6 md:px-7 md:pb-8 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,255,255,0.5)] hover:border-[#333333]"
            >
              <p className="text-[3rem] font-semibold leading-none tracking-[0.14em] text-zinc-800 md:text-[3.4rem]">
                {item.step}
              </p>
              <h3 className="mt-5 text-lg font-medium text-zinc-100 md:text-xl">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400 md:text-[0.95rem]">
                {item.description}
              </p>

              {index < PROCESS_STEPS.length - 1 ? (
                <>
                  <span className="pointer-events-none absolute -bottom-4 left-7 block h-4 w-px bg-[#2a2a2a] md:hidden" />
                  <span className="pointer-events-none absolute left-[calc(100%+0.25rem)] top-[3.2rem] hidden h-px w-6 bg-[#2a2a2a] md:block" />
                </>
              ) : null}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
