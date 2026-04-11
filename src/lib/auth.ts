import { randomBytes, scryptSync, timingSafeEqual } from "crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const SESSION_COOKIE_NAME = "spurr_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 14;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedValue: string): boolean {
  const [salt, storedHash] = storedValue.split(":");
  if (!salt || !storedHash) {
    return false;
  }

  const derivedHash = scryptSync(password, salt, 64).toString("hex");

  try {
    return timingSafeEqual(
      Buffer.from(storedHash, "hex"),
      Buffer.from(derivedHash, "hex")
    );
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION_MS);
}

export function getSessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

export function getExpiredCookieOptions() {
  return getSessionCookieOptions(new Date(0));
}

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = createSessionToken();
  const expiresAt = getSessionExpiryDate();

  await prisma.session.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { token } });
}

export async function getUserBySessionToken(token: string): Promise<User | null> {
  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }

  return session.user;
}
