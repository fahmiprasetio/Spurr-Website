import { cookies } from "next/headers";
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
