import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div
        className="w-full"
        style={{
          maxWidth: "72rem",
          marginInline: "auto",
          paddingInline: "clamp(0.75rem, 2vw, 1.5rem)",
          paddingTop: "4rem",
          paddingBottom: "3.5rem",
        }}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 items-start justify-items-center md:justify-items-start">
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
              style={{ marginBottom: "1.5rem" }}
            >
              Navigate
            </h3>
            <div className="flex flex-col" style={{ gap: "0.7rem" }}>
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
                href="/about"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                About
              </Link>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center mt-10 pt-6 border-t border-gray-800"
        >
          <p className="text-xs text-gray-500 tracking-wider mb-1">
            &copy; {new Date().getFullYear()} SPURR. All rights reserved.
          </p>
          <p className="text-xs text-gray-500 tracking-wider">
            Crafted with passion.
          </p>
        </div>
      </div>
    </footer>
  );
}
