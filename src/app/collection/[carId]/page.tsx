import Link from "next/link";
import { notFound } from "next/navigation";
import { framesMap } from "@/data/frames";
import ProtectedCarActions from "@/components/ProtectedCarActions";
import CarReviewsPanel from "@/components/CarReviewsPanel";
import { getCurrentUser } from "@/lib/auth-server";
import { getCarsFromDb } from "@/lib/cars-db";
import { prisma } from "@/lib/prisma";
import { calculateDailyRate, formatRupiah } from "@/lib/rental";

type CarDetailPageProps = {
  params: Promise<{ carId: string }>;
};

const SHOWROOM_LOCATION = {
  name: "SPURR Experience Center",
  address: "SCBD Sudirman, Jakarta",
  latitude: -6.224241,
  longitude: 106.809844,
};

function buildOpenStreetMapEmbedUrl(latitude: number, longitude: number): string {
  const west = (longitude - 0.018).toFixed(6);
  const south = (latitude - 0.01).toFixed(6);
  const east = (longitude + 0.018).toFixed(6);
  const north = (latitude + 0.01).toFixed(6);
  const marker = `${latitude.toFixed(6)}%2C${longitude.toFixed(6)}`;

  return `https://www.openstreetmap.org/export/embed.html?bbox=${west}%2C${south}%2C${east}%2C${north}&layer=mapnik&marker=${marker}`;
}

function buildOpenStreetMapViewUrl(latitude: number, longitude: number): string {
  return `https://www.openstreetmap.org/?mlat=${latitude.toFixed(6)}&mlon=${longitude.toFixed(6)}#map=15/${latitude.toFixed(6)}/${longitude.toFixed(6)}`;
}

export default async function CarDetailPage({ params }: CarDetailPageProps) {
  const { carId } = await params;
  const [cars, currentUser] = await Promise.all([getCarsFromDb(), getCurrentUser()]);
  const car = cars.find((item) => item.id === carId);

  if (!car) {
    notFound();
  }

  const sequenceFrames = car.sequenceFolder ? framesMap[car.sequenceFolder] ?? [] : [];
  const sequenceFolderPath =
    car.sequenceFolder && car.sequenceFolder.trim() !== "" ? `${car.sequenceFolder}/` : "";

  const heroImage =
    sequenceFrames.length > 0
      ? `/car-image(sequences)/${sequenceFolderPath}${sequenceFrames[0]}`
      : car.baseImage
      ? `/car-image(based)/${car.baseImage}`
      : null;

  const dailyRate = calculateDailyRate(car.power);
  const estimatedWeekendRate = dailyRate * 2;
  const estimatedWeeklyRate = dailyRate * 7;

  const mapEmbedUrl = buildOpenStreetMapEmbedUrl(
    SHOWROOM_LOCATION.latitude,
    SHOWROOM_LOCATION.longitude
  );
  const mapViewUrl = buildOpenStreetMapViewUrl(
    SHOWROOM_LOCATION.latitude,
    SHOWROOM_LOCATION.longitude
  );
  const rentHref = `/rentals?carId=${encodeURIComponent(car.id)}`;
  const commentsHref = `/car/${encodeURIComponent(car.id)}/comments`;

  const existingWishlist = currentUser
    ? await prisma.wishlistItem.findUnique({
        where: {
          userId_carId: {
            userId: currentUser.id,
            carId: car.id,
          },
        },
        select: { id: true },
      })
    : null;

  const isInWishlist = Boolean(existingWishlist);

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
    <main className="min-h-screen bg-white pt-20">
      <section className="w-full min-h-[calc(100vh-7rem)] bg-white">
        <div className="mx-auto w-full max-w-7xl space-y-8 px-6 pb-10 md:px-8 md:pb-12">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
          <article className="overflow-hidden border border-black/10 bg-white">
            {heroImage ? (
              <img
                src={heroImage}
                alt={car.name}
                className="block w-full"
                loading="eager"
                decoding="async"
                draggable={false}
                style={{ backgroundColor: "#ffffff" }}
              />
            ) : (
              <div className="flex aspect-8/3 items-center justify-center text-xs uppercase tracking-[0.18em] text-gray-400">
                Image unavailable
              </div>
            )}
          </article>

          <article className="border border-black/10 bg-white p-5">
            <div className="border-b border-black/10 pb-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-gray-500">{car.brand}</p>
                  <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black md:text-4xl">
                    {car.name}
                  </h1>
                  <p className="mt-2 text-sm text-gray-500">Model year {car.year}</p>
                </div>
                <Link
                  href="/car"
                  className="inline-flex items-center gap-2 border border-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
                >
                  <span>←</span>
                  <span>Back to Cars</span>
                </Link>
              </div>
            </div>

            <h2 className="mt-5 text-lg font-semibold text-black">Vehicle Overview</h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">{car.description}</p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="border border-black/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Power</p>
                <p className="mt-1 text-sm font-semibold text-black">{car.power}</p>
              </div>
              <div className="border border-black/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Top Speed</p>
                <p className="mt-1 text-sm font-semibold text-black">{car.topSpeed}</p>
              </div>
              <div className="border border-black/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">0-100 km/h</p>
                <p className="mt-1 text-sm font-semibold text-black">{car.acceleration}</p>
              </div>
              <div className="border border-black/10 px-3 py-2">
                <p className="text-[10px] uppercase tracking-[0.16em] text-gray-400">Daily Rate</p>
                <p className="mt-1 text-sm font-semibold text-black">{formatRupiah(dailyRate)}</p>
              </div>
            </div>

            <div className="mt-5 border border-black/10 bg-black/2 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">Estimated Rental</p>
              <p className="mt-2 text-sm text-gray-600">
                Weekend (2 days): <span className="font-semibold text-black">{formatRupiah(estimatedWeekendRate)}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                1 Week (7 days): <span className="font-semibold text-black">{formatRupiah(estimatedWeeklyRate)}</span>
              </p>
              <div className="mt-4">
                <ProtectedCarActions
                  carId={car.id}
                  rentHref={rentHref}
                  initialInWishlist={isInWishlist}
                  isSignedIn={Boolean(currentUser)}
                />
              </div>
            </div>
          </article>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-black">Reviews</h2>
            <Link
              href={commentsHref}
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
            >
              Open comments page
            </Link>
          </div>

          <CarReviewsPanel
            carId={car.id}
            carName={car.name}
            isSignedIn={Boolean(currentUser)}
            initialReviews={reviewItems}
          />
        </div>

        <article className="border border-black/10 bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Showroom Map</p>
              <h2 className="mt-1 text-xl font-semibold text-black">{SHOWROOM_LOCATION.name}</h2>
              <p className="mt-1 text-sm text-gray-500">{SHOWROOM_LOCATION.address}</p>
            </div>
            <a
              href={mapViewUrl}
              target="_blank"
              rel="noreferrer"
              className="border border-black/20 px-4 py-2 text-xs uppercase tracking-[0.16em] text-black hover:bg-black hover:text-white"
            >
              Open Full Map
            </a>
          </div>

          <div className="mt-4 overflow-hidden border border-black/10">
            <iframe
              title="SPURR Showroom Map"
              src={mapEmbedUrl}
              className="h-88 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Map source: OpenStreetMap
          </p>
        </article>
        </div>
      </section>
    </main>
  );
}
