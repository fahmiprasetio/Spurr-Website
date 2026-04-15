"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 8;
const NAVBAR_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

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

function NavActionButton({
  label,
  onClick,
  disabled = false,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group relative text-base tracking-[0.2em] uppercase text-white w-fit text-left disabled:opacity-50"
    >
      {label}
      <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-white transition-all duration-300 ease-out group-hover:w-full" />
    </button>
  );
}

type AuthUser = {
  id: string;
  name: string | null;
  email: string;
  role: "USER" | "ADMIN";
};

function normalizePath(path: string) {
  return path.replace(/\/+$/, "") || "/";
}

const KNOWN_NON_HOME_PREFIXES = [
  "/about",
  "/admin",
  "/car",
  "/collection",
  "/notifications",
  "/profile",
  "/rentals",
  "/saved",
  "/sign-in",
  "/sign-up",
  "/wishlist",
];

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  const fallbackPath = typeof window !== "undefined" ? window.location.pathname : "/";
  const normalizedPath = normalizePath(pathname || fallbackPath);
  const isKnownNonHomeRoute = KNOWN_NON_HOME_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );
  const isHomeRoute = !isKnownNonHomeRoute;

  const isTopTransparent = isHomeRoute && !isScrolled;
  const useLightForeground = isTopTransparent || isScrolled;
  const foregroundColor = useLightForeground ? "#ffffff" : "#111111";
  const contentInset = isScrolled
    ? "clamp(1rem, 2.6vw, 1.75rem)"
    : "clamp(1.375rem, 4vw, 3.25rem)";
  const navbarWidth = isScrolled ? "min(40rem, calc(100vw - 2rem))" : "100vw";
  const navbarOffsetY = isScrolled ? "0.75rem" : "0rem";
  const navbarRadius = isScrolled ? "0.875rem" : "0rem";
  const navbarBlur = isScrolled ? "blur(0.375rem)" : "blur(0.625rem)";
  const publicMenuItems = [
    { label: "Home", href: "/" },
    { label: "Cars", href: "/car" },
    { label: "About", href: "/about" },
  ];
  const signedInMenuItems = [
    ...publicMenuItems,
    { label: "Profile", href: "/profile" },
    { label: "Notification", href: "/notifications" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadAuthState() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const result = (await response.json().catch(() => ({}))) as {
          user?: AuthUser | null;
        };

        if (isMounted) {
          setCurrentUser(result.user ?? null);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    loadAuthState();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/sign-out", { method: "POST" });
      setCurrentUser(null);
      setIsOpen(false);
      router.replace("/");
    } finally {
      setSigningOut(false);
    }
  }

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
              background: isOpen && isTopTransparent
                ? "rgba(0, 0, 0, 0.7)"
                : isTopTransparent
                ? "transparent"
                : isScrolled
                ? "rgba(0, 0, 0, 0.55)"
                : "rgba(250, 250, 250, 0.96)",
              boxShadow: isScrolled
                ? "0 0 0.8rem rgba(255,255,255,0.16), 0 0.75rem 2rem rgba(0,0,0,0.28)"
                : "none",
              paddingInline: contentInset,
              borderRadius: navbarRadius,
              backdropFilter: isTopTransparent && !isOpen
                ? "none"
                : isScrolled
                ? navbarBlur
                : "none",
              WebkitBackdropFilter: isTopTransparent && !isOpen
                ? "none"
                : isScrolled
                ? navbarBlur
                : "none",
              border: isScrolled || (isOpen && isTopTransparent)
                ? isScrolled
                  ? "0.0625rem solid rgba(255,255,255,0.35)"
                  : "0.0625rem solid rgba(255,255,255,0.10)"
                : "0.0625rem solid rgba(0,0,0,0.08)",
              borderBottom: isTopTransparent && !isOpen
                ? "0.0625rem solid rgba(255,255,255,0.72)"
                : isScrolled || (isOpen && isTopTransparent)
                ? "0.0625rem solid rgba(255,255,255,0.10)"
                : "0.0625rem solid rgba(0,0,0,0.1)",
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
                  className="text-base font-bold tracking-[0.35em] uppercase select-none transition-colors duration-500"
                  style={{ color: foregroundColor }}
                >
                  SPURR
                </span>
              </Link>

              {/* Hamburger/X button */}
              {isOpen ? (
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-2xl p-2 ml-2 lg:ml-4 focus:outline-none transition-colors duration-500"
                  style={{
                    border: "none",
                    background: "none",
                    boxShadow: "none",
                    outline: "none",
                    color: foregroundColor,
                  }}
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
                    className="block w-5 h-[0.09375rem] transition-all duration-500"
                    style={{ backgroundColor: foregroundColor }}
                  />
                  <span
                    className="block w-5 h-[0.09375rem] transition-all duration-500"
                    style={{ backgroundColor: foregroundColor }}
                  />
                  <span
                    className="block w-5 h-[0.09375rem] transition-all duration-500"
                    style={{ backgroundColor: foregroundColor }}
                  />
                </button>
              )}
            </div>
          </nav>
        </div>
      </div>

      {/* Dropdown menu and backdrop as siblings to avoid navbar stacking context issues */}
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            className="fixed left-0 right-0 z-50 flex justify-center"
            initial={{ opacity: 0, y: "-0.75rem" }}
            animate={{ opacity: 1, y: "0rem" }}
            exit={{ opacity: 0, y: "-0.5rem" }}
            transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
            style={{
              top: isScrolled ? "4.75rem" : "3.5rem",
              transition: `top 560ms ${NAVBAR_EASING}`,
            }}
          >
            <div
              className="bg-black/70"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: navbarWidth,
                borderRadius: navbarRadius,
                border: isScrolled
                  ? "0.0625rem solid rgba(255,255,255,0.35)"
                  : "0.0625rem solid rgba(255,255,255,0.10)",
                backdropFilter: isScrolled ? "blur(0.5rem)" : "blur(0.75rem)",
                WebkitBackdropFilter: isScrolled
                  ? "blur(0.5rem)"
                  : "blur(0.75rem)",
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
                  paddingBlock: "clamp(0.75rem, 1.8vh, 1rem)",
                  transition: `padding-inline 560ms ${NAVBAR_EASING}`,
                }}
              >
                {(currentUser ? signedInMenuItems : publicMenuItems).map((item) => (
                  <NavMenuItem
                    key={item.href}
                    label={item.label}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                  />
                ))}

                <div className="h-px bg-white/10" />

                {authLoading ? (
                  <p className="text-xs tracking-[0.16em] uppercase text-white/55">
                    Loading account...
                  </p>
                ) : currentUser ? (
                  <NavActionButton
                    label={signingOut ? "Signing Out..." : "Sign Out"}
                    onClick={handleSignOut}
                    disabled={signingOut}
                  />
                ) : (
                  <div className="flex justify-center items-center gap-8 w-full">
                    <NavMenuItem
                      label="Sign In"
                      href="/sign-in"
                      onClick={() => setIsOpen(false)}
                    />
                    <div className="w-px h-6 bg-white/20" />
                    <NavMenuItem
                      label="Sign Up"
                      href="/sign-up"
                      onClick={() => setIsOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
