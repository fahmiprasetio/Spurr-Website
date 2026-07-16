import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateEntityId, validateReviewComment } from "@/lib/validation";

function formatUserName(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const [localPart] = email.split("@");
  return localPart || "SPURR Driver";
}

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "read");
  if (rateLimited) return rateLimited;

  const carIdValidation = validateEntityId(request.nextUrl.searchParams.get("carId"), "carId");

  if (!carIdValidation.ok) {
    return NextResponse.json(
      { error: carIdValidation.error },
      { status: carIdValidation.status }
    );
  }

  const reviews = await prisma.carReview.findMany({
    where: { carId: carIdValidation.data },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({
    reviews: reviews.map((review) => ({
      id: review.id,
      comment: review.content,
      createdAt: review.createdAt.toISOString(),
      userName: formatUserName(review.user.name, review.user.email),
    })),
  });
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "mutation");
  if (rateLimited) return rateLimited;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You need to sign in before posting a review." },
      { status: 401 }
    );
  }

  const payload = (await request.json().catch(() => null)) as
    | { carId?: string; comment?: string }
    | null;

  const carIdValidation = validateEntityId(payload?.carId, "carId");
  if (!carIdValidation.ok) {
    return NextResponse.json(
      { error: carIdValidation.error },
      { status: carIdValidation.status }
    );
  }

  const commentValidation = validateReviewComment(payload?.comment);
  if (!commentValidation.ok) {
    return NextResponse.json(
      { error: commentValidation.error },
      { status: commentValidation.status }
    );
  }

  const carId = carIdValidation.data;
  const comment = commentValidation.data;

  const targetCar = await prisma.car.findUnique({
    where: { id: carId },
    select: { id: true },
  });

  if (!targetCar) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
  }

  const created = await prisma.carReview.create({
    data: {
      carId,
      userId: currentUser.id,
      content: comment,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json(
    {
      review: {
        id: created.id,
        comment: created.content,
        createdAt: created.createdAt.toISOString(),
        userName: formatUserName(created.user.name, created.user.email),
      },
    },
    { status: 201 }
  );
}
