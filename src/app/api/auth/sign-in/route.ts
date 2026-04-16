import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getSessionCookieOptions,
  normalizeEmail,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from "@/lib/auth";
import { hasAdminAccess } from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as
      | { email?: string; password?: string }
      | null;

    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isAdmin = await hasAdminAccess(user.id, user.role);

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: isAdmin ? "ADMIN" : user.role,
      },
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(expiresAt)
    );

    return response;
  } catch (error) {
    console.error("Sign in error:", error);
    return NextResponse.json(
      { error: "A server error occurred during sign in." },
      { status: 500 }
    );
  }
}
