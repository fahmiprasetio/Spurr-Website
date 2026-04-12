import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white" id="brands">
      <div
        className="w-full"
        style={{
          maxWidth: "72rem",
          marginInline: "auto",
          paddingInline: "clamp(2rem, 5vw, 4rem)",
          paddingTop: "5.5rem",
          paddingBottom: "5.5rem",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-14 items-start justify-items-center md:justify-items-start">
          {/* Brand */}
          <div className="md:col-span-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-[0.3em] uppercase mb-4">
              SPURR
            </h2>
            <p className="text-gray-400 max-w-md leading-relaxed mx-auto md:mx-0">
              Celebrating the world&apos;s most iconic sport and exotic cars.
              From Italian masterpieces to Japanese legends, experience
              automotive excellence.
            </p>
          </div>

          {/* Navigation */}
          <div className="text-center md:text-left">
            <h3
              className="text-xs tracking-[0.2em] uppercase text-gray-400"
              style={{ marginBottom: "2.25rem" }}
            >
              Navigate
            </h3>
            <div className="flex flex-col" style={{ gap: "0.9rem" }}>
              <Link
                href="/"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Home
              </Link>
              <Link
                href="/#collection"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Collection
              </Link>
              <Link
                href="/#brands"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Brands
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Brands */}
          <div className="text-center md:text-left">
            <h3
              className="text-xs tracking-[0.2em] uppercase text-gray-400"
              style={{ marginBottom: "2.25rem" }}
            >
              Featured Brands
            </h3>
            <div className="flex flex-col" style={{ gap: "0.9rem" }}>
              <span className="text-sm text-gray-300">Ferrari</span>
              <span className="text-sm text-gray-300">Bugatti</span>
              <span className="text-sm text-gray-300">Porsche</span>
              <span className="text-sm text-gray-300">Lamborghini</span>
              <span className="text-sm text-gray-300">Koenigsegg</span>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-4 text-center md:text-left"
          style={{
            borderTop: "1px solid rgba(31, 41, 55, 0.95)",
            marginTop: "6rem",
            paddingTop: "2.75rem",
          }}
        >
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
