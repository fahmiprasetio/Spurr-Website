import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

function formatUserName(name: string | null, email: string): string {
  if (name && name.trim().length > 0) {
    return name.trim();
  }

  const [localPart] = email.split("@");
  return localPart || "SPURR Driver";
}

export async function GET(request: NextRequest) {
  const carId = request.nextUrl.searchParams.get("carId")?.trim() || "";

  if (!carId) {
    return NextResponse.json({ error: "carId is required." }, { status: 400 });
  }

  const reviews = await prisma.carReview.findMany({
    where: { carId },
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

  return NextResponse.json({
    reviews: reviews.map((review) => ({
      id: review.id,
      comment: review.content,
      createdAt: review.createdAt.toISOString(),
      userName: formatUserName(review.user.name, review.user.email),
      userEmail: review.user.email,
    })),
  });
}

export async function POST(request: NextRequest) {
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

  const carId = typeof payload?.carId === "string" ? payload.carId.trim() : "";
  const comment = typeof payload?.comment === "string" ? payload.comment.trim() : "";

  if (!carId) {
    return NextResponse.json({ error: "carId is required." }, { status: 400 });
  }

  if (!comment) {
    return NextResponse.json(
      { error: "Please write a comment before submitting." },
      { status: 400 }
    );
  }

  if (comment.length > 600) {
    return NextResponse.json(
      { error: "Comment is too long. Maximum 600 characters." },
      { status: 400 }
    );
  }

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
        userEmail: created.user.email,
      },
    },
    { status: 201 }
  );
}
