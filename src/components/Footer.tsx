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
          paddingBottom: "1.5rem",
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
                href="/#car"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Car
              </Link>
              <Link
                href="/about"
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                About
              </Link>
            </div>
          </div>

          {/* Socials */}
          <div className="text-center md:text-left mt-10 md:mt-0">
            <h3 className="text-xs tracking-[0.2em] uppercase text-gray-400 mb-6">Social</h3>
            <div className="flex flex-col md:items-start items-center gap-2">
              <a
                href="mailto:spurr@example.com"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Email
              </a>
              <a
                href="https://instagram.com/spurr.id"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                href="https://facebook.com/spurr.id"
                className="text-sm text-gray-300 hover:text-white transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Facebook
              </a>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center mt-20 pt-6 border-t border-gray-800">
          <p className="text-xs text-gray-500 tracking-wider text-center">
            &copy; {new Date().getFullYear()} SPURR. All rights reserved. Crafted with passion.
          </p>
        </div>
      </div>
    </footer>
  );
}
