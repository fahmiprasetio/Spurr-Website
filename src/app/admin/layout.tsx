"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_TABS = [
  { label: "Dashboard", href: "/admin" },
  { label: "Users", href: "/admin/users" },
];

function normalizePath(path: string): string {
  return path.replace(/\/+$/, "") || "/";
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentPath = normalizePath(pathname || "/admin");

  return (
    <>
      <div className="px-6 pt-24">
        <nav className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 border border-black/10 bg-white/90 p-2 shadow-sm">
          <span className="px-3 py-1 text-[10px] uppercase tracking-[0.26em] text-gray-400">
            Spurr Admin
          </span>
          {ADMIN_TABS.map((tab) => {
            const tabPath = normalizePath(tab.href);
            const isActive =
              currentPath === tabPath ||
              (tabPath !== "/admin" && currentPath.startsWith(`${tabPath}/`));

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={
                  isActive
                    ? "border border-black bg-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-white"
                    : "border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </>
  );
}
