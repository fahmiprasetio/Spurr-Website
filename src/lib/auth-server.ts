import type { User } from "@prisma/client";
import { cookies } from "next/headers";
import { getUserBySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";

export type CurrentUser = Pick<User, "id" | "name" | "email" | "createdAt">;

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
  };
}
