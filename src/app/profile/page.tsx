import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteSessionByToken,
  getExpiredCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/profile");
  }

  async function signOutAction() {
    "use server";

    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await deleteSessionByToken(token);
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", getExpiredCookieOptions());
    redirect("/");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="w-full max-w-xl border border-black/10 bg-white/90 shadow-sm" style={{ padding: "2rem" }}>
        <p className="text-xs tracking-[0.25em] uppercase text-gray-400">Your Account</p>
        <h1 className="text-3xl font-semibold tracking-tight text-black mt-3">Profile</h1>

        <div className="mt-8 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Name</p>
            <p className="text-base text-black mt-1">{user.name || "(belum diisi)"}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Email</p>
            <p className="text-base text-black mt-1">{user.email}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Joined</p>
            <p className="text-base text-black mt-1">
              {new Intl.DateTimeFormat("id-ID", {
                dateStyle: "long",
              }).format(user.createdAt)}
            </p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Role</p>
            <p className="text-base text-black mt-1">{user.role}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-black/10 pt-6">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Feature Access</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/wishlist"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
            >
              Wishlist
            </Link>
            <Link
              href="/rentals"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
            >
              Rentals
            </Link>
            <Link
              href="/notifications"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
            >
              Notifications
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="border border-black px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
              >
                Admin Dashboard
              </Link>
            ) : null}
          </div>
        </div>

        <form action={signOutAction} className="mt-10">
          <button
            type="submit"
            className="border border-black text-black py-3 px-6 uppercase tracking-[0.18em] text-sm hover:bg-black hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </form>
      </section>
    </main>
  );
}
