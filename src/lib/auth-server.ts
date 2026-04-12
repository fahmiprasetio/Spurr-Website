import type { User, UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CurrentUser = Pick<User, "id" | "name" | "email" | "createdAt" | "role">;

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const user = await getUserBySessionToken(token);

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    role: user.role,
  };
}

export async function hasAdminAccess(userId: string, role: UserRole): Promise<boolean> {
  if (role === "ADMIN") {
    return true;
  }

  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  if (adminCount > 0) {
    return false;
  }

  const firstUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!firstUser || firstUser.id !== userId) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: "ADMIN" },
  });

  return true;
}
