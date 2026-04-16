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

const highlights = [
  "Collection gallery with immersive frame animation effects",
  "Wishlist to save favorite and dream cars",
  "Rental and payment system with status tracking",
  "Admin dashboard for operational monitoring",
  "Email notification history for transaction updates",
];

const roadmap = [
  "Gradual addition of new car assets",
  "Performance improvements for low-end devices",
  "Detailed analytics to measure interest by model",
  "More flexible pickup/drop-off map integration",
];

export default async function AboutPage() {
  const cars = await getCarsFromDb();
  const brandCount = new Set(cars.map((car) => car.brand)).size;
  const interactiveCount = cars.filter((car) => car.sequenceFolder).length;

  return (
    <main className="min-h-screen bg-white pt-28">
      <section className="w-full min-h-[calc(100vh-7rem)] bg-white">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 pb-10 md:px-8 md:pb-12">
        <header className="border-b border-black/10 pb-6">
          <p className="text-xs uppercase tracking-[0.28em] text-gray-400">About SPURR</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-black md:text-5xl">
            A Digital Home for Exotic and Sport Cars
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-600 md:text-base">
            SPURR is a modern automotive gallery website that combines exploratory visuals, premium vehicle information,
            and structured rental flows. Our goal is to deliver a luxury car browsing experience that feels fast,
            interactive, and easy to use.
          </p>
        </header>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <article className="border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Cars Indexed</p>
            <p className="mt-2 text-3xl font-semibold text-black">{cars.length}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Brands Covered</p>
            <p className="mt-2 text-3xl font-semibold text-black">{brandCount}</p>
          </article>
          <article className="border border-black/10 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Interactive Models</p>
            <p className="mt-2 text-3xl font-semibold text-black">{interactiveCount}</p>
          </article>
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

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold tracking-tight text-black">Current Feature Highlights</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {highlights.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="border border-black/10 bg-white p-5">
            <h2 className="text-xl font-semibold tracking-tight text-black">Next Improvements</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              {roadmap.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-black" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="border border-black/10 bg-black p-6 text-white">
          <h2 className="text-2xl font-semibold tracking-tight">Explore, Save, and Rent</h2>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/80">
            Ready to explore the collection? You can head straight to the cars page, save your favorites,
            and continue to rental whenever you are ready.
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