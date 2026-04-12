import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json(
      { error: "Anda belum sign in. Silakan sign in terlebih dahulu." },
      { status: 401 }
    );
  }

  const body = (await request.json().catch(() => null)) as
    | { carId?: string }
    | null;

  const carId = typeof body?.carId === "string" ? body.carId.trim() : "";

  if (!carId) {
    return NextResponse.json({ error: "carId wajib diisi." }, { status: 400 });
  }

  const targetCar = await prisma.car.findUnique({
    where: { id: carId },
    select: { id: true },
  });

  if (!targetCar) {
    return NextResponse.json({ error: "Mobil tidak ditemukan." }, { status: 404 });
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
    return NextResponse.json({ ok: true, inWishlist: false });
  }

  await prisma.wishlistItem.create({
    data: {
      userId: currentUser.id,
      carId,
    },
  });

  return NextResponse.json({ ok: true, inWishlist: true });
}
