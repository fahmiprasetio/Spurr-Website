"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 8;

const menuItems = [
  { label: "Collection", href: "#collection" },
  { label: "Brands", href: "#brands" },
  { label: "About", href: "#about" },
];

function NavMenuItem({
  label,
  href,
  onClick,
  className = "",
}: {
  label: string;
  href: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`group relative text-base tracking-[0.2em] uppercase text-white w-fit ${className}`}
    >
      {label}
      <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-white transition-all duration-300 ease-out group-hover:w-full" />
    </Link>
  );
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className={`fixed left-0 right-0 z-60 transition-all duration-300 ${
          isScrolled ? "top-3 px-4 flex justify-center" : "top-0"
        }`}
      >
        <div className={isScrolled ? "w-full max-w-3xl" : "w-full"}>
          <nav
            className={`transition-all duration-300 ${
              isScrolled
                ? "backdrop-blur-sm rounded-xl border border-white/15 shadow-xl"
                : "backdrop-blur-md border-b border-black/10"
            }`}
            style={{
              background: isScrolled ? "rgba(0, 0, 0, 0.32)" : "rgba(232,232,232,0.90)",
              boxShadow: isScrolled ? "0 12px 40px rgba(0,0,0,0.25)" : "0 1px 12px rgba(0,0,0,0.07)",
            }}
          >
            <div
              className={`flex items-center justify-between h-14 ${
                isScrolled ? "px-6 lg:px-8" : "px-8 lg:px-12"
              }`}
            >
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <span
                  className={`text-base font-bold tracking-[0.35em] uppercase select-none transition-colors duration-300 ${
                    isScrolled ? "text-white" : "text-black"
                  }`}
                >
                  SPURR
                </span>
              </Link>

              {/* Hamburger/X button */}
              {isOpen ? (
                <button
                  onClick={() => setIsOpen(false)}
                  className={`text-2xl p-2 ml-2 lg:ml-4 focus:outline-none transition-colors duration-300 ${
                    isScrolled ? "text-white" : "text-black"
                  }`}
                  style={{ border: "none", background: "none", boxShadow: "none", outline: "none" }}
                  aria-label="Close menu"
                >
                  &times;
                </button>
              ) : (
                <button
                  onClick={() => setIsOpen(true)}
                  className="flex flex-col justify-center gap-1.25 p-2"
                  aria-label="Toggle menu"
                >
                  <span
                    className={`block w-5 h-[1.5px] transition-all duration-300 ${
                      isScrolled ? "bg-white" : "bg-black"
                    }`}
                  />
                  <span
                    className={`block w-5 h-[1.5px] transition-all duration-300 ${
                      isScrolled ? "bg-white" : "bg-black"
                    }`}
                  />
                  <span
                    className={`block w-5 h-[1.5px] transition-all duration-300 ${
                      isScrolled ? "bg-white" : "bg-black"
                    }`}
                  />
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Dropdown menu and backdrop as siblings to avoid navbar stacking context issues */}
      {isOpen ? (
        <div
          className={`fixed left-0 right-0 z-50 flex justify-center px-4 transition-all duration-300 ${
            isScrolled ? "top-19" : "top-14"
          }`}
        >
          <div
            className={`w-full bg-black/70 border border-white/10 ${
              isScrolled ? "backdrop-blur-md max-w-3xl rounded-xl" : "backdrop-blur-lg"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-full flex flex-col gap-6 ${isScrolled ? "px-6 lg:px-8" : "px-8 lg:px-12"}`}>
              {menuItems.map((item, index) => (
                <NavMenuItem
                  key={item.href}
                  label={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`${index === 0 ? "mt-4" : ""} ${index === menuItems.length - 1 ? "mb-4" : ""}`.trim()}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
