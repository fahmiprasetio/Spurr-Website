import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  getSessionCookieOptions,
  hashPassword,
  normalizeEmail,
  SESSION_COOKIE_NAME,
} from "@/lib/auth";

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null) as
      | { name?: string; email?: string; password?: string }
      | null;

    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email = typeof body?.email === "string" ? normalizeEmail(body.email) : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already registered." },
        { status: 409 }
      );
    }

    const userCount = await prisma.user.count();

    const user = await prisma.user.create({
      data: {
        name: name || null,
        email,
        passwordHash: hashPassword(password),
        role: userCount === 0 ? "ADMIN" : "USER",
      },
    });

    const { token, expiresAt } = await createSession(user.id);

    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      getSessionCookieOptions(expiresAt)
    );

    return response;
  } catch (error) {
    console.error("Sign up error:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown server error";

    const isDbConnectionIssue =
      error instanceof Prisma.PrismaClientInitializationError ||
      /Can't reach database server|ECONNREFUSED|ETIMEDOUT|ENOTFOUND|P1001/i.test(
        errorMessage
      );

    if (isDbConnectionIssue) {
      if (process.env.NODE_ENV !== "production") {
        return NextResponse.json(
          {
            error:
              "Database is currently unreachable. Please try again shortly or verify the database connection.",
            detail: errorMessage,
          },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Database is currently unreachable. Please try again shortly or verify the database connection.",
        },
        { status: 503 }
      );
    }

    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json(
        {
          error: "A server error occurred during sign up.",
          detail: errorMessage,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "A server error occurred during sign up." },
      { status: 500 }
    );
  }
}
