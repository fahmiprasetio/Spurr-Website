import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

const STATUS_MESSAGES: Record<string, string> = {
  removed: "Car removed from wishlist.",
  "already-removed": "Car was already removed from wishlist.",
};

const ERROR_MESSAGES: Record<string, string> = {
  "invalid-car": "Invalid car data. Please try again.",
  "car-not-found": "Car not found.",
  "remove-failed": "Failed to update wishlist. Please try again.",
};

type WishlistPageProps = {
  searchParams: Promise<{ status?: string; error?: string }>;
};

export default async function WishlistPage({ searchParams }: WishlistPageProps) {
  const [user, resolvedSearchParams] = await Promise.all([
    getCurrentUser(),
    searchParams,
  ]);

  if (!user) {
    redirect("/sign-in?next=/wishlist");
  }

  const statusMessage = resolvedSearchParams.status
    ? STATUS_MESSAGES[resolvedSearchParams.status] ?? null
    : null;

  const errorMessage = resolvedSearchParams.error
    ? ERROR_MESSAGES[resolvedSearchParams.error] ?? null
    : null;

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

  async function removeWishlistAction(formData: FormData) {
    "use server";

    const currentUser = await getCurrentUser();

    if (!currentUser) {
      redirect("/sign-in?next=/wishlist");
    }

    const carId = formData.get("carId");

    if (typeof carId !== "string" || !carId.trim()) {
      redirect("/wishlist?error=invalid-car");
    }

    const targetCar = await prisma.car.findUnique({
      where: { id: carId },
      select: { id: true },
    });

    if (!targetCar) {
      redirect("/wishlist?error=car-not-found");
    }

    const deleted = await prisma.wishlistItem.deleteMany({
      where: {
        userId: currentUser.id,
        carId,
      },
    }).catch((error) => {
      console.error("removeWishlistAction failed:", error);
      return null;
    });

    if (!deleted) {
      redirect("/wishlist?error=remove-failed");
    }

    revalidatePath("/wishlist");
    revalidatePath("/profile");
    redirect(`/wishlist?status=${deleted.count > 0 ? "removed" : "already-removed"}`);
  }

  return (
    <main className="min-h-screen px-6 py-28" style={{ background: "#e8e8e8" }}>
      <section className="mx-auto w-full max-w-5xl rounded-sm border border-black/10 bg-white/90 p-6 shadow-sm md:p-8">
        {statusMessage ? (
          <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {statusMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.26em] text-gray-400">Account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">Saved Cars</h1>
            <p className="mt-2 text-sm text-gray-500">
              Cars you have saved to revisit later or continue to the rental process.
            </p>
          </div>
          <Link
            href="/profile"
            className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.2em] text-black hover:bg-black hover:text-white"
          >
            Back to Profile
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4">
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
                  View Details
                </Link>

                <form action={removeWishlistAction}>
                  <input type="hidden" name="carId" value={item.car.id} />
                  <button
                    type="submit"
                    className="border border-black px-4 py-2 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-black hover:text-white"
                  >
                    Remove
                  </button>
                </form>
              </div>
            </article>
          ))}

          {wishlistItems.length === 0 ? (
            <div className="w-full border border-dashed border-black/20 bg-white px-4 py-8 text-center">
              <p className="text-sm text-gray-500">No saved cars yet.</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
