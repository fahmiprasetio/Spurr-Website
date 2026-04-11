"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 8;
const NAVBAR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

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
  const contentInset = isScrolled ? "clamp(16px, 2.6vw, 28px)" : "clamp(22px, 4vw, 52px)";
  const navbarWidth = isScrolled ? "min(960px, calc(100vw - 2rem))" : "100vw";
  const navbarOffsetY = isScrolled ? "12px" : "0px";
  const navbarRadius = isScrolled ? "14px" : "0px";
  const navbarBlur = isScrolled ? "blur(6px)" : "blur(10px)";

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
      <div className="fixed left-0 right-0 top-0 z-60 flex justify-center pointer-events-none">
        <div
          className="pointer-events-auto"
          style={{
            width: navbarWidth,
            transform: `translateY(${navbarOffsetY})`,
            transition: `width 560ms ${NAVBAR_EASING}, transform 560ms ${NAVBAR_EASING}`,
          }}
        >
          <nav
            style={{
              background: isScrolled ? "rgba(0, 0, 0, 0.32)" : "rgba(232,232,232,0.90)",
              boxShadow: isScrolled ? "0 12px 40px rgba(0,0,0,0.25)" : "0 1px 12px rgba(0,0,0,0.07)",
              paddingInline: contentInset,
              borderRadius: navbarRadius,
              backdropFilter: navbarBlur,
              WebkitBackdropFilter: navbarBlur,
              border: isScrolled ? "1px solid rgba(255,255,255,0.15)" : "1px solid transparent",
              borderBottom: isScrolled ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(0,0,0,0.10)",
              transition: [
                `background 560ms ${NAVBAR_EASING}`,
                `box-shadow 560ms ${NAVBAR_EASING}`,
                `padding-inline 560ms ${NAVBAR_EASING}`,
                `border-radius 560ms ${NAVBAR_EASING}`,
                `backdrop-filter 560ms ${NAVBAR_EASING}`,
                `border-color 560ms ${NAVBAR_EASING}`,
              ].join(", "),
            }}
          >
            <div className="flex items-center justify-between h-14">
              {/* Logo */}
              <Link href="/" className="flex items-center">
                <span
                  className={`text-base font-bold tracking-[0.35em] uppercase select-none transition-colors duration-500 ${
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
                  className={`text-2xl p-2 ml-2 lg:ml-4 focus:outline-none transition-colors duration-500 ${
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
                    className={`block w-5 h-[1.5px] transition-all duration-500 ${
                      isScrolled ? "bg-white" : "bg-black"
                    }`}
                  />
                  <span
                    className={`block w-5 h-[1.5px] transition-all duration-500 ${
                      isScrolled ? "bg-white" : "bg-black"
                    }`}
                  />
                  <span
                    className={`block w-5 h-[1.5px] transition-all duration-500 ${
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
          className="fixed left-0 right-0 z-50 flex justify-center"
          style={{
            top: isScrolled ? "76px" : "56px",
            transition: `top 560ms ${NAVBAR_EASING}`,
          }}
        >
          <div
            className="bg-black/70 border border-white/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: navbarWidth,
              borderRadius: navbarRadius,
              backdropFilter: isScrolled ? "blur(8px)" : "blur(12px)",
              WebkitBackdropFilter: isScrolled ? "blur(8px)" : "blur(12px)",
              transition: [
                `width 560ms ${NAVBAR_EASING}`,
                `border-radius 560ms ${NAVBAR_EASING}`,
                `backdrop-filter 560ms ${NAVBAR_EASING}`,
              ].join(", "),
            }}
          >
            <div
              className="w-full flex flex-col gap-6"
              style={{
                paddingInline: contentInset,
                transition: `padding-inline 560ms ${NAVBAR_EASING}`,
              }}
            >
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
