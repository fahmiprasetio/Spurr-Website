import Link from "next/link";
import { getCarsFromDb } from "@/lib/cars-db";

export const revalidate = 60;

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

  return (
    <main className="min-h-screen bg-[#f7f4ef] pt-28">
      <section className="w-full bg-[#f7f4ef]">
        <div className="mx-auto w-full max-w-7xl space-y-10 px-6 pb-12 md:px-8 md:pb-16">
          <header className="relative overflow-hidden border border-black/10 bg-white p-8 md:p-10">
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(0,0,0,0.04),rgba(0,0,0,0))]" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.32em] text-gray-400">About SPURR</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black md:text-5xl">
                Crafted for the Modern Exotic Car Collector
              </h1>
              <p className="mt-5 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
                SPURR is a digital showroom built for enthusiasts who want the thrill of discovery with the clarity of
                real-world rental access. We blend high-end visuals, smart data, and refined user flows to make every
                visit feel like a curated gallery tour.
              </p>
            </div>
          </header>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="border border-black/10 bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Cars Indexed</p>
              <p className="mt-2 text-3xl font-semibold text-black">{cars.length}</p>
              <p className="mt-3 text-xs text-gray-500">Live inventory synced with the collection feed.</p>
            </article>
            <article className="border border-black/10 bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Brands Covered</p>
              <p className="mt-2 text-3xl font-semibold text-black">{brandCount}</p>
              <p className="mt-3 text-xs text-gray-500">Global marques with a focus on rare trims.</p>
            </article>
            <article className="border border-black/10 bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Interactive Models</p>
              <p className="mt-2 text-3xl font-semibold text-black">{interactiveCount}</p>
              <p className="mt-3 text-xs text-gray-500">Frames captured for detailed, touch-driven viewing.</p>
            </article>
          </section>

          <section className="grid grid-cols-1 gap-6 md:grid-cols-[1.1fr_1fr]">
            <div className="border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-black">Our Story</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                SPURR was born from a love of design, speed, and the culture around automotive craftsmanship. We are
                building a platform that respects every line, spec, and sound of the vehicles we spotlight.
              </p>
              <div className="mt-6 space-y-4">
                {storySteps.map((step) => (
                  <div key={step.title} className="border-l-2 border-black/10 pl-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-black">{step.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="border border-black/10 bg-white p-6">
              <h2 className="text-2xl font-semibold tracking-tight text-black">The Experience</h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Every touchpoint is designed to feel premium and effortless, from the moment you arrive to the moment
                you reserve a drive.
              </p>
              <div className="mt-6 space-y-4">
                {experiencePillars.map((pillar) => (
                  <article key={pillar.title} className="border border-black/10 bg-[#f7f4ef] p-4">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-black">{pillar.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">{pillar.description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold tracking-tight text-black">What Makes SPURR Different</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              {coreValues.map((item) => (
                <article key={item.title} className="border border-black/10 bg-white p-4">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-black">{item.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">{item.description}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="border border-black/10 bg-black p-6 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">Explore, Save, and Rent</h2>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">
              Ready to explore the collection? You can head straight to the cars page, save your favorites, and
              continue to rental whenever you are ready.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/car"
                className="border border-white bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
              >
                View Cars
              </Link>
              <Link
                href="/wishlist"
                className="border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black"
              >
                Open Wishlist
              </Link>
              <Link
                href="/rentals"
                className="border border-white/30 px-4 py-2 text-xs uppercase tracking-[0.16em] text-white hover:bg-white hover:text-black"
              >
                Start Rental
              </Link>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}