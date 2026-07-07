import Link from "next/link";
import { getCarsFromDb } from "@/lib/cars-db";

export const revalidate = 60;

const palette = [
  {
    text: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-200",
    bar: "bg-amber-500",
    ring: "bg-amber-500/10",
  },
  {
    text: "text-rose-600",
    bg: "bg-rose-50",
    border: "border-rose-200",
    bar: "bg-rose-500",
    ring: "bg-rose-500/10",
  },
  {
    text: "text-indigo-600",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    bar: "bg-indigo-500",
    ring: "bg-indigo-500/10",
  },
];

const coreValues = [
  {
    title: "Curated Experience",
    description:
      "We select each car for its character, story, and technical achievements so every visit feels premium.",
  },
  {
    title: "Interactive Showcase",
    description:
      "Each car is presented with hover frame sequences so visitors can explore design details more vividly.",
  },
  {
    title: "Rental Ready",
    description:
      "This platform does more than showcase a collection. It is also built to support real booking and rental flows.",
  },
];

const storySteps = [
  {
    title: "2021. The Vision",
    description:
      "We started with a simple idea: make exotic car discovery feel as cinematic as the machines themselves.",
  },
  {
    title: "2023. The Gallery",
    description:
      "We built a visual-first collection that keeps performance specs and design details within quick reach.",
  },
  {
    title: "2026. The Platform",
    description:
      "SPURR now blends exploration, saving, and rental flows into a single, frictionless experience.",
  },
];

const experiencePillars = [
  {
    title: "Cinema-grade imagery",
    description:
      "Frame sequences, crisp gallery shots, and motion touches that keep browsing fast and immersive.",
  },
  {
    title: "Human-first details",
    description:
      "Clear specs, ownership stories, and practical rental terms designed for clarity, not complexity.",
  },
  {
    title: "Collection intelligence",
    description:
      "Saved favorites, smart filtering, and notifications that help you track the right car at the right time.",
  },
];

export default async function AboutPage() {
  const cars = await getCarsFromDb();
  const brandCount = new Set(cars.map((car) => car.brand)).size;
  const interactiveCount = cars.filter((car) => car.sequenceFolder).length;

  const stats = [
    {
      label: "Cars Indexed",
      value: cars.length,
      note: "Live inventory synced with the collection feed.",
    },
    {
      label: "Brands Covered",
      value: brandCount,
      note: "Global marques with a focus on rare trims.",
    },
    {
      label: "Interactive Models",
      value: interactiveCount,
      note: "Frames captured for detailed, touch-driven viewing.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f7f4ef] pt-28">
      <section className="w-full bg-[#f7f4ef]">
        <div className="mx-auto w-full max-w-7xl space-y-12 px-6 pb-16 md:px-8 md:pb-20">
          <header className="relative overflow-hidden border border-black/10 bg-white p-8 md:p-12">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500" />
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,119,6,0.14),transparent_55%)]" />
            <div className="pointer-events-none absolute -right-16 -top-10 h-56 w-56 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.28em] text-amber-700">
                About SPURR
              </span>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-black md:text-5xl">
                Crafted for the Modern Exotic Car{" "}
                <span className="text-amber-600">Collector</span>
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                SPURR is a digital showroom built for enthusiasts who want the thrill of discovery with the clarity of
                real-world rental access. We blend high-end visuals, smart data, and refined user flows to make every
                visit feel like a curated gallery tour.
              </p>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {stats.map((stat, index) => {
              const accent = palette[index % palette.length];
              return (
                <article
                  key={stat.label}
                  className={`group relative overflow-hidden border ${accent.border} bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full ${accent.ring} blur-2xl`} />
                  <div className="relative">
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${accent.bar}`} />
                      <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">{stat.label}</p>
                    </div>
                    <p className={`mt-3 text-4xl font-semibold ${accent.text}`}>{stat.value}</p>
                    <p className="mt-3 text-xs text-gray-500">{stat.note}</p>
                  </div>
                </article>
              );
            })}
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_1fr]">
            <div className="border border-black/10 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1 rounded-full bg-amber-500" />
                <h2 className="text-2xl font-semibold tracking-tight text-black">Our Story</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                SPURR was born from a love of design, speed, and the culture around automotive craftsmanship. We are
                building a platform that respects every line, spec, and sound of the vehicles we spotlight.
              </p>
              <div className="relative mt-6 space-y-6">
                <div className="absolute left-[7px] top-1 bottom-1 w-px bg-gradient-to-b from-amber-500 via-rose-500 to-indigo-500" />
                {storySteps.map((step, index) => {
                  const accent = palette[index % palette.length];
                  return (
                    <div key={step.title} className="relative pl-8">
                      <span className={`absolute left-0 top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white ${accent.bar}`} />
                      <h3 className={`text-sm font-semibold uppercase tracking-[0.18em] ${accent.text}`}>{step.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="border border-black/10 bg-white p-6 md:p-8">
              <div className="flex items-center gap-3">
                <span className="h-6 w-1 rounded-full bg-rose-500" />
                <h2 className="text-2xl font-semibold tracking-tight text-black">The Experience</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Every touchpoint is designed to feel premium and effortless, from the moment you arrive to the moment
                you reserve a drive.
              </p>
              <div className="mt-6 space-y-4">
                {experiencePillars.map((pillar, index) => {
                  const accent = palette[index % palette.length];
                  return (
                    <article
                      key={pillar.title}
                      className={`flex gap-4 border border-black/5 border-l-2 ${accent.border} bg-[#f7f4ef] p-4 transition hover:bg-white`}
                    >
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${accent.bg} ${accent.text}`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-black">{pillar.title}</h3>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600">{pillar.description}</p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <span className="h-6 w-1 rounded-full bg-indigo-500" />
              <h2 className="text-2xl font-semibold tracking-tight text-black">What Makes SPURR Different</h2>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              {coreValues.map((item, index) => {
                const accent = palette[index % palette.length];
                return (
                  <article
                    key={item.title}
                    className="group relative overflow-hidden border border-black/10 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className={`absolute inset-x-0 top-0 h-1 ${accent.bar}`} />
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${accent.bg} ${accent.text}`}>
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-4 text-sm font-semibold uppercase tracking-[0.16em] text-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="relative overflow-hidden border border-black/10 bg-gradient-to-br from-zinc-900 via-black to-zinc-900 p-8 text-white md:p-10">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-12 right-0 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-amber-300">
                Get Started
              </span>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">Explore, Save, and Rent</h2>
              <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">
                Ready to explore the collection? You can head straight to the cars page, save your favorites, and
                continue to rental whenever you are ready.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/car"
                  className="bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-medium uppercase tracking-[0.16em] text-black transition hover:from-amber-400 hover:to-amber-500"
                >
                  View Cars
                </Link>
                <Link
                  href="/wishlist"
                  className="border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
                >
                  Open Wishlist
                </Link>
                <Link
                  href="/rentals"
                  className="border border-white/25 px-5 py-2.5 text-xs uppercase tracking-[0.16em] text-white transition hover:bg-white hover:text-black"
                >
                  Start Rental
                </Link>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}