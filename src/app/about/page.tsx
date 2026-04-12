import Link from "next/link";
import { getCarsFromDb } from "@/lib/cars-db";

const coreValues = [
  {
    title: "Curated Experience",
    description:
      "Kami memilih mobil berdasarkan karakter, cerita, dan pencapaian teknisnya agar setiap kunjungan terasa berkelas.",
  },
  {
    title: "Interactive Showcase",
    description:
      "Setiap mobil ditampilkan dengan frame sequence hover sehingga pengguna bisa melihat detail desain secara lebih hidup.",
  },
  {
    title: "Rental Ready",
    description:
      "Platform ini tidak hanya menampilkan koleksi, tetapi juga dirancang untuk mendukung alur booking dan rental secara nyata.",
  },
];

const highlights = [
  "Collection gallery dengan efek frame animation yang immersive",
  "Wishlist untuk menyimpan mobil impian pengguna",
  "Sistem rental dan pembayaran dengan status tracking",
  "Dashboard admin untuk monitoring operasional",
  "Riwayat notifikasi email untuk update transaksi",
];

const roadmap = [
  "Penambahan aset mobil baru secara bertahap",
  "Peningkatan performa untuk perangkat low-end",
  "Detail analytics untuk melihat minat pengguna per model",
  "Integrasi peta pickup/drop-off yang lebih fleksibel",
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
            SPURR adalah website gallery otomotif modern yang menggabungkan visual eksploratif, informasi mobil premium,
            dan alur rental yang terstruktur. Tujuan kami adalah menghadirkan pengalaman browsing mobil mewah yang
            terasa cepat, interaktif, dan mudah digunakan.
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
            Ingin mulai menjelajahi koleksi? Anda bisa langsung menuju halaman collection, menyimpan mobil favorit,
            dan melanjutkan ke proses rental kapan pun siap.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/collection"
              className="border border-white bg-white px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
            >
              View Collection
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