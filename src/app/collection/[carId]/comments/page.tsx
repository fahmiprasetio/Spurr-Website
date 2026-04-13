import Link from "next/link";
import { notFound } from "next/navigation";
import CarReviewsPanel from "@/components/CarReviewsPanel";
import { getCurrentUser } from "@/lib/auth-server";
import { getCarsFromDb } from "@/lib/cars-db";
import { prisma } from "@/lib/prisma";

type CarCommentsPageProps = {
  params: Promise<{ carId: string }>;
};

export default async function CarCommentsPage({ params }: CarCommentsPageProps) {
  const { carId } = await params;

  const [cars, currentUser] = await Promise.all([getCarsFromDb(), getCurrentUser()]);
  const car = cars.find((item) => item.id === carId);

  if (!car) {
    notFound();
  }

  const reviews = await prisma.carReview.findMany({
    where: { carId: car.id },
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  const reviewItems = reviews.map((review) => {
    const fallbackName = review.user.email.split("@")[0] || "SPURR Driver";

    return {
      id: review.id,
      comment: review.content,
      createdAt: review.createdAt.toISOString(),
      userName: review.user.name?.trim() || fallbackName,
      userEmail: review.user.email,
    };
  });

  return (
    <main className="min-h-screen bg-white pt-28">
      <section className="mx-auto w-full max-w-7xl px-6 pb-14 md:px-8 md:pb-16">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/10 pb-6">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gray-500">Comments page</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black md:text-4xl">
              {car.brand} {car.name}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Read every review submitted by drivers and share your own experience.
            </p>
          </div>

          <Link
            href={`/car/${car.id}`}
            className="inline-flex items-center gap-2 border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
          >
            <span>←</span>
            <span>Back to car detail</span>
          </Link>
        </div>

        <div className="mt-6">
          <CarReviewsPanel
            carId={car.id}
            carName={car.name}
            isSignedIn={Boolean(currentUser)}
            initialReviews={reviewItems}
          />
        </div>
      </section>
    </main>
  );
}
