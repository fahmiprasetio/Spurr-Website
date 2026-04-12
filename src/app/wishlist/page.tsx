import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { getCarsFromDb } from "@/lib/cars-db";
import { prisma } from "@/lib/prisma";

export default async function WishlistPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/sign-in?next=/wishlist");
  }

  const [cars, wishlistItems] = await Promise.all([
    getCarsFromDb(),
    prisma.wishlistItem.findMany({
      where: { userId: user.id },
      select: { carId: true },
    }),
  ]);

  const wishlistSet = new Set(wishlistItems.map((item) => item.carId));

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
    } else {
      await prisma.wishlistItem.create({
        data: {
          userId: currentUser.id,
          carId,
        },
      });
    }

    revalidatePath("/wishlist");
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-5xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Wishlist</h1>
            <p className="mt-2 text-sm text-gray-500">
              Simpan mobil favorit untuk diproses ke rental kapan saja.
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
          {cars.map((car) => {
            const isInWishlist = wishlistSet.has(car.id);

            return (
              <article key={car.id} className="border border-black/10 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{car.brand}</p>
                <h2 className="mt-2 text-xl font-semibold text-black">{car.name}</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {car.year} • {car.power} • {car.topSpeed}
                </p>

                <form action={toggleWishlistAction} className="mt-4">
                  <input type="hidden" name="carId" value={car.id} />
                  <button
                    type="submit"
                    className="w-full border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                  >
                    {isInWishlist ? "Hapus dari Wishlist" : "Tambah ke Wishlist"}
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
