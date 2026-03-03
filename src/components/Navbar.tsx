"use client";

import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-[0.3em] uppercase text-black">
              SPURR
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            <Link
              href="/"
              className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors duration-300"
            >
              Home
            </Link>
            <Link
              href="#collection"
              className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors duration-300"
            >
              Collection
            </Link>
            <Link
              href="#brands"
              className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors duration-300"
            >
              Brands
            </Link>
            <Link
              href="#about"
              className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors duration-300"
            >
              About
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`block w-6 h-0.5 bg-black transition-all duration-300 ${
                isOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-6 py-6 bg-white border-t border-gray-100 flex flex-col gap-4">
          <Link
            href="/"
            onClick={() => setIsOpen(false)}
            className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors"
          >
            Home
          </Link>
          <Link
            href="#collection"
            onClick={() => setIsOpen(false)}
            className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors"
          >
            Collection
          </Link>
          <Link
            href="#brands"
            onClick={() => setIsOpen(false)}
            className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors"
          >
            Brands
          </Link>
          <Link
            href="#about"
            onClick={() => setIsOpen(false)}
            className="text-sm tracking-widest uppercase text-black hover:text-gray-500 transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
