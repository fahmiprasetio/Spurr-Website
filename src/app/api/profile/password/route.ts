import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json({ error: "You must sign in first." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { currentPassword?: string; newPassword?: string; confirmPassword?: string }
    | null;

  const currentPassword =
    typeof body?.currentPassword === "string" ? body.currentPassword : "";
  const newPassword = typeof body?.newPassword === "string" ? body.newPassword : "";
  const confirmPassword =
    typeof body?.confirmPassword === "string" ? body.confirmPassword : "";

  if (!currentPassword || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { error: "All password fields are required." },
      { status: 400 }
    );
  }

  if (newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { error: "Password confirmation does not match." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: currentUser.id },
    select: { id: true, passwordHash: true },
  });

  if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
    return NextResponse.json(
      { error: "Current password is incorrect." },
      { status: 401 }
    );
  }

  const nextHash = hashPassword(newPassword);

  await prisma.user.update({
    where: { id: currentUser.id },
    data: { passwordHash: nextHash },
  });

  return NextResponse.json({ ok: true });
}
