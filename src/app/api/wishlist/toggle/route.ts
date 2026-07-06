import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateEntityId } from "@/lib/validation";

type WishlistAction = "add" | "remove" | "toggle";

function isWishlistAction(value: string): value is WishlistAction {
  return value === "add" || value === "remove" || value === "toggle";
}

export async function POST(request: NextRequest) {
  const rateLimited = checkRateLimit(request, "mutation");
  if (rateLimited) return rateLimited;

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "You need to sign in before using this feature." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { carId?: string; action?: string }
    | null;

  const carIdValidation = validateEntityId(body?.carId, "carId");
  if (!carIdValidation.ok) {
    return NextResponse.json(
      { error: carIdValidation.error },
      { status: carIdValidation.status }
    );
  }

  const actionRaw = typeof body?.action === "string" ? body.action.trim().toLowerCase() : "toggle";

  if (!isWishlistAction(actionRaw)) {
    return NextResponse.json({ error: "Invalid wishlist action." }, { status: 400 });
  }

  const action: WishlistAction = actionRaw;
  const carId = carIdValidation.data;

  const targetCar = await prisma.car.findUnique({
    where: { id: carId },
    select: { id: true },
  });

  if (!targetCar) {
    return NextResponse.json({ error: "Car not found." }, { status: 404 });
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

  const shouldBeInWishlist = action === "toggle" ? !Boolean(existing) : action === "add";

  if (shouldBeInWishlist) {
    if (!existing) {
      try {
        await prisma.wishlistItem.create({
          data: {
            userId: currentUser.id,
            carId,
          },
        });
      } catch (error) {
        const isDuplicate =
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002";

        if (!isDuplicate) {
          console.error("wishlist add failed:", error);
          return NextResponse.json(
            { error: "Failed to update wishlist. Please try again." },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      ok: true,
      inWishlist: true,
      message: existing
        ? "Car is already in your wishlist."
        : "Car saved to wishlist.",
    });
  }

  const deleted = await prisma.wishlistItem.deleteMany({
    where: {
      userId: currentUser.id,
      carId,
    },
  });

  return NextResponse.json({
    ok: true,
    inWishlist: false,
    message:
      deleted.count > 0
        ? "Car removed from wishlist."
        : "Car was already removed from wishlist.",
  });
}
