import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white" id="about">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <h2 className="text-3xl font-bold tracking-[0.3em] uppercase mb-4">
              SPURR
            </h2>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Celebrating the world&apos;s most iconic sport and exotic cars.
              From Italian masterpieces to Japanese legends, experience
              automotive excellence.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">
              Navigate
            </h3>
            <div className="flex flex-col gap-3">
              <Link
                href="/"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="#collection"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Collection
              </Link>
              <Link
                href="#brands"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Brands
              </Link>
            </div>
          </div>

          {/* Brands */}
          <div>
            <h3 className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">
              Featured Brands
            </h3>
            <div className="flex flex-col gap-3">
              <span className="text-sm text-gray-300">Ferrari</span>
              <span className="text-sm text-gray-300">Bugatti</span>
              <span className="text-sm text-gray-300">Porsche</span>
              <span className="text-sm text-gray-300">Lamborghini</span>
              <span className="text-sm text-gray-300">Koenigsegg</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500 tracking-wider">
            &copy; {new Date().getFullYear()} SPURR. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 tracking-wider">
            Crafted with passion for automotive excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}
