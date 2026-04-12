import { cookies } from "next/headers";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  deleteSessionByToken,
  getExpiredCookieOptions,
  hashPassword,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

type ProfilePageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

function isValidImageUrl(value: string): boolean {
  if (!value) {
    return true;
  }

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

const STATUS_MESSAGES: Record<string, string> = {
  "profile-updated": "Profil berhasil diperbarui.",
  "password-updated": "Password berhasil diganti.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-name": "Username harus 2 sampai 40 karakter.",
  "invalid-image": "URL foto profil tidak valid.",
  "password-required": "Semua field password wajib diisi.",
  "password-length": "Password baru minimal 8 karakter.",
  "password-mismatch": "Konfirmasi password tidak cocok.",
  "password-invalid": "Password saat ini salah.",
  "password-same": "Password baru harus berbeda dari password saat ini.",
};

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/sign-in?next=/profile");
  }

  const savedCars = await prisma.wishlistItem.findMany({
    where: { userId: user.id },
    include: {
      car: {
        include: {
          brand: {
            select: { name: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  const statusMessage = resolvedSearchParams.status
    ? STATUS_MESSAGES[resolvedSearchParams.status] ?? null
    : null;

  const errorMessage = resolvedSearchParams.error
    ? ERROR_MESSAGES[resolvedSearchParams.error] ?? null
    : null;

  async function updateProfileAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/profile");
    }

    const name = typeof formData.get("name") === "string" ? formData.get("name")!.toString().trim() : "";
    const profileImage =
      typeof formData.get("profileImage") === "string"
        ? formData.get("profileImage")!.toString().trim()
        : "";

    if (name.length < 2 || name.length > 40) {
      redirect("/profile?error=invalid-name");
    }

    if (!isValidImageUrl(profileImage)) {
      redirect("/profile?error=invalid-image");
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: {
        name,
        profileImage: profileImage || null,
      },
    });

    revalidatePath("/profile");
    revalidatePath("/wishlist");
    redirect("/profile?status=profile-updated");
  }

  async function updatePasswordAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/profile");
    }

    const currentPassword =
      typeof formData.get("currentPassword") === "string"
        ? formData.get("currentPassword")!.toString()
        : "";
    const newPassword =
      typeof formData.get("newPassword") === "string"
        ? formData.get("newPassword")!.toString()
        : "";
    const confirmPassword =
      typeof formData.get("confirmPassword") === "string"
        ? formData.get("confirmPassword")!.toString()
        : "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      redirect("/profile?error=password-required");
    }

    if (newPassword.length < 8) {
      redirect("/profile?error=password-length");
    }

    if (newPassword !== confirmPassword) {
      redirect("/profile?error=password-mismatch");
    }

    if (currentPassword === newPassword) {
      redirect("/profile?error=password-same");
    }

    const userWithPassword = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { id: true, passwordHash: true },
    });

    if (!userWithPassword || !verifyPassword(currentPassword, userWithPassword.passwordHash)) {
      redirect("/profile?error=password-invalid");
    }

    await prisma.user.update({
      where: { id: currentUser.id },
      data: { passwordHash: hashPassword(newPassword) },
    });

    revalidatePath("/profile");
    redirect("/profile?status=password-updated");
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
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-6xl space-y-6">
        {statusMessage ? (
          <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.3fr]">
          <article className="border border-black/10 bg-white/90 p-6 shadow-sm">
            <p className="text-xs tracking-[0.25em] uppercase text-gray-400">Your Account</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">Profile</h1>

            <div className="mt-6 flex items-center gap-4">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="h-16 w-16 rounded-full border border-black/20 object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-black/20 bg-black text-xl font-semibold text-white">
                  {(user.name?.trim() || user.email).charAt(0).toUpperCase()}
                </div>
              )}

              <div>
                <p className="text-base text-black">{user.name || "(belum diisi)"}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-gray-600">
              <p>
                Joined: {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(user.createdAt)}
              </p>
              <p>Role: {user.role}</p>
              <p>Total mobil disimpan: {savedCars.length}</p>
            </div>

            <div className="mt-8 border-t border-black/10 pt-6">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Feature Access</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  href="/wishlist"
                  className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
                >
                  Simpan
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

            <form action={signOutAction} className="mt-8">
              <button
                type="submit"
                className="border border-black px-6 py-3 text-sm uppercase tracking-[0.18em] text-black transition-colors hover:bg-black hover:text-white"
              >
                Sign Out
              </button>
            </form>
          </article>

          <article className="space-y-6">
            <div className="border border-black/10 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-black">Edit Profil</h2>
              <form action={updateProfileAction} className="mt-5 space-y-4">
                <label className="block text-sm text-gray-600">
                  Username
                  <input
                    type="text"
                    name="name"
                    defaultValue={user.name ?? ""}
                    required
                    minLength={2}
                    maxLength={40}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                    placeholder="Masukkan username"
                  />
                </label>

                <label className="block text-sm text-gray-600">
                  URL Foto Profil
                  <input
                    type="url"
                    name="profileImage"
                    defaultValue={user.profileImage ?? ""}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                    placeholder="https://example.com/foto.jpg"
                  />
                </label>

                <button
                  type="submit"
                  className="border border-black bg-black px-5 py-2 text-xs uppercase tracking-[0.18em] text-white hover:bg-white hover:text-black"
                >
                  Simpan Perubahan Profil
                </button>
              </form>
            </div>

            <div className="border border-black/10 bg-white/90 p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-black">Ganti Password</h2>
              <form action={updatePasswordAction} className="mt-5 space-y-4">
                <label className="block text-sm text-gray-600">
                  Password Saat Ini
                  <input
                    type="password"
                    name="currentPassword"
                    required
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>

                <label className="block text-sm text-gray-600">
                  Password Baru
                  <input
                    type="password"
                    name="newPassword"
                    required
                    minLength={8}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>

                <label className="block text-sm text-gray-600">
                  Konfirmasi Password Baru
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    className="mt-2 w-full border border-black/20 px-3 py-2 outline-none focus:border-black"
                  />
                </label>

                <button
                  type="submit"
                  className="border border-black px-5 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
                >
                  Simpan Password Baru
                </button>
              </form>
            </div>
          </article>
        </div>

        <article className="border border-black/10 bg-white/90 p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-black">Mobil Tersimpan</h2>
            <Link
              href="/wishlist"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.18em] text-black hover:bg-black hover:text-white"
            >
              Lihat Semua Simpan
            </Link>
          </div>

          {savedCars.length === 0 ? (
            <p className="mt-4 border border-dashed border-black/20 bg-white px-4 py-6 text-sm text-gray-500">
              Anda belum menyimpan mobil apa pun.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedCars.map((item) => (
                <article key={item.id} className="border border-black/10 bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-gray-400">{item.car.brand.name}</p>
                  <h3 className="mt-2 text-base font-semibold text-black">{item.car.name}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.car.year} • {item.car.power} • {item.car.topSpeed}
                  </p>
                  <Link
                    href={`/collection/${item.car.id}`}
                    className="mt-4 inline-block border border-black/20 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
                  >
                    Lihat Mobil
                  </Link>
                </article>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
