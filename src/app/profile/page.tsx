import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  deleteSessionByToken,
  getExpiredCookieOptions,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function ProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/profile");
  }

  const savedCarsCount = await prisma.wishlistItem.count({
    where: { userId: user.id },
  });

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
    <main className="min-h-screen px-6 py-28 flex items-center justify-center" style={{ background: "#e8e8e8" }}>
      <section className="w-full max-w-md border border-black/10 bg-white/95 p-8 shadow-xl rounded-xl transition-all duration-300">
        <div className="text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-gray-400 font-semibold">Your Account</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-black">Profile</h1>
        </div>

        <div className="mt-8 flex flex-col items-center">
          {user.profileImage ? (
            <img
              src={user.profileImage}
              alt="Profile"
              className="h-20 w-20 rounded-full border border-black/10 object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-black/10 bg-black text-2xl font-semibold text-white shadow-sm">
              {(user.name?.trim() || user.email).charAt(0).toUpperCase()}
            </div>
          )}

          <div className="mt-4 text-center">
            <h2 className="text-lg font-semibold text-black leading-snug">{user.name || "(not set)"}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{user.email}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-black/5 pt-6 space-y-3.5 text-xs text-gray-600">
          <div className="flex justify-between items-center border-b border-black/[0.03] pb-2">
            <span className="font-medium text-gray-400 uppercase tracking-wider">Joined</span>
            <span className="text-black font-medium">
              {new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(user.createdAt)}
            </span>
          </div>
          <div className="flex justify-between items-center border-b border-black/[0.03] pb-2">
            <span className="font-medium text-gray-400 uppercase tracking-wider">Role</span>
            <span className="text-black font-medium uppercase tracking-wider">{user.role}</span>
          </div>
          <div className="flex justify-between items-center pb-1">
            <span className="font-medium text-gray-400 uppercase tracking-wider">Saved Cars</span>
            <span className="text-black font-semibold bg-gray-100 px-2 py-0.5 rounded-full">{savedCarsCount}</span>
          </div>
        </div>

        <div className="mt-8 border-t border-black/5 pt-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-gray-400 text-center">Feature Access</p>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link
              href="/profile/edit"
              className="flex justify-center items-center border border-black/20 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
            >
              Edit Profile
            </Link>
            <Link
              href="/wishlist"
              className="flex justify-center items-center border border-black/20 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
            >
              Saved Cars
            </Link>
            <Link
              href="/rentals"
              className="flex justify-center items-center border border-black/20 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
            >
              Rentals
            </Link>
            <Link
              href="/notifications"
              className="flex justify-center items-center border border-black/20 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
            >
              Notifications
            </Link>
            {user.role === "ADMIN" ? (
              <Link
                href="/admin"
                className="col-span-2 flex justify-center items-center border border-black py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white hover:border-black transition-all rounded-sm"
              >
                Admin Dashboard
              </Link>
            ) : null}
          </div>
        </div>

        <form action={signOutAction} className="mt-8">
          <button
            type="submit"
            className="w-full border border-black bg-black py-3 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-white hover:text-black hover:border-black transition-all rounded-sm shadow-sm"
          >
            Sign Out
          </button>
        </form>
      </section>
    </main>
  );
}
