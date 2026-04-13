import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/wishlist");
  }

  const wishlistItems = await prisma.wishlistItem.findMany({
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
  });

  async function toggleWishlistAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/wishlist");
    }

    const carId = formData.get("carId");

    if (typeof carId !== "string" || !carId.trim()) {
      return;
    }

    const targetCar = await prisma.car.findUnique({
      where: { id: carId },
      select: { id: true },
    });

    if (!targetCar) {
      return;
    }

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_carId: {
          userId: currentUser.id,
          carId,
        },
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } });
    }

    revalidatePath("/wishlist");
    revalidatePath("/profile");
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-5xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Simpan</h1>
            <p className="mt-2 text-sm text-gray-500">
              Daftar mobil yang sudah Anda simpan untuk dipertimbangkan atau diproses ke rental.
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Kembali ke Profile
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {wishlistItems.map((item) => (
            <article key={item.id} className="border border-black/10 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{item.car.brand.name}</p>
              <h2 className="mt-2 text-xl font-semibold text-black">{item.car.name}</h2>
              <p className="mt-1 text-sm text-gray-500">
                {item.car.year} • {item.car.power} • {item.car.topSpeed}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/car/${item.car.id}`}
                  className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                >
                  Lihat Detail
                </Link>

                <form action={toggleWishlistAction}>
                  <input type="hidden" name="carId" value={item.car.id} />
                  <button
                    type="submit"
                    className="border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </article>
          ))}

          {wishlistItems.length === 0 ? (
            <div className="md:col-span-2 border border-dashed border-black/20 bg-white px-4 py-8 text-center">
              <p className="text-sm text-gray-500">Belum ada mobil yang disimpan.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
