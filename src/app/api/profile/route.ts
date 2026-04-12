import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { prisma } from "@/lib/prisma";

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

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "Anda harus sign in terlebih dahulu." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { name?: string; profileImage?: string }
    | null;

  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const profileImage =
    typeof body?.profileImage === "string" ? body.profileImage.trim() : "";

  if (name.length < 2 || name.length > 40) {
    return NextResponse.json(
      { error: "Username harus 2 sampai 40 karakter." },
      { status: 400 }
    );
  }

  if (!isValidImageUrl(profileImage)) {
    return NextResponse.json(
      { error: "URL foto profil tidak valid. Gunakan format http atau https." },
      { status: 400 }
    );
  }

  const updated = await prisma.user.update({
    where: { id: currentUser.id },
    data: {
      name,
      profileImage: profileImage || null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      profileImage: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ ok: true, user: updated });
}
